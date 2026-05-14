using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.IssueReports.Add(report);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Issue reported successfully. We will look into it." });
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
    }
}
