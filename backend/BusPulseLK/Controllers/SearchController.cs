using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusPulseLK.Data;
using BusPulseLK.Models;
using System.Security.Claims;

namespace BusPulseLK.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SearchController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SearchController(AppDbContext context)
        {
            _context = context;
        }

        // ────────────────────────────────────────────────────────────────────
        // GET api/search/buses
        // Search buses by name, route number, or origin/destination towns.
        // Optional time filter.
        // ────────────────────────────────────────────────────────────────────
        [HttpGet("buses")]
        public async Task<ActionResult<IEnumerable<SearchResultDto>>> SearchBuses(
            [FromQuery] string? name,
            [FromQuery] string? routeNumber,
            [FromQuery] int? originTownId,
            [FromQuery] int? destinationTownId,
            [FromQuery] string? startTime)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int? userId = int.TryParse(userIdStr, out var id) ? id : null;

            var query = _context.Timetables
                .Include(t => t.Bus).ThenInclude(b => b.Owner)
                .Include(t => t.Route).ThenInclude(r => r.Stops).ThenInclude(s => s.Town)
                .Where(t => t.IsActive && t.Bus.IsActive && t.Route.IsActive)
                .AsQueryable();

            // 1. Filter by Name (Bus or Route)
            if (!string.IsNullOrWhiteSpace(name))
            {
                query = query.Where(t => 
                    (t.Bus.Name != null && t.Bus.Name.ToLower().Contains(name.ToLower())) || 
                    t.Route.Name.ToLower().Contains(name.ToLower()));
            }

            // 2. Filter by Route Number
            if (!string.IsNullOrWhiteSpace(routeNumber))
            {
                query = query.Where(t => t.Route.RouteNumber.ToLower().Contains(routeNumber.ToLower()));
            }

            // 3. Filter by Origin & Destination
            if (originTownId.HasValue && destinationTownId.HasValue)
            {
                // This is a bit complex: find routes that have BOTH towns, and origin comes before destination
                query = query.Where(t => 
                    t.Route.Stops.Any(s => s.TownId == originTownId.Value) &&
                    t.Route.Stops.Any(s => s.TownId == destinationTownId.Value) &&
                    t.Route.Stops.Where(s => s.TownId == originTownId.Value).Select(s => s.StopOrder).FirstOrDefault() <
                    t.Route.Stops.Where(s => s.TownId == destinationTownId.Value).Select(s => s.StopOrder).FirstOrDefault()
                );
            }
            else if (originTownId.HasValue)
            {
                query = query.Where(t => t.Route.Stops.Any(s => s.TownId == originTownId.Value));
            }
            else if (destinationTownId.HasValue)
            {
                query = query.Where(t => t.Route.Stops.Any(s => s.TownId == destinationTownId.Value));
            }

            // 4. Filter by Time
            if (!string.IsNullOrWhiteSpace(startTime) && TimeSpan.TryParse(startTime, out var time))
            {
                // Find buses departing AFTER this time
                query = query.Where(t => t.DepartureTime >= time);
            }

            var results = await query
                .OrderBy(t => t.DepartureTime)
                .Select(t => new SearchResultDto
                {
                    TimetableId   = t.Id,
                    DepartureTime = t.DepartureTime.ToString(@"hh\:mm"),
                    OperatingDays = t.OperatingDays,
                    Bus = new BusSummaryDto
                    {
                        Id          = t.Bus.Id,
                        NumberPlate = t.Bus.NumberPlate,
                        Name        = t.Bus.Name,
                        BusType     = t.Bus.BusType
                    },
                    Route = new RouteSummaryDto
                    {
                        Id          = t.Route.Id,
                        Name        = t.Route.Name,
                        RouteNumber = t.Route.RouteNumber,
                        OriginTown  = t.Route.OriginTown.Name,
                        DestinationTown = t.Route.DestinationTown.Name
                    },
                    IsFavorite = userId != null && _context.Favorites.Any(f => f.PassengerId == userId && f.BusId == t.BusId)
                })
                .ToListAsync();

            return Ok(results);
        }
    }

    public class SearchResultDto
    {
        public int TimetableId { get; set; }
        public string DepartureTime { get; set; } = null!;
        public string OperatingDays { get; set; } = null!;
        public BusSummaryDto Bus { get; set; } = null!;
        public RouteSummaryDto Route { get; set; } = null!;
        public bool IsFavorite { get; set; }
    }
}
