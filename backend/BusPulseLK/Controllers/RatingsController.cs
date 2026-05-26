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
    public class RatingsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RatingsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> RateBus([FromBody] CreateRatingDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            // Check if already rated
            var existing = await _context.Ratings
                .FirstOrDefaultAsync(r => r.PassengerId == userId.Value && r.BusId == dto.BusId);

            if (existing != null)
            {
                existing.Stars = dto.Stars;
                existing.Comment = dto.Comment;
                existing.CreatedAt = DateTime.UtcNow;
                _context.Ratings.Update(existing);
            }
            else
            {
                var rating = new Rating
                {
                    PassengerId = userId.Value,
                    BusId = dto.BusId,
                    Stars = dto.Stars,
                    Comment = dto.Comment,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Ratings.Add(rating);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Rating submitted successfully." });
        }

        // GET api/ratings/bus/{busId} — view ratings for a bus
        // Accessible by Passenger, Worker (assigned), Owner (own bus), Admin
        [HttpGet("bus/{busId}")]
        public async Task<IActionResult> GetByBus(int busId)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var bus = await _context.Buses
                .FirstOrDefaultAsync(b => b.Id == busId);
            if (bus == null) return NotFound(new { message = "Bus not found." });

            var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            // Role-based access check
            bool allowed =
                role == "Admin" ||
                (role == "Passenger") ||
                (bus.OwnerId == userId) ||
                (bus.DriverId == userId || bus.ConductorId == userId);

            if (!allowed) return Forbid();

            var ratings = await _context.Ratings
                .Include(r => r.Passenger)
                .Where(r => r.BusId == busId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            var avg = ratings.Count > 0 ? ratings.Average(r => r.Stars) : 0;

            return Ok(new
            {
                busId,
                averageStars = Math.Round(avg, 1),
                totalRatings = ratings.Count,
                ratings = ratings.Select(r => new
                {
                    r.Id,
                    r.Stars,
                    r.Comment,
                    r.CreatedAt,
                    passengerName = r.Passenger.FullName
                })
            });
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            return claim != null && int.TryParse(claim.Value, out var id) ? id : null;
        }
    }

    public class CreateRatingDto
    {
        public int BusId { get; set; }
        public int Stars { get; set; }
        public string? Comment { get; set; }
    }
}
