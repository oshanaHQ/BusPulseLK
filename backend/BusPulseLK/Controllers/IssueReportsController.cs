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
    public class IssueReportsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public IssueReportsController(AppDbContext context)
        {
            _context = context;
        }

        // POST api/issuereports – passenger submits an issue (with optional anonymous flag)
        [HttpPost]
        public async Task<IActionResult> ReportIssue([FromBody] CreateIssueReportDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var report = new IssueReport
            {
                PassengerId = userId.Value,
                BusId = dto.BusId,
                TripId = dto.TripId,
                Description = dto.Description,
                IsAnonymous = dto.IsAnonymous,
                Status = "Open",
                CreatedAt = DateTime.UtcNow
            };

            _context.IssueReports.Add(report);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Issue reported successfully. We will look into it." });
        }

        // GET api/issuereports/my-buses – bus owner views issues for their own buses
        [HttpGet("my-buses")]
        public async Task<IActionResult> GetMyBusIssues()
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var reports = await _context.IssueReports
                .Include(r => r.Bus)
                .Include(r => r.Passenger)
                .Where(r => r.Bus.OwnerId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return Ok(reports.Select(r => new
            {
                r.Id,
                r.Description,
                r.Status,
                r.IsAnonymous,
                r.CreatedAt,
                bus = new { r.Bus.Id, r.Bus.NumberPlate, r.Bus.Name },
                reporter = r.IsAnonymous
                    ? (object)new { name = "Anonymous" }
                    : new { name = r.Passenger.FullName }
            }));
        }

        // PUT api/issuereports/{id}/status – owner updates status (Reviewed / Resolved)
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateIssueStatusDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var report = await _context.IssueReports
                .Include(r => r.Bus)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (report == null) return NotFound();
            if (report.Bus.OwnerId != userId) return Forbid();

            var allowed = new[] { "Reviewed", "Resolved" };
            if (!allowed.Contains(dto.Status))
                return BadRequest(new { message = "Status must be 'Reviewed' or 'Resolved'." });

            report.Status = dto.Status;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Issue marked as {dto.Status}." });
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            return claim != null && int.TryParse(claim.Value, out var id) ? id : null;
        }
    }

    public class CreateIssueReportDto
    {
        public int BusId { get; set; }
        public int? TripId { get; set; }
        public string Description { get; set; } = null!;
        public bool IsAnonymous { get; set; } = false;
    }

    public class UpdateIssueStatusDto
    {
        public string Status { get; set; } = null!;
    }
}
