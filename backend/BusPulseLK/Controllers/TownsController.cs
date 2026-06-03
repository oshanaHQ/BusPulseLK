using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusPulseLK.Data;
using BusPulseLK.Models;
using System.Security.Claims; // ← IMPORTANT: Added this

namespace BusPulseLK.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]                    // Only Admins can access this controller
    public class TownsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TownsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/towns
        // Everyone can see the list of towns (no auth required)
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<Town>>> GetAllTowns()
        {
            var towns = await _context.Towns
                .OrderBy(t => t.Name)
                .ToListAsync();

            return Ok(towns);
        }

        // POST: api/towns
        // Only Admin can add new town
        [HttpPost]
        public async Task<ActionResult<Town>> AddTown([FromBody] CreateTownRequest request)
        {
            // Basic input validation
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest("Town name is required.");
            }

            // Check if town name already exists (case-insensitive)
            if (await _context.Towns.AnyAsync(t => t.Name.Trim().ToLower() == request.Name.Trim().ToLower()))
            {
                return BadRequest("A town with this name already exists.");
            }

            // Get current user's ID from JWT token (correct claim name)
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var adminId))
            {
                return Unauthorized("Invalid or missing user identity in token.");
            }

            var newTown = new Town
            {
                Name = request.Name.Trim(),
                Description = request.Description?.Trim(),
                CreatedById = adminId
            };

            _context.Towns.Add(newTown);
            await _context.SaveChangesAsync();

            // Return 201 Created with location
            return CreatedAtAction(nameof(GetAllTowns), new { id = newTown.Id }, newTown);
        }

        // DELETE: api/towns/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTown(int id)
        {
            var town = await _context.Towns.FindAsync(id);
            if (town == null) return NotFound();

            // Check if town is used in any routes (as origin, destination or stop)
            var isUsedInRoutes = await _context.Routes.AnyAsync(r => r.OriginTownId == id || r.DestinationTownId == id) 
                               || await _context.RouteStops.AnyAsync(rs => rs.TownId == id);
            
            if (isUsedInRoutes)
            {
                return BadRequest(new { message = "Cannot delete city. It is currently being used in one or more bus routes." });
            }

            // Check if used in ongoing trips or progress
            var isUsedInTrips = await _context.Trips.AnyAsync(t => t.LastPassedTownId == id)
                              || await _context.TownProgresses.AnyAsync(tp => tp.TownId == id);

            if (isUsedInTrips)
            {
                return BadRequest(new { message = "Cannot delete city. It has historical trip data associated with it." });
            }

            _context.Towns.Remove(town);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    // DTO for creating town (input validation)
    public class CreateTownRequest
    {
        public required string Name { get; set; }
        public string? Description { get; set; }
    }
}