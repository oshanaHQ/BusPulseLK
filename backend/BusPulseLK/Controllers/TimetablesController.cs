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
    public class TimetablesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TimetablesController(AppDbContext context)
        {
            _context = context;
        }

        // ────────────────────────────────────────────────────────────────────
        // GET api/timetables
        // Public – supports filtering by routeId and/or busId
        // ────────────────────────────────────────────────────────────────────
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<TimetableResponseDto>>> GetAll(
            [FromQuery] int? routeId = null,
            [FromQuery] int? busId = null,
            [FromQuery] bool? activeOnly = true)
        {
            var query = _context.Timetables
                .Include(t => t.Bus)
                .Include(t => t.Route)
                    .ThenInclude(r => r.OriginTown)
                .Include(t => t.Route)
                    .ThenInclude(r => r.DestinationTown)
                .Include(t => t.StationTimes).ThenInclude(st => st.RouteStop)
                .AsQueryable();

            if (activeOnly == true)
                query = query.Where(t => t.IsActive);

            if (routeId.HasValue)
                query = query.Where(t => t.RouteId == routeId.Value);

            if (busId.HasValue)
                query = query.Where(t => t.BusId == busId.Value);

            var result = await query
                .OrderBy(t => t.DepartureTime)
                .Select(t => MapToDto(t))
                .ToListAsync();

            return Ok(result);
        }

        // ────────────────────────────────────────────────────────────────────
        // GET api/timetables/{id}
        // ────────────────────────────────────────────────────────────────────
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<TimetableResponseDto>> GetById(int id)
        {
            var timetable = await _context.Timetables
                .Include(t => t.Bus)
                .Include(t => t.Route).ThenInclude(r => r.OriginTown)
                .Include(t => t.Route).ThenInclude(r => r.DestinationTown)
                .Include(t => t.StationTimes).ThenInclude(st => st.RouteStop)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (timetable == null)
                return NotFound(new { message = "Timetable entry not found." });

            return Ok(MapToDto(timetable));
        }

        // ────────────────────────────────────────────────────────────────────
        // GET api/timetables/search?origin={id}&destination={id}&time={HH:mm}
        // Public – find buses on a route passing through origin and destination
        // ────────────────────────────────────────────────────────────────────
        [HttpGet("search")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<TimetableResponseDto>>> Search(
            [FromQuery] int? originTownId,
            [FromQuery] int? destinationTownId,
            [FromQuery] string? afterTime = null)
        {
            var query = _context.Timetables
                .Include(t => t.Bus)
                .Include(t => t.Route).ThenInclude(r => r.OriginTown)
                .Include(t => t.Route).ThenInclude(r => r.DestinationTown)
                .Include(t => t.Route).ThenInclude(r => r.Stops)
                .Include(t => t.StationTimes).ThenInclude(st => st.RouteStop)
                .Where(t => t.IsActive && t.Route.IsActive)
                .AsQueryable();

            // Filter routes that pass through the requested origin town
            if (originTownId.HasValue)
                query = query.Where(t =>
                    t.Route.Stops.Any(s => s.TownId == originTownId.Value));

            // Filter routes that pass through the destination town AFTER the origin
            if (originTownId.HasValue && destinationTownId.HasValue)
                query = query.Where(t =>
                    t.Route.Stops.Any(s => s.TownId == destinationTownId.Value) &&
                    t.Route.Stops.First(s => s.TownId == destinationTownId.Value).StopOrder >
                    t.Route.Stops.First(s => s.TownId == originTownId.Value).StopOrder);

            // Filter by departure time (after a given time)
            if (!string.IsNullOrEmpty(afterTime) && TimeSpan.TryParse(afterTime, out var minTime))
                query = query.Where(t => t.DepartureTime >= minTime);

            var result = await query
                .OrderBy(t => t.DepartureTime)
                .Select(t => MapToDto(t))
                .ToListAsync();

            return Ok(result);
        }

        // ────────────────────────────────────────────────────────────────────
        // POST api/timetables
        // BusOwner only
        // ────────────────────────────────────────────────────────────────────
        [HttpPost]
        [Authorize(Roles = "BusOwner")]
        public async Task<ActionResult<TimetableResponseDto>> Create([FromBody] CreateTimetableDto dto)
        {
            var ownerId = GetCurrentUserId();
            if (ownerId == null) return Unauthorized();

            // Verify bus belongs to this owner
            var bus = await _context.Buses
                .Include(b => b.Owner)
                .FirstOrDefaultAsync(b => b.Id == dto.BusId);

            if (bus == null)
                return NotFound(new { message = "Bus not found." });

            if (bus.OwnerId != ownerId.Value)
                return Forbid();

            // Verify route exists and is active
            var route = await _context.Routes
                .Include(r => r.OriginTown)
                .Include(r => r.DestinationTown)
                .FirstOrDefaultAsync(r => r.Id == dto.RouteId && r.IsActive);

            if (route == null)
                return NotFound(new { message = "Route not found or inactive." });

            // Parse departure time
            if (!TimeSpan.TryParse(dto.DepartureTime, out var departure))
                return BadRequest(new { message = "Invalid departure time format. Use HH:mm or HH:mm:ss." });

            // Check for existing schedule (active or inactive) for this exact route & time
            var existing = await _context.Timetables
                .FirstOrDefaultAsync(t =>
                    t.BusId == dto.BusId &&
                    t.RouteId == dto.RouteId &&
                    t.DepartureTime == departure);

            if (existing != null)
            {
                if (existing.IsActive)
                {
                    return Conflict(new { message = "Bus already assigned" });
                }
                else
                {
                    // Ensure the bus isn't assigned to any other active route
                    var anyActive = await _context.Timetables.AnyAsync(t => t.BusId == dto.BusId && t.IsActive && t.Id != existing.Id);
                    if (anyActive)
                        return Conflict(new { message = "Bus already assigned" });

                    // Reactivate the existing one
                    existing.IsActive = true;
                    existing.OperatingDays = dto.OperatingDays;
                    existing.CreatedById = ownerId.Value;
                    await _context.SaveChangesAsync();
                    
                    existing.Bus = bus;
                    existing.Route = route;
                    return Ok(MapToDto(existing));
                }
            }

            // Ensure the bus isn't assigned to any active route before creating a new one
            var isBusBusy = await _context.Timetables.AnyAsync(t => t.BusId == dto.BusId && t.IsActive);
            if (isBusBusy)
                return Conflict(new { message = "Bus already assigned" });

            var timetable = new Timetable
            {
                BusId         = dto.BusId,
                RouteId       = dto.RouteId,
                DepartureTime = departure,
                OperatingDays = dto.OperatingDays,
                CreatedById   = ownerId.Value,
                StationTimes  = new List<TimetableStationTime>()
            };

            if (dto.StationTimes != null)
            {
                foreach (var st in dto.StationTimes)
                {
                    if (TimeSpan.TryParse(st.ExpectedTime, out var expTime))
                    {
                        timetable.StationTimes.Add(new TimetableStationTime
                        {
                            RouteStopId = st.RouteStopId,
                            ExpectedTime = expTime,
                            IsReturnJourney = st.IsReturnJourney
                        });
                    }
                }
            }

            _context.Timetables.Add(timetable);
            await _context.SaveChangesAsync();

            timetable.Bus   = bus;
            timetable.Route = route;

            return CreatedAtAction(nameof(GetById), new { id = timetable.Id }, MapToDto(timetable));
        }

        // ────────────────────────────────────────────────────────────────────
        // PUT api/timetables/{id}
        // BusOwner (own buses) or Admin
        // ────────────────────────────────────────────────────────────────────
        [HttpPut("{id}")]
        [Authorize(Roles = "BusOwner,Admin")]
        public async Task<ActionResult<TimetableResponseDto>> Update(int id, [FromBody] UpdateTimetableDto dto)
        {
            var timetable = await _context.Timetables
                .Include(t => t.Bus)
                .Include(t => t.Route).ThenInclude(r => r.OriginTown)
                .Include(t => t.Route).ThenInclude(r => r.DestinationTown)
                .Include(t => t.StationTimes).ThenInclude(st => st.RouteStop)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (timetable == null)
                return NotFound(new { message = "Timetable entry not found." });

            // BusOwner can only edit timetables for their own buses
            if (User.IsInRole("BusOwner") && timetable.Bus.OwnerId != GetCurrentUserId())
                return Forbid();

            if (dto.OperatingDays != null) timetable.OperatingDays = dto.OperatingDays;
            if (dto.IsActive.HasValue)     timetable.IsActive       = dto.IsActive.Value;

            if (dto.DepartureTime != null)
            {
                if (!TimeSpan.TryParse(dto.DepartureTime, out var departure))
                    return BadRequest(new { message = "Invalid departure time format." });
                timetable.DepartureTime = departure;
            }

            if (dto.StationTimes != null)
            {
                _context.TimetableStationTimes.RemoveRange(timetable.StationTimes);
                timetable.StationTimes.Clear();

                foreach (var st in dto.StationTimes)
                {
                    if (TimeSpan.TryParse(st.ExpectedTime, out var expTime))
                    {
                        timetable.StationTimes.Add(new TimetableStationTime
                        {
                            RouteStopId = st.RouteStopId,
                            ExpectedTime = expTime
                        });
                    }
                }
            }

            await _context.SaveChangesAsync();

            return Ok(MapToDto(timetable));
        }

        // ────────────────────────────────────────────────────────────────────
        // DELETE api/timetables/{id}
        // BusOwner (own bus) or Admin – soft delete
        // ────────────────────────────────────────────────────────────────────
        [HttpDelete("{id}")]
        [Authorize(Roles = "BusOwner,Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var timetable = await _context.Timetables
                .Include(t => t.Bus)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (timetable == null)
                return NotFound(new { message = "Timetable entry not found." });

            if (User.IsInRole("BusOwner") && timetable.Bus.OwnerId != GetCurrentUserId())
                return Forbid();

            timetable.IsActive = false;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Timetable entry deactivated successfully." });
        }

        // ────────────────────────────────────────────────────────────────────
        // Helpers
        // ────────────────────────────────────────────────────────────────────
        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            return claim != null && int.TryParse(claim.Value, out var id) ? id : null;
        }

        private static TimetableResponseDto MapToDto(Timetable t) => new()
        {
            Id            = t.Id,
            DepartureTime = t.DepartureTime.ToString(@"hh\:mm"),
            OperatingDays = t.OperatingDays,
            IsActive      = t.IsActive,
            CreatedAt     = t.CreatedAt,
            Bus = new BusSummaryDto
            {
                Id          = t.Bus.Id,
                NumberPlate = t.Bus.NumberPlate,
                Name        = t.Bus.Name,
                BusType     = t.Bus.BusType,
            },
            Route = new RouteSummaryDto
            {
                Id              = t.Route.Id,
                Name            = t.Route.Name,
                OriginTown      = t.Route.OriginTown.Name,
                DestinationTown = t.Route.DestinationTown.Name,
            },
            StationTimes = t.StationTimes?.Select(st => new StationTimeDto
            {
                RouteStopId = st.RouteStopId,
                TownId = st.RouteStop?.TownId ?? 0,
                ExpectedTime = st.ExpectedTime.ToString(@"hh\:mm"),
                IsReturnJourney = st.IsReturnJourney
            }).ToList() ?? new List<StationTimeDto>()
        };
    }
}
