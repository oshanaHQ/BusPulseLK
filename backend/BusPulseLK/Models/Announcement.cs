using System.ComponentModel.DataAnnotations;

namespace BusPulseLK.Models
{
    /// <summary>
    /// A special notice posted by a BusOwner, Driver, or Conductor
    /// about a bus or a specific trip (e.g. breakdown, replacement, trip started).
    /// Passengers who have favorited the bus will receive these.
    /// </summary>
    public class Announcement
    {
        public int Id { get; set; }

        // ── Bus ───────────────────────────────────────────────────────────────
        [Required]
        public int BusId { get; set; }
        public Bus Bus { get; set; } = null!;

        // ── Optional trip link ────────────────────────────────────────────────
        /// <summary>Null means a general bus-level announcement (e.g. "Bus not running today").</summary>
        public int? TripId { get; set; }
        public Trip? Trip { get; set; }

        // ── Content ───────────────────────────────────────────────────────────
        /// <summary>
        /// "TripStarted" | "Delayed" | "Cancelled" | "Breakdown" |
        /// "ReplacementBus" | "NotRunningToday" | "General"
        /// </summary>
        [Required]
        [StringLength(30)]
        public string Type { get; set; } = "General";

        [Required]
        [StringLength(500)]
        public string Message { get; set; } = null!;

        // ── Meta ─────────────────────────────────────────────────────────────
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public int CreatedById { get; set; }
        public User CreatedBy { get; set; } = null!;
    }
}
