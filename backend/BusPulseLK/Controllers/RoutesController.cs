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
    public class RoutesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RoutesController(AppDbContext context)
        {
            _context = context;
        }

        // ────────────────────────────────────────────────────────────────────
        // GET api/routes
        // Public – anyone can list active routes
        // ────────────────────────────────────────────────────────────────────
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<RouteResponseDto>>> GetAll(
            [FromQuery] bool? activeOnly = true)
        {
            var query = _context.Routes
                .Include(r => r.OriginTown)
                .Include(r => r.DestinationTown)
                .Include(r => r.Stops.OrderBy(s => s.StopOrder))
                    .ThenInclude(s => s.Town)
                .AsQueryable();

            if (activeOnly == true)
                query = query.Where(r => r.IsActive);

            var routes = await query
                .OrderBy(r => r.Name)
                .Select(r => MapToDto(r))
                .ToListAsync();

            return Ok(routes);
        }

        // ────────────────────────────────────────────────────────────────────
        // GET api/routes/{id}
        // Public
        // ────────────────────────────────────────────────────────────────────
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<RouteResponseDto>> GetById(int id)
        {
            var route = await _context.Routes
                .Include(r => r.OriginTown)
                .Include(r => r.DestinationTown)
                .Include(r => r.Stops.OrderBy(s => s.StopOrder))
                    .ThenInclude(s => s.Town)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (route == null) return NotFound(new { message = "Route not found." });

            return Ok(MapToDto(route));
        }

        // ────────────────────────────────────────────────────────────────────
        // POST api/routes
        // Admin only
        // ────────────────────────────────────────────────────────────────────
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<RouteResponseDto>> Create([FromBody] CreateRouteDto dto)
        {
            // Validate origin ≠ destination
            if (dto.OriginTownId == dto.DestinationTownId)
                return BadRequest(new { message = "Origin and destination towns must be different." });

            // Validate stops list
            if (dto.StopTownIds.First() != dto.OriginTownId)
                return BadRequest(new { message = "First stop must be the origin town." });

            if (dto.StopTownIds.Last() != dto.DestinationTownId)
                return BadRequest(new { message = "Last stop must be the destination town." });

            if (dto.StopTownIds.Distinct().Count() != dto.StopTownIds.Count)
                return BadRequest(new { message = "Duplicate towns in stop list." });

            // Verify all town IDs exist
            var townIds = dto.StopTownIds.Distinct().ToList();
            var existingTownIds = await _context.Towns
                .Where(t => townIds.Contains(t.Id))
                .Select(t => t.Id)
                .ToListAsync();

            var missingTownIds = townIds.Except(existingTownIds).ToList();
            if (missingTownIds.Any())
                return BadRequest(new { message = $"Town IDs not found: {string.Join(", ", missingTownIds)}" });

            var adminId = GetCurrentUserId();
            if (adminId == null) return Unauthorized();

            var route = new BusPulseLK.Models.Route
            {
                Name            = dto.Name.Trim(),
                RouteNumber     = dto.RouteNumber.Trim(),
                OriginTownId    = dto.OriginTownId,
                DestinationTownId = dto.DestinationTownId,
                CreatedById     = adminId.Value,
            };

            // Build RouteStop entries
            for (int i = 0; i < dto.StopTownIds.Count; i++)
            {
                route.Stops.Add(new RouteStop
                {
                    TownId    = dto.StopTownIds[i],
                    StopOrder = i + 1
                });
            }

            _context.Routes.Add(route);
            await _context.SaveChangesAsync();

            // Reload with navigation properties
            await _context.Entry(route).Reference(r => r.OriginTown).LoadAsync();
            await _context.Entry(route).Reference(r => r.DestinationTown).LoadAsync();
            await _context.Entry(route).Collection(r => r.Stops).Query()
                .Include(s => s.Town).LoadAsync();

            return CreatedAtAction(nameof(GetById), new { id = route.Id }, MapToDto(route));
        }

        // ────────────────────────────────────────────────────────────────────
        // PUT api/routes/{id}
        // Admin only
        // ────────────────────────────────────────────────────────────────────
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<RouteResponseDto>> Update(int id, [FromBody] UpdateRouteDto dto)
        {
            var route = await _context.Routes
                .Include(r => r.OriginTown)
                .Include(r => r.DestinationTown)
                .Include(r => r.Stops)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (route == null) return NotFound(new { message = "Route not found." });

            if (dto.Name != null)        route.Name        = dto.Name.Trim();
            if (dto.RouteNumber != null) route.RouteNumber = dto.RouteNumber.Trim();
            if (dto.IsActive.HasValue)   route.IsActive    = dto.IsActive.Value;

            // Replace stops if provided
            if (dto.StopTownIds != null && dto.StopTownIds.Count >= 2)
            {
                if (dto.StopTownIds.Distinct().Count() != dto.StopTownIds.Count)
                    return BadRequest(new { message = "Duplicate towns in stop list." });

                // Verify all towns exist
                var townIds = dto.StopTownIds.Distinct().ToList();
                var existingIds = await _context.Towns
                    .Where(t => townIds.Contains(t.Id))
                    .Select(t => t.Id).ToListAsync();

                var missing = townIds.Except(existingIds).ToList();
                if (missing.Any())
                    return BadRequest(new { message = $"Town IDs not found: {string.Join(", ", missing)}" });

                // Remove old stops and add new ones
                _context.RouteStops.RemoveRange(route.Stops);
                route.Stops.Clear();

                for (int i = 0; i < dto.StopTownIds.Count; i++)
                {
                    route.Stops.Add(new RouteStop
                    {
                        RouteId   = route.Id,
                        TownId    = dto.StopTownIds[i],
                        StopOrder = i + 1
                    });
                }

                // Update origin/destination from new stop list
                route.OriginTownId      = dto.StopTownIds.First();
                route.DestinationTownId = dto.StopTownIds.Last();
            }

            await _context.SaveChangesAsync();

            // Reload
            await _context.Entry(route).Reference(r => r.OriginTown).LoadAsync();
            await _context.Entry(route).Reference(r => r.DestinationTown).LoadAsync();
            await _context.Entry(route).Collection(r => r.Stops).Query()
                .Include(s => s.Town).LoadAsync();

            return Ok(MapToDto(route));
        }

        // ────────────────────────────────────────────────────────────────────
        // GET api/routes/{id}/buses
        // Returns all active buses assigned to this route (via timetables).
        // Grouped by bus — each bus entry includes its departure time slots.
        // Public read.
        // ────────────────────────────────────────────────────────────────────
        [HttpGet("{id}/buses")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<RouteBusAssignmentDto>>> GetRouteBuses(int id)
        {
            var routeExists = await _context.Routes.AnyAsync(r => r.Id == id);
            if (!routeExists) return NotFound(new { message = "Route not found." });

            var timetables = await _context.Timetables
                .Include(t => t.Bus).ThenInclude(b => b.Owner)
                .Include(t => t.Bus).ThenInclude(b => b.Driver)
                .Include(t => t.Bus).ThenInclude(b => b.Conductor)
                .Include(t => t.StationTimes).ThenInclude(st => st.RouteStop)
                .Where(t => t.RouteId == id && t.IsActive && t.Bus.IsActive)
                .OrderBy(t => t.DepartureTime)
                .ToListAsync();

            // Group by bus so each bus appears once with all its departure slots
            var grouped = timetables
                .GroupBy(t => t.BusId)
                .Select(g => new RouteBusAssignmentDto
                {
                    Bus = new BusResponseDto
                    {
                        Id              = g.First().Bus.Id,
                        NumberPlate     = g.First().Bus.NumberPlate,
                        Name            = g.First().Bus.Name,
                        BusType         = g.First().Bus.BusType,
                        SeatingCapacity = g.First().Bus.SeatingCapacity,
                        IsActive        = g.First().Bus.IsActive,
                        CreatedAt       = g.First().Bus.CreatedAt,
                        Owner     = MapUserSummary(g.First().Bus.Owner),
                        Driver    = g.First().Bus.Driver    != null ? MapUserSummary(g.First().Bus.Driver!)    : null,
                        Conductor = g.First().Bus.Conductor != null ? MapUserSummary(g.First().Bus.Conductor!) : null,
                    },
                    DepartureSlots = g.Select(t => new DepartureSlotDto
                    {
                        TimetableId   = t.Id,
                        DepartureTime = t.DepartureTime.ToString(@"hh\:mm"),
                        OperatingDays = t.OperatingDays,
                        StationTimes = t.StationTimes?.Select(st => new StationTimeDto
                        {
                            RouteStopId = st.RouteStopId,
                            TownId = st.RouteStop?.TownId ?? 0,
                            ExpectedTime = st.ExpectedTime.ToString(@"hh\:mm")
                        }).ToList() ?? new List<StationTimeDto>()
                    }).ToList()
                })
                .ToList();

            return Ok(grouped);
        }

        // ────────────────────────────────────────────────────────────────────
        // GET api/routes/{id}/stops
        // Flat ordered list of towns on a route (for live tracking dropdowns).
        // Public read.
        // ────────────────────────────────────────────────────────────────────
        [HttpGet("{id}/stops")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<RouteStopDto>>> GetRouteStops(int id)
        {
            var routeExists = await _context.Routes.AnyAsync(r => r.Id == id);
            if (!routeExists) return NotFound(new { message = "Route not found." });

            var stops = await _context.RouteStops
                .Include(s => s.Town)
                .Where(s => s.RouteId == id)
                .OrderBy(s => s.StopOrder)
                .Select(s => new RouteStopDto
                {
                    Id        = s.Id,
                    StopOrder = s.StopOrder,
                    Town      = new TownSummaryDto { Id = s.Town.Id, Name = s.Town.Name }
                })
                .ToListAsync();

            return Ok(stops);
        }

        // ────────────────────────────────────────────────────────────────────
        // DELETE api/routes/{id}
        // Admin only – soft delete (sets IsActive = false)
        // ────────────────────────────────────────────────────────────────────
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var route = await _context.Routes.FindAsync(id);
            if (route == null) return NotFound(new { message = "Route not found." });

            route.IsActive = false;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Route deactivated successfully." });
        }

        // ────────────────────────────────────────────────────────────────────
        // Helpers
        // ────────────────────────────────────────────────────────────────────
        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            return claim != null && int.TryParse(claim.Value, out var id) ? id : null;
        }

        private static UserSummaryDto MapUserSummary(User u) => new()
        {
            Id       = u.Id,
            FullName = u.FullName,
            Email    = u.Email,
            Role     = u.Role,
        };

        private static RouteResponseDto MapToDto(BusPulseLK.Models.Route r) => new()
        {
            Id          = r.Id,
            Name        = r.Name,
            RouteNumber = r.RouteNumber,
            IsActive    = r.IsActive,
            CreatedAt   = r.CreatedAt,
            OriginTown  = new TownSummaryDto { Id = r.OriginTown.Id, Name = r.OriginTown.Name },
            DestinationTown = new TownSummaryDto { Id = r.DestinationTown.Id, Name = r.DestinationTown.Name },
            Stops = r.Stops.OrderBy(s => s.StopOrder).Select(s => new RouteStopDto
            {
                Id        = s.Id,
                StopOrder = s.StopOrder,
                Town      = new TownSummaryDto { Id = s.Town.Id, Name = s.Town.Name }
            }).ToList()
        };
    }
}
