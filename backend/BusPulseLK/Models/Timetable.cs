using System.ComponentModel.DataAnnotations;

namespace BusPulseLK.Models
{
    /// <summary>
    /// Assigns a Bus to a Route with a scheduled daily departure time.
    /// One bus can have multiple timetable entries (e.g. morning &amp; evening trips).
    /// </summary>
    public class Timetable
    {
        public int Id { get; set; }

        // ── Foreign Keys ─────────────────────────────────────────────────────
        [Required]
        public int BusId { get; set; }
        public Bus Bus { get; set; } = null!;

        [Required]
        public int RouteId { get; set; }
        public Route Route { get; set; } = null!;

        // ── Schedule ─────────────────────────────────────────────────────────
        /// <summary>
        /// Departure time from the origin town (stored as TimeSpan, e.g. 07:30:00).
        /// Use HH:mm:ss format when sending from the client.
        /// </summary>
        [Required]
        public TimeSpan DepartureTime { get; set; }

        /// <summary>
        /// Days this timetable entry is active.
        /// Comma-separated: "Mon,Tue,Wed,Thu,Fri" or "Daily"
        /// </summary>
        [StringLength(50)]
        public string OperatingDays { get; set; } = "Daily";

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>BusOwner who created this timetable entry</summary>
        public int CreatedById { get; set; }
        public User CreatedBy { get; set; } = null!;

        // ── Station Expected Times ───────────────────────────────────────────
        public ICollection<TimetableStationTime> StationTimes { get; set; } = new List<TimetableStationTime>();
    }
}
