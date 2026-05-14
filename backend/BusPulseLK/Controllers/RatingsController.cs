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
