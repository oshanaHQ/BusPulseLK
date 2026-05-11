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
    [Authorize] // All endpoints require login by default
    public class BusesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BusesController(AppDbContext context)
        {
            _context = context;
        }

        // ────────────────────────────────────────────────────────────────────
        // GET api/buses
        // Public – any logged-in user; BusOwners see only their own buses
        // ────────────────────────────────────────────────────────────────────
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<BusResponseDto>>> GetAll(
            [FromQuery] bool? activeOnly = true,
            [FromQuery] int? ownerId = null)
        {
            var query = _context.Buses
                .Include(b => b.Owner)
                .Include(b => b.Driver)
                .Include(b => b.Conductor)
                .AsQueryable();

            if (activeOnly == true)
                query = query.Where(b => b.IsActive);

            if (ownerId.HasValue)
                query = query.Where(b => b.OwnerId == ownerId.Value);

            var buses = await query
                .OrderBy(b => b.NumberPlate)
                .Select(b => MapToDto(b))
                .ToListAsync();

            return Ok(buses);
        }

        // ────────────────────────────────────────────────────────────────────
        // GET api/buses/{id}
        // ────────────────────────────────────────────────────────────────────
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<BusResponseDto>> GetById(int id)
        {
            var bus = await _context.Buses
                .Include(b => b.Owner)
                .Include(b => b.Driver)
                .Include(b => b.Conductor)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (bus == null) return NotFound(new { message = "Bus not found." });

            return Ok(MapToDto(bus));
        }

        // ────────────────────────────────────────────────────────────────────
        // GET api/buses/mine
        // BusOwner: get their own buses
        // ────────────────────────────────────────────────────────────────────
        [HttpGet("mine")]
        [Authorize(Roles = "BusOwner")]
        public async Task<ActionResult<IEnumerable<BusResponseDto>>> GetMine()
        {
            var ownerId = GetCurrentUserId();
            if (ownerId == null) return Unauthorized();

            var buses = await _context.Buses
                .Include(b => b.Owner)
                .Include(b => b.Driver)
                .Include(b => b.Conductor)
                .Where(b => b.OwnerId == ownerId.Value)
                .OrderBy(b => b.NumberPlate)
                .Select(b => MapToDto(b))
                .ToListAsync();

            return Ok(buses);
        }

        // ────────────────────────────────────────────────────────────────────
        // POST api/buses
        // BusOwner only
        // ────────────────────────────────────────────────────────────────────
        [HttpPost]
        [Authorize(Roles = "BusOwner")]
        public async Task<ActionResult<BusResponseDto>> Create([FromBody] CreateBusDto dto)
        {
            var ownerId = GetCurrentUserId();
            if (ownerId == null) return Unauthorized();

            // Check duplicate number plate
            if (await _context.Buses.AnyAsync(b => b.NumberPlate == dto.NumberPlate.Trim()))
                return Conflict(new { message = "A bus with this number plate already exists." });

            var bus = new Bus
            {
                NumberPlate     = dto.NumberPlate.Trim().ToUpper(),
                Name            = dto.Name?.Trim(),
                BusType         = dto.BusType,
                SeatingCapacity = dto.SeatingCapacity,
                OwnerId         = ownerId.Value,
            };

            _context.Buses.Add(bus);
            await _context.SaveChangesAsync();

            await LoadBusNavigations(bus);

            return CreatedAtAction(nameof(GetById), new { id = bus.Id }, MapToDto(bus));
        }

        // ────────────────────────────────────────────────────────────────────
        // PUT api/buses/{id}
        // BusOwner (own buses) or Admin
        // ────────────────────────────────────────────────────────────────────
        [HttpPut("{id}")]
        [Authorize(Roles = "BusOwner,Admin")]
        public async Task<ActionResult<BusResponseDto>> Update(int id, [FromBody] UpdateBusDto dto)
        {
            var bus = await _context.Buses
                .Include(b => b.Owner)
                .Include(b => b.Driver)
                .Include(b => b.Conductor)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (bus == null) return NotFound(new { message = "Bus not found." });

            // BusOwners can only edit their own buses
            if (User.IsInRole("BusOwner") && bus.OwnerId != GetCurrentUserId())
                return Forbid();

            if (dto.Name != null)              bus.Name            = dto.Name.Trim();
            if (dto.BusType != null)           bus.BusType         = dto.BusType;
            if (dto.SeatingCapacity.HasValue)  bus.SeatingCapacity = dto.SeatingCapacity.Value;
            if (dto.IsActive.HasValue)         bus.IsActive        = dto.IsActive.Value;

            // Assign / unassign driver (0 = unassign)
            if (dto.DriverId.HasValue)
            {
                if (dto.DriverId.Value == 0)
                {
                    bus.DriverId = null;
                }
                else
                {
                    var driver = await _context.Users.FindAsync(dto.DriverId.Value);
                    if (driver == null || driver.Role != "Driver")
                        return BadRequest(new { message = "Driver user not found or is not a Driver." });
                    bus.DriverId = dto.DriverId.Value;
                }
            }

            // Assign / unassign conductor (0 = unassign)
            if (dto.ConductorId.HasValue)
            {
                if (dto.ConductorId.Value == 0)
                {
                    bus.ConductorId = null;
                }
                else
                {
                    var conductor = await _context.Users.FindAsync(dto.ConductorId.Value);
                    if (conductor == null || conductor.Role != "Conductor")
                        return BadRequest(new { message = "Conductor user not found or is not a Conductor." });
                    bus.ConductorId = dto.ConductorId.Value;
                }
            }

            await _context.SaveChangesAsync();
            await LoadBusNavigations(bus);

            return Ok(MapToDto(bus));
        }

        // ────────────────────────────────────────────────────────────────────
        // DELETE api/buses/{id}
        // BusOwner (own bus) or Admin – soft delete
        // ────────────────────────────────────────────────────────────────────
        [HttpDelete("{id}")]
        [Authorize(Roles = "BusOwner,Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var bus = await _context.Buses.FindAsync(id);
            if (bus == null) return NotFound(new { message = "Bus not found." });

            if (User.IsInRole("BusOwner") && bus.OwnerId != GetCurrentUserId())
                return Forbid();

            bus.IsActive = false;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Bus deactivated successfully." });
        }

        // ────────────────────────────────────────────────────────────────────
        // PATCH api/buses/{id}/assign-driver
        // BusOwner (own bus) or Admin
        // Body: { "driverId": 5 }
        // ────────────────────────────────────────────────────────────────────
        [HttpPatch("{id}/assign-driver")]
        [Authorize(Roles = "BusOwner,Admin")]
        public async Task<ActionResult<BusResponseDto>> AssignDriver(int id, [FromBody] AssignStaffDto dto)
        {
            var bus = await _context.Buses
                .Include(b => b.Owner)
                .Include(b => b.Driver)
                .Include(b => b.Conductor)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (bus == null) return NotFound(new { message = "Bus not found." });
            if (User.IsInRole("BusOwner") && bus.OwnerId != GetCurrentUserId()) return Forbid();

            var driver = await _context.Users.FindAsync(dto.UserId);
            if (driver == null || driver.Role != "Driver")
                return BadRequest(new { message = "User not found or is not registered as a Driver." });

            bus.DriverId = dto.UserId;
            await _context.SaveChangesAsync();
            await LoadBusNavigations(bus);

            return Ok(MapToDto(bus));
        }

        // ────────────────────────────────────────────────────────────────────
        // PATCH api/buses/{id}/unassign-driver
        // BusOwner (own bus) or Admin
        // ────────────────────────────────────────────────────────────────────
        [HttpPatch("{id}/unassign-driver")]
        [Authorize(Roles = "BusOwner,Admin")]
        public async Task<ActionResult<BusResponseDto>> UnassignDriver(int id)
        {
            var bus = await _context.Buses
                .Include(b => b.Owner)
                .Include(b => b.Driver)
                .Include(b => b.Conductor)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (bus == null) return NotFound(new { message = "Bus not found." });
            if (User.IsInRole("BusOwner") && bus.OwnerId != GetCurrentUserId()) return Forbid();

            bus.DriverId = null;
            await _context.SaveChangesAsync();

            return Ok(MapToDto(bus));
        }

        // ────────────────────────────────────────────────────────────────────
        // PATCH api/buses/{id}/assign-conductor
        // BusOwner (own bus) or Admin
        // Body: { "userId": 7 }
        // ────────────────────────────────────────────────────────────────────
        [HttpPatch("{id}/assign-conductor")]
        [Authorize(Roles = "BusOwner,Admin")]
        public async Task<ActionResult<BusResponseDto>> AssignConductor(int id, [FromBody] AssignStaffDto dto)
        {
            var bus = await _context.Buses
                .Include(b => b.Owner)
                .Include(b => b.Driver)
                .Include(b => b.Conductor)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (bus == null) return NotFound(new { message = "Bus not found." });
            if (User.IsInRole("BusOwner") && bus.OwnerId != GetCurrentUserId()) return Forbid();

            var conductor = await _context.Users.FindAsync(dto.UserId);
            if (conductor == null || conductor.Role != "Conductor")
                return BadRequest(new { message = "User not found or is not registered as a Conductor." });

            bus.ConductorId = dto.UserId;
            await _context.SaveChangesAsync();
            await LoadBusNavigations(bus);

            return Ok(MapToDto(bus));
        }

        // ────────────────────────────────────────────────────────────────────
        // PATCH api/buses/{id}/unassign-conductor
        // BusOwner (own bus) or Admin
        // ────────────────────────────────────────────────────────────────────
        [HttpPatch("{id}/unassign-conductor")]
        [Authorize(Roles = "BusOwner,Admin")]
        public async Task<ActionResult<BusResponseDto>> UnassignConductor(int id)
        {
            var bus = await _context.Buses
                .Include(b => b.Owner)
                .Include(b => b.Driver)
                .Include(b => b.Conductor)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (bus == null) return NotFound(new { message = "Bus not found." });
            if (User.IsInRole("BusOwner") && bus.OwnerId != GetCurrentUserId()) return Forbid();

            bus.ConductorId = null;
            await _context.SaveChangesAsync();

            return Ok(MapToDto(bus));
        }

        // ────────────────────────────────────────────────────────────────────
        // GET api/buses/{id}/routes
        // Returns all route + timetable assignments for a specific bus.
        // Public read.
        // ────────────────────────────────────────────────────────────────────
        [HttpGet("{id}/routes")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<TimetableResponseDto>>> GetBusRoutes(int id)
        {
            var busExists = await _context.Buses.AnyAsync(b => b.Id == id);
            if (!busExists) return NotFound(new { message = "Bus not found." });

            var timetables = await _context.Timetables
                .Include(t => t.Bus)
                .Include(t => t.Route).ThenInclude(r => r.OriginTown)
                .Include(t => t.Route).ThenInclude(r => r.DestinationTown)
                .Where(t => t.BusId == id && t.IsActive)
                .OrderBy(t => t.DepartureTime)
                .ToListAsync();

            return Ok(timetables.Select(MapTimetableToDto));
        }

        // ────────────────────────────────────────────────────────────────────
        // GET api/buses/staff/available-drivers
        // Returns all Driver users (for dropdowns in Bus Owner UI)
        // BusOwner or Admin only
        // ────────────────────────────────────────────────────────────────────
        [HttpGet("staff/available-drivers")]
        [Authorize(Roles = "BusOwner,Admin")]
        public async Task<ActionResult<IEnumerable<UserSummaryDto>>> GetAvailableDrivers()
        {
            var drivers = await _context.Users
                .Where(u => u.Role == "Driver" && u.IsVerified)
                .OrderBy(u => u.FullName)
                .Select(u => new UserSummaryDto
                {
                    Id       = u.Id,
                    FullName = u.FullName,
                    Email    = u.Email,
                    Role     = u.Role,
                })
                .ToListAsync();

            return Ok(drivers);
        }

        // ────────────────────────────────────────────────────────────────────
        // GET api/buses/staff/available-conductors
        // Returns all Conductor users (for dropdowns in Bus Owner UI)
        // BusOwner or Admin only
        // ────────────────────────────────────────────────────────────────────
        [HttpGet("staff/available-conductors")]
        [Authorize(Roles = "BusOwner,Admin")]
        public async Task<ActionResult<IEnumerable<UserSummaryDto>>> GetAvailableConductors()
        {
            var conductors = await _context.Users
                .Where(u => u.Role == "Conductor" && u.IsVerified)
                .OrderBy(u => u.FullName)
                .Select(u => new UserSummaryDto
                {
                    Id       = u.Id,
                    FullName = u.FullName,
                    Email    = u.Email,
                    Role     = u.Role,
                })
                .ToListAsync();

            return Ok(conductors);
        }

        // ────────────────────────────────────────────────────────────────────
        // Helpers
        // ────────────────────────────────────────────────────────────────────
        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            return claim != null && int.TryParse(claim.Value, out var id) ? id : null;
        }

        private async Task LoadBusNavigations(Bus bus)
        {
            await _context.Entry(bus).Reference(b => b.Owner).LoadAsync();
            if (bus.DriverId != null)
                await _context.Entry(bus).Reference(b => b.Driver).LoadAsync();
            if (bus.ConductorId != null)
                await _context.Entry(bus).Reference(b => b.Conductor).LoadAsync();
        }

        private static BusResponseDto MapToDto(Bus b) => new()
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
            Conductor       = b.Conductor != null ? MapUserSummary(b.Conductor) : null,
        };

        private static UserSummaryDto MapUserSummary(User u) => new()
        {
            Id       = u.Id,
            FullName = u.FullName,
            Email    = u.Email,
            Role     = u.Role,
        };

        private static TimetableResponseDto MapTimetableToDto(Timetable t) => new()
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
            }
        };
    }
}
