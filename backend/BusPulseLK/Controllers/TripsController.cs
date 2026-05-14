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
    public class TripsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TripsController(AppDbContext context)
        {
            _context = context;
        }

        // ────────────────────────────────────────────────────────────────────
        // POST api/trips/start
        // Driver or Conductor assigned to the bus can start a trip
        // ────────────────────────────────────────────────────────────────────
        [HttpPost("start")]
        [Authorize]
        public async Task<ActionResult<TripResponseDto>> StartTrip([FromBody] StartTripDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var timetable = await _context.Timetables
                .Include(t => t.Bus)
                .Include(t => t.Route)
                .FirstOrDefaultAsync(t => t.Id == dto.TimetableId);

            if (timetable == null) return NotFound(new { message = "Timetable entry not found." });

            // Verify the user is assigned to this bus
            if (timetable.Bus.DriverId != userId && timetable.Bus.ConductorId != userId)
                return Forbid();

            // Check if there's an active trip for this bus today
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var existingTrip = await _context.Trips
                .FirstOrDefaultAsync(t => t.TimetableId == dto.TimetableId && t.TripDate == today && t.Status != "Completed" && t.Status != "Cancelled");

            if (existingTrip != null)
                return Ok(MapToDto(existingTrip));

            var trip = new Trip
            {
                TimetableId = dto.TimetableId,
                TripDate = today,
                Status = "Started",
                CreatedAt = DateTime.UtcNow
            };

            _context.Trips.Add(trip);
            await _context.SaveChangesAsync();

            // Reload to ensure all properties are fresh
            var savedTrip = await _context.Trips
                .FirstOrDefaultAsync(t => t.Id == trip.Id);

            return StatusCode(201, MapToDto(savedTrip!));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TripResponseDto>> GetById(int id)
        {
            var trip = await _context.Trips
                .Include(t => t.Timetable)
                    .ThenInclude(tt => tt.Bus)
                .Include(t => t.Timetable)
                    .ThenInclude(tt => tt.Route)
                .Include(t => t.TownProgresses)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (trip == null) return NotFound();

            return Ok(MapToDto(trip));
        }

        // ────────────────────────────────────────────────────────────────────
        // POST api/trips/{id}/progress
        // Mark a town as passed
        // ────────────────────────────────────────────────────────────────────
        [HttpPost("{id}/progress")]
        [Authorize]
        public async Task<IActionResult> UpdateProgress(int id, [FromBody] UpdateProgressDto dto)
        {
            var userId = GetCurrentUserId();
            var trip = await _context.Trips
                .Include(t => t.Timetable).ThenInclude(tt => tt.Bus)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (trip == null) return NotFound();

            // Verify user assignment
            if (trip.Timetable.Bus.DriverId != userId && trip.Timetable.Bus.ConductorId != userId)
                return Forbid();

            // Check if already passed to avoid unique constraint violation
            var alreadyPassed = await _context.TownProgresses
                .AnyAsync(p => p.TripId == id && p.TownId == dto.TownId);
            
            if (alreadyPassed)
            {
                return Ok(new { message = "Town already marked as passed." });
            }

            var progress = new TownProgress
            {
                TripId = id,
                TownId = dto.TownId,
                PassedAt = DateTime.UtcNow,
                UpdatedByUserId = userId.Value
            };

            _context.TownProgresses.Add(progress);
            trip.LastPassedTownId = dto.TownId;
            
            await _context.SaveChangesAsync();

            return Ok(new { message = "Progress updated." });
        }

        [HttpPost("{id}/end")]
        [Authorize]
        public async Task<IActionResult> EndTrip(int id)
        {
            var userId = GetCurrentUserId();
            var trip = await _context.Trips
                .Include(t => t.Timetable).ThenInclude(tt => tt.Bus)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (trip == null) return NotFound();

            if (trip.Timetable.Bus.DriverId != userId && trip.Timetable.Bus.ConductorId != userId)
                return Forbid();

            trip.Status = "Completed";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Trip completed." });
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            return claim != null && int.TryParse(claim.Value, out var id) ? id : null;
        }

        private TripResponseDto MapToDto(Trip t) => new()
        {
            Id = t.Id,
            Status = t.Status,
            TripDate = t.TripDate.ToString("yyyy-MM-dd"),
            TimetableId = t.TimetableId,
            LastPassedTownId = t.LastPassedTownId,
            IsActive = t.Status != "Completed" && t.Status != "Cancelled"
        };
    }

    public class StartTripDto
    {
        public int TimetableId { get; set; }
    }

    public class UpdateProgressDto
    {
        public int TownId { get; set; }
    }

    public class TripResponseDto
    {
        public int Id { get; set; }
        public string Status { get; set; }
        public string TripDate { get; set; }
        public int TimetableId { get; set; }
        public int? LastPassedTownId { get; set; }
        public bool IsActive { get; set; }
    }
}
