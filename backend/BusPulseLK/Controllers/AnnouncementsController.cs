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
    public class AnnouncementsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AnnouncementsController(AppDbContext context)
        {
            _context = context;
        }

        // ── GET /api/announcements/my-feed ────────────────────────────────────
        // Passenger: returns announcements for all their favourited buses
        [HttpGet("my-feed")]
        public async Task<IActionResult> GetFeed()
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            // Get all bus IDs that this passenger has favourited
            var favBusIds = await _context.Favorites
                .Where(f => f.PassengerId == userId)
                .Select(f => f.BusId)
                .ToListAsync();

            if (!favBusIds.Any())
                return Ok(new List<object>());

            var announcements = await _context.Announcements
                .Include(a => a.Bus)
                .Include(a => a.CreatedBy)
                .Where(a => favBusIds.Contains(a.BusId))
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return Ok(announcements.Select(a => new
            {
                a.Id,
                a.Title,
                a.Message,
                a.Type,
                a.CreatedAt,
                bus = new { a.Bus.Id, a.Bus.NumberPlate, name = a.Bus.Name ?? a.Bus.NumberPlate, a.Bus.BusType },
                postedBy = a.CreatedBy.FullName
            }));
        }

        // ── GET /api/announcements/bus/{busId} ────────────────────────────────
        // Owner / Worker / Admin: view all announcements for a specific bus
        [HttpGet("bus/{busId}")]
        public async Task<IActionResult> GetByBus(int busId)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var bus = await _context.Buses.FirstOrDefaultAsync(b => b.Id == busId);
            if (bus == null) return NotFound(new { message = "Bus not found." });

            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            bool allowed = role == "Admin"
                || bus.OwnerId == userId
                || bus.DriverId == userId
                || bus.ConductorId == userId;

            if (!allowed) return Forbid();

            var announcements = await _context.Announcements
                .Include(a => a.CreatedBy)
                .Where(a => a.BusId == busId)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return Ok(announcements.Select(a => new
            {
                a.Id,
                a.Title,
                a.Message,
                a.Type,
                a.CreatedAt,
                a.CreatedById,
                postedBy = a.CreatedBy.FullName
            }));
        }

        // ── POST /api/announcements ───────────────────────────────────────────
        // Worker: must be assigned to the bus. Owner: must own the bus.
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateAnnouncementDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var bus = await _context.Buses.FirstOrDefaultAsync(b => b.Id == dto.BusId);
            if (bus == null) return NotFound(new { message = "Bus not found." });

            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            bool allowed = bus.OwnerId == userId
                || bus.DriverId == userId
                || bus.ConductorId == userId
                || role == "Admin";

            if (!allowed) return Forbid();

            var announcement = new Announcement
            {
                BusId = dto.BusId,
                TripId = dto.TripId,
                Title = dto.Title,
                Message = dto.Message,
                Type = dto.Type ?? "General",
                CreatedById = userId.Value,
                CreatedAt = DateTime.UtcNow
            };

            _context.Announcements.Add(announcement);
            await _context.SaveChangesAsync();

            return StatusCode(201, new { message = "Announcement posted.", id = announcement.Id });
        }

        // ── PUT /api/announcements/{id} ───────────────────────────────────────
        // Only the original poster can edit
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateAnnouncementDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var announcement = await _context.Announcements.FindAsync(id);
            if (announcement == null) return NotFound();
            if (announcement.CreatedById != userId) return Forbid();

            announcement.Title = dto.Title ?? announcement.Title;
            announcement.Message = dto.Message ?? announcement.Message;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Announcement updated." });
        }

        // ── DELETE /api/announcements/{id} ────────────────────────────────────
        // Original poster OR bus owner can delete
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var announcement = await _context.Announcements
                .Include(a => a.Bus)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (announcement == null) return NotFound();

            bool canDelete = announcement.CreatedById == userId
                || announcement.Bus.OwnerId == userId;

            if (!canDelete) return Forbid();

            _context.Announcements.Remove(announcement);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Announcement deleted." });
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            return claim != null && int.TryParse(claim.Value, out var id) ? id : null;
        }
    }

    public class CreateAnnouncementDto
    {
        public int BusId { get; set; }
        public int? TripId { get; set; }
        public string Title { get; set; } = null!;
        public string Message { get; set; } = null!;
        public string? Type { get; set; }
    }

    public class UpdateAnnouncementDto
    {
        public string? Title { get; set; }
        public string? Message { get; set; }
    }
}
