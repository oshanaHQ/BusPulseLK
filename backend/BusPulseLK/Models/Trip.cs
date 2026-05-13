using System.ComponentModel.DataAnnotations;

namespace BusPulseLK.Models
{
    /// <summary>
    /// Represents a specific real-world run of a bus on a given date,
    /// based on a Timetable entry. Tracks live status and last passed town.
    /// </summary>
    public class Trip
    {
        public int Id { get; set; }

        // ── Timetable reference ───────────────────────────────────────────────
        [Required]
        public int TimetableId { get; set; }
        public Timetable Timetable { get; set; } = null!;

        // ── Schedule ─────────────────────────────────────────────────────────
        /// <summary>The calendar date this trip is running on.</summary>
        [Required]
        public DateOnly TripDate { get; set; }

        // ── Live status ───────────────────────────────────────────────────────
        /// <summary>
        /// "Scheduled" | "Started" | "Delayed" | "Cancelled" | "Completed"
        /// </summary>
        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Scheduled";

        /// <summary>
        /// Optional free-text reason for a delay or cancellation.
        /// </summary>
        [StringLength(300)]
        public string? StatusNote { get; set; }

        // ── Last known position ───────────────────────────────────────────────
        /// <summary>The most-recently confirmed passed town for this trip.</summary>
        public int? LastPassedTownId { get; set; }
        public Town? LastPassedTown { get; set; }

        // ── Meta ─────────────────────────────────────────────────────────────
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // ── Navigation ───────────────────────────────────────────────────────
        public ICollection<TownProgress> TownProgresses { get; set; } = new List<TownProgress>();
        public ICollection<Announcement> Announcements { get; set; } = new List<Announcement>();
    }
}
