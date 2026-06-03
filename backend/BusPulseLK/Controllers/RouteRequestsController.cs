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
    public class RouteRequestsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RouteRequestsController(AppDbContext context)
        {
            _context = context;
        }

        // ────────────────────────────────────────────────────────────────────
        // GET api/routerequests
        // BusOwner: sees only their own requests
        // Admin: sees all requests
        // ────────────────────────────────────────────────────────────────────
        [HttpGet]
        [Authorize(Roles = "Admin,BusOwner")]
        public async Task<ActionResult<IEnumerable<RouteRequestResponseDto>>> GetAll(
            [FromQuery] string? status = null)
        {
            var userId = GetCurrentUserId();
            var role = GetCurrentUserRole();
            if (userId == null) return Unauthorized();

            var query = _context.RouteRequests
                .Include(r => r.OriginTown)
                .Include(r => r.DestinationTown)
                .Include(r => r.RequestedByUser)
                .Include(r => r.Stops.OrderBy(s => s.StopOrder))
                    .ThenInclude(s => s.Town)
                .AsQueryable();

            // BusOwners only see their own requests
            if (role == "BusOwner")
                query = query.Where(r => r.RequestedByUserId == userId.Value);

            // Optional status filter
            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(r => r.Status == status);

            var result = await query
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => MapToDto(r))
                .ToListAsync();

            return Ok(result);
        }

        // ────────────────────────────────────────────────────────────────────
        // GET api/routerequests/{id}
        // ────────────────────────────────────────────────────────────────────
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,BusOwner")]
        public async Task<ActionResult<RouteRequestResponseDto>> GetById(int id)
        {
            var userId = GetCurrentUserId();
            var role = GetCurrentUserRole();
            if (userId == null) return Unauthorized();

            var request = await _context.RouteRequests
                .Include(r => r.OriginTown)
                .Include(r => r.DestinationTown)
                .Include(r => r.RequestedByUser)
                .Include(r => r.Stops.OrderBy(s => s.StopOrder))
                    .ThenInclude(s => s.Town)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null) return NotFound(new { message = "Route request not found." });

            // BusOwner can only view their own
            if (role == "BusOwner" && request.RequestedByUserId != userId.Value)
                return Forbid();

            return Ok(MapToDto(request));
        }

        // ────────────────────────────────────────────────────────────────────
        // POST api/routerequests
        // BusOwner only – submit a new route request
        // ────────────────────────────────────────────────────────────────────
        [HttpPost]
        [Authorize(Roles = "BusOwner")]
        public async Task<ActionResult<RouteRequestResponseDto>> Create([FromBody] CreateRouteRequestDto dto)
        {
            if (dto.StopTownIds.Count < 2)
                return BadRequest(new { message = "At least 2 stops (origin and destination) are required." });

            if (dto.StopTownIds.First() != dto.OriginTownId)
                return BadRequest(new { message = "First stop must match the origin town." });

            if (dto.StopTownIds.Last() != dto.DestinationTownId)
                return BadRequest(new { message = "Last stop must match the destination town." });

            if (dto.StopTownIds.Distinct().Count() != dto.StopTownIds.Count)
                return BadRequest(new { message = "Duplicate towns in stop list." });

            var townIds = dto.StopTownIds.Distinct().ToList();
            var existingTownIds = await _context.Towns
                .Where(t => townIds.Contains(t.Id))
                .Select(t => t.Id)
                .ToListAsync();

            var missing = townIds.Except(existingTownIds).ToList();
            if (missing.Any())
                return BadRequest(new { message = $"Town IDs not found: {string.Join(", ", missing)}" });

            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var routeRequest = new RouteRequest
            {
                Name = dto.Name.Trim(),
                RouteNumber = dto.RouteNumber.Trim(),
                Description = dto.Description?.Trim(),
                OriginTownId = dto.OriginTownId,
                DestinationTownId = dto.DestinationTownId,
                RequestedByUserId = userId.Value,
                Status = "Pending",
            };

            for (int i = 0; i < dto.StopTownIds.Count; i++)
            {
                routeRequest.Stops.Add(new RouteRequestStop
                {
                    TownId = dto.StopTownIds[i],
                    StopOrder = i + 1
                });
            }

            _context.RouteRequests.Add(routeRequest);
            await _context.SaveChangesAsync();

            await ReloadNavProps(routeRequest);
            return CreatedAtAction(nameof(GetById), new { id = routeRequest.Id }, MapToDto(routeRequest));
        }

        // ────────────────────────────────────────────────────────────────────
        // PUT api/routerequests/{id}
        // Admin only – edit a pending request before approving
        // ────────────────────────────────────────────────────────────────────
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<RouteRequestResponseDto>> Update(int id, [FromBody] UpdateRouteRequestDto dto)
        {
            var request = await _context.RouteRequests
                .Include(r => r.OriginTown)
                .Include(r => r.DestinationTown)
                .Include(r => r.RequestedByUser)
                .Include(r => r.Stops)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null) return NotFound(new { message = "Route request not found." });
            if (request.Status != "Pending")
                return BadRequest(new { message = "Only pending requests can be edited." });

            if (dto.Name != null) request.Name = dto.Name.Trim();
            if (dto.RouteNumber != null) request.RouteNumber = dto.RouteNumber.Trim();
            if (dto.Description != null) request.Description = dto.Description.Trim();

            if (dto.StopTownIds != null && dto.StopTownIds.Count >= 2)
            {
                if (dto.StopTownIds.Distinct().Count() != dto.StopTownIds.Count)
                    return BadRequest(new { message = "Duplicate towns in stop list." });

                var townIds = dto.StopTownIds.Distinct().ToList();
                var existingIds = await _context.Towns
                    .Where(t => townIds.Contains(t.Id))
                    .Select(t => t.Id).ToListAsync();

                var missing = townIds.Except(existingIds).ToList();
                if (missing.Any())
                    return BadRequest(new { message = $"Town IDs not found: {string.Join(", ", missing)}" });

                _context.RouteRequestStops.RemoveRange(request.Stops);
                request.Stops.Clear();

                for (int i = 0; i < dto.StopTownIds.Count; i++)
                {
                    request.Stops.Add(new RouteRequestStop
                    {
                        RouteRequestId = request.Id,
                        TownId = dto.StopTownIds[i],
                        StopOrder = i + 1
                    });
                }

                request.OriginTownId = dto.StopTownIds.First();
                request.DestinationTownId = dto.StopTownIds.Last();
            }

            await _context.SaveChangesAsync();
            await ReloadNavProps(request);
            return Ok(MapToDto(request));
        }

        // ────────────────────────────────────────────────────────────────────
        // POST api/routerequests/{id}/approve
        // Admin only – approve and create actual Route
        // ────────────────────────────────────────────────────────────────────
        [HttpPost("{id}/approve")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Approve(int id)
        {
            var request = await _context.RouteRequests
                .Include(r => r.Stops)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null) return NotFound(new { message = "Route request not found." });
            if (request.Status != "Pending")
                return BadRequest(new { message = "Only pending requests can be approved." });

            var adminId = GetCurrentUserId();
            if (adminId == null) return Unauthorized();

            // Create the actual Route
            var route = new BusPulseLK.Models.Route
            {
                Name = request.Name,
                RouteNumber = request.RouteNumber,
                Description = request.Description,
                OriginTownId = request.OriginTownId,
                DestinationTownId = request.DestinationTownId,
                IsActive = true,
                CreatedById = adminId.Value,
            };

            var orderedStops = request.Stops.OrderBy(s => s.StopOrder).ToList();
            for (int i = 0; i < orderedStops.Count; i++)
            {
                route.Stops.Add(new RouteStop
                {
                    TownId = orderedStops[i].TownId,
                    StopOrder = i + 1
                });
            }

            _context.Routes.Add(route);

            request.Status = "Approved";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Route request approved and route created successfully.", routeId = route.Id });
        }

        // ────────────────────────────────────────────────────────────────────
        // POST api/routerequests/{id}/reject
        // Admin only – reject a request with a reason
        // ────────────────────────────────────────────────────────────────────
        [HttpPost("{id}/reject")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Reject(int id, [FromBody] RejectRouteRequestDto dto)
        {
            var request = await _context.RouteRequests.FindAsync(id);
            if (request == null) return NotFound(new { message = "Route request not found." });
            if (request.Status != "Pending")
                return BadRequest(new { message = "Only pending requests can be rejected." });

            request.Status = "Rejected";
            request.StatusReason = dto.StatusReason.Trim();

            await _context.SaveChangesAsync();
            return Ok(new { message = "Route request rejected." });
        }

        // ────────────────────────────────────────────────────────────────────
        // Helpers
        // ────────────────────────────────────────────────────────────────────
        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            return claim != null && int.TryParse(claim.Value, out var id) ? id : null;
        }

        private string? GetCurrentUserRole()
        {
            return User.FindFirst(ClaimTypes.Role)?.Value;
        }

        private async Task ReloadNavProps(RouteRequest r)
        {
            await _context.Entry(r).Reference(x => x.OriginTown).LoadAsync();
            await _context.Entry(r).Reference(x => x.DestinationTown).LoadAsync();
            await _context.Entry(r).Reference(x => x.RequestedByUser).LoadAsync();
            await _context.Entry(r).Collection(x => x.Stops).Query()
                .Include(s => s.Town).LoadAsync();
        }

        private static RouteRequestResponseDto MapToDto(RouteRequest r) => new()
        {
            Id = r.Id,
            Name = r.Name,
            RouteNumber = r.RouteNumber,
            Description = r.Description,
            Status = r.Status,
            StatusReason = r.StatusReason,
            CreatedAt = r.CreatedAt,
            OriginTown = new TownSummaryDto { Id = r.OriginTown.Id, Name = r.OriginTown.Name },
            DestinationTown = new TownSummaryDto { Id = r.DestinationTown.Id, Name = r.DestinationTown.Name },
            RequestedByUser = new UserSummaryDto
            {
                Id = r.RequestedByUser.Id,
                FullName = r.RequestedByUser.FullName,
                Email = r.RequestedByUser.Email,
                Role = r.RequestedByUser.Role,
            },
            Stops = r.Stops.OrderBy(s => s.StopOrder).Select(s => new RouteRequestStopDto
            {
                Id = s.Id,
                StopOrder = s.StopOrder,
                Town = new TownSummaryDto { Id = s.Town.Id, Name = s.Town.Name }
            }).ToList()
        };
    }
}
