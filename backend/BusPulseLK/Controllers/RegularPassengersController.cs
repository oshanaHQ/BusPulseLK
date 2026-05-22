using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusPulseLK.Data;
using BusPulseLK.Models;
using System.Security.Claims;

namespace BusPulseLK.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RegularPassengersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RegularPassengersController(AppDbContext context)
        {
            _context = context;
        }

        // ── Helpers ──────────────────────────────────────────────────────────
        private int? GetUserId()
        {
            var c = User.FindFirst(ClaimTypes.NameIdentifier);
            return c != null && int.TryParse(c.Value, out var id) ? id : null;
        }
        private string? GetRole() => User.FindFirst(ClaimTypes.Role)?.Value;

        // Returns the bus the current worker (driver/conductor) is assigned to
        private async Task<Bus?> GetWorkerBus(int userId)
        {
            return await _context.Buses
                .FirstOrDefaultAsync(b => b.IsActive && (b.DriverId == userId || b.ConductorId == userId));
        }

        // ────────────────────────────────────────────────────────────────────
        // GET api/regularpassengers/my-bus
        // Worker: list all regular passenger requests (any status) for their bus
        // ────────────────────────────────────────────────────────────────────
        [HttpGet("my-bus")]
        [Authorize(Roles = "Driver,Conductor")]
        public async Task<IActionResult> GetForMyBus()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var bus = await GetWorkerBus(userId.Value);
            if (bus == null) return NotFound(new { message = "You are not currently assigned to any bus." });

            var requests = await _context.RegularPassengerRequests
                .Include(r => r.Passenger)
                .Include(r => r.NominatedByUser)
                .Include(r => r.ReviewedBy)
                .Where(r => r.BusId == bus.Id)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => MapToDto(r, bus))
                .ToListAsync();

            return Ok(requests);
        }

        // ────────────────────────────────────────────────────────────────────
        // GET api/regularpassengers/pending
        // Admin: list all pending nominations
        // ────────────────────────────────────────────────────────────────────
        [HttpGet("pending")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetPending([FromQuery] string? status = "Pending")
        {
            var requests = await _context.RegularPassengerRequests
                .Include(r => r.Passenger)
                .Include(r => r.Bus)
                .Include(r => r.NominatedByUser)
                .Include(r => r.ReviewedBy)
                .Where(r => status == null || r.Status == status)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return Ok(requests.Select(r => MapToDto(r, r.Bus)));
        }

        // ────────────────────────────────────────────────────────────────────
        // GET api/regularpassengers/my-status
        // Passenger: check their own approved regular passenger status
        // ────────────────────────────────────────────────────────────────────
        [HttpGet("my-status")]
        [Authorize(Roles = "Passenger")]
        public async Task<IActionResult> GetMyStatus()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var approved = await _context.RegularPassengerRequests
                .Include(r => r.Bus)
                    .ThenInclude(b => b.Driver)
                .Include(r => r.Bus)
                    .ThenInclude(b => b.Conductor)
                .Where(r => r.PassengerId == userId.Value && r.Status == "Approved")
                .ToListAsync();

            var result = approved.Select(r => new
            {
                requestId = r.Id,
                busId = r.BusId,
                busNumberPlate = r.Bus.NumberPlate,
                busName = r.Bus.Name,
                busType = r.Bus.BusType,
                approvedAt = r.ReviewedAt,
            });

            return Ok(result);
        }

        // ────────────────────────────────────────────────────────────────────
        // POST api/regularpassengers/nominate
        // Worker: nominate a passenger by email for their current bus
        // ────────────────────────────────────────────────────────────────────
        [HttpPost("nominate")]
        [Authorize(Roles = "Driver,Conductor")]
        public async Task<IActionResult> Nominate([FromBody] NominatePassengerDto dto)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var bus = await GetWorkerBus(userId.Value);
            if (bus == null)
                return NotFound(new { message = "You are not currently assigned to any bus." });

            // Find passenger by email
            var passenger = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == dto.PassengerEmail && u.Role == "Passenger");

            if (passenger == null)
                return NotFound(new { message = "No passenger account found with that email." });

            // Check for existing request on this bus
            var existing = await _context.RegularPassengerRequests
                .FirstOrDefaultAsync(r => r.PassengerId == passenger.Id && r.BusId == bus.Id);

            if (existing != null)
                return BadRequest(new { message = $"This passenger already has a '{existing.Status}' request for this bus." });

            var request = new RegularPassengerRequest
            {
                PassengerId = passenger.Id,
                BusId = bus.Id,
                NominatedByUserId = userId.Value,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
            };

            _context.RegularPassengerRequests.Add(request);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"{passenger.FullName} has been nominated. Awaiting admin approval." });
        }

        // ────────────────────────────────────────────────────────────────────
        // DELETE api/regularpassengers/{id}
        // Worker: remove a regular passenger from their current bus
        // ────────────────────────────────────────────────────────────────────
        [HttpDelete("{id}")]
        [Authorize(Roles = "Driver,Conductor")]
        public async Task<IActionResult> Remove(int id)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var bus = await GetWorkerBus(userId.Value);
            if (bus == null)
                return NotFound(new { message = "You are not currently assigned to any bus." });

            var request = await _context.RegularPassengerRequests
                .Include(r => r.Passenger)
                .FirstOrDefaultAsync(r => r.Id == id && r.BusId == bus.Id);

            if (request == null)
                return NotFound(new { message = "Request not found for your bus." });

            _context.RegularPassengerRequests.Remove(request);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Regular passenger removed." });
        }

        // ────────────────────────────────────────────────────────────────────
        // POST api/regularpassengers/{id}/approve
        // Admin: approve a nomination
        // ────────────────────────────────────────────────────────────────────
        [HttpPost("{id}/approve")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Approve(int id)
        {
            var adminId = GetUserId();
            if (adminId == null) return Unauthorized();

            var request = await _context.RegularPassengerRequests
                .Include(r => r.Passenger)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null) return NotFound(new { message = "Request not found." });
            if (request.Status != "Pending")
                return BadRequest(new { message = "Only pending requests can be approved." });

            request.Status = "Approved";
            request.ReviewedByUserId = adminId.Value;
            request.ReviewedAt = DateTime.UtcNow;

            // Also set the user's IsRegularPassenger flag
            var passenger = await _context.Users.FindAsync(request.PassengerId);
            if (passenger != null) passenger.IsRegularPassenger = true;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Passenger approved as regular passenger." });
        }

        // ────────────────────────────────────────────────────────────────────
        // POST api/regularpassengers/{id}/reject
        // Admin: reject a nomination
        // ────────────────────────────────────────────────────────────────────
        [HttpPost("{id}/reject")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Reject(int id)
        {
            var adminId = GetUserId();
            if (adminId == null) return Unauthorized();

            var request = await _context.RegularPassengerRequests
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null) return NotFound(new { message = "Request not found." });
            if (request.Status != "Pending")
                return BadRequest(new { message = "Only pending requests can be rejected." });

            request.Status = "Rejected";
            request.ReviewedByUserId = adminId.Value;
            request.ReviewedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Nomination rejected." });
        }

        // ────────────────────────────────────────────────────────────────────
        // Helpers
        // ────────────────────────────────────────────────────────────────────
        private static object MapToDto(RegularPassengerRequest r, Bus? bus) => new
        {
            id = r.Id,
            status = r.Status,
            createdAt = r.CreatedAt,
            reviewedAt = r.ReviewedAt,
            passenger = new { id = r.Passenger.Id, fullName = r.Passenger.FullName, email = r.Passenger.Email },
            nominatedBy = r.NominatedByUser != null ? new { id = r.NominatedByUser.Id, fullName = r.NominatedByUser.FullName } : null,
            reviewedBy = r.ReviewedBy != null ? new { id = r.ReviewedBy.Id, fullName = r.ReviewedBy.FullName } : null,
            bus = bus != null ? new { id = bus.Id, numberPlate = bus.NumberPlate, name = bus.Name } : null,
        };
    }

    public class NominatePassengerDto
    {
        public string PassengerEmail { get; set; } = null!;
    }
}
