using System.ComponentModel.DataAnnotations;

namespace BusPulseLK.Models
{
    /// <summary>
    /// An issue report submitted by a Passenger about a Bus.
    /// Reports are visible to the BusOwner for that bus.
    /// </summary>
    public class IssueReport
    {
        public int Id { get; set; }

        // ── Reporter ─────────────────────────────────────────────────────────
        [Required]
        public int PassengerId { get; set; }
        public User Passenger { get; set; } = null!;

        // ── Bus ───────────────────────────────────────────────────────────────
        [Required]
        public int BusId { get; set; }
        public Bus Bus { get; set; } = null!;

        // ── Optional trip link ────────────────────────────────────────────────
        public int? TripId { get; set; }
        public Trip? Trip { get; set; }

        // ── Content ───────────────────────────────────────────────────────────
        [Required]
        [StringLength(1000)]
        public string Description { get; set; } = null!;

        /// <summary>"Open" | "Reviewed" | "Resolved"</summary>
        [StringLength(20)]
        public string Status { get; set; } = "Open";

        /// <summary>If true, the owner sees "Anonymous" instead of the passenger's name.</summary>
        public bool IsAnonymous { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
