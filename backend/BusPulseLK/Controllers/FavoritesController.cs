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
    public class FavoritesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FavoritesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<BusResponseDto>>> GetMyFavorites()
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var favorites = await _context.Favorites
                .Include(f => f.Bus).ThenInclude(b => b.Owner)
                .Include(f => f.Bus).ThenInclude(b => b.Driver)
                .Include(f => f.Bus).ThenInclude(b => b.Conductor)
                .Where(f => f.PassengerId == userId.Value)
                .Select(f => MapBusToDto(f.Bus))
                .ToListAsync();

            return Ok(favorites);
        }

        [HttpPost("toggle/{busId}")]
        public async Task<IActionResult> ToggleFavorite(int busId)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var existing = await _context.Favorites
                .FirstOrDefaultAsync(f => f.PassengerId == userId.Value && f.BusId == busId);

            if (existing != null)
            {
                _context.Favorites.Remove(existing);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Removed from favorites.", isFavorite = false });
            }

            var favorite = new Favorite
            {
                PassengerId = userId.Value,
                BusId = busId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Favorites.Add(favorite);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Added to favorites.", isFavorite = true });
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            return claim != null && int.TryParse(claim.Value, out var id) ? id : null;
        }

        private static BusResponseDto MapBusToDto(Bus b) => new()
        {
            Id              = b.Id,
            NumberPlate     = b.NumberPlate,
            Name            = b.Name,
            BusType         = b.BusType,
            SeatingCapacity = b.SeatingCapacity,
            IsActive        = b.IsActive,
            CreatedAt       = b.CreatedAt,
            Owner           = MapUserSummary(b.Owner),
            Driver          = b.Driver != null ? MapUserSummary(b.Driver) : null,
            Conductor       = b.Conductor != null ? MapUserSummary(b.Conductor) : null
        };

        private static UserSummaryDto MapUserSummary(User u) => new()
        {
            Id       = u.Id,
            FullName = u.FullName,
            Email    = u.Email,
            Role     = u.Role,
        };
    }
}
