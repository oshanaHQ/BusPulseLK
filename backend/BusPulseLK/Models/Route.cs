using System.ComponentModel.DataAnnotations;

namespace BusPulseLK.Models
{
    /// <summary>
    /// A named bus route from an origin town to a destination town,
    /// optionally passing through intermediate towns (RouteStops).
    /// Only Admins can create routes directly; BusOwners can request routes.
    /// </summary>
    public class Route
    {
        public int Id { get; set; }

        /// <summary>Descriptive name e.g. "Colombo - Kandy Express"</summary>
        [Required]
        [StringLength(150, MinimumLength = 3)]
        public string Name { get; set; } = null!;

        /// <summary>Official route number e.g. "400" or "400/1"</summary>
        [Required]
        [StringLength(20)]
        public string RouteNumber { get; set; } = null!;

        /// <summary>Optional description / notes about the route</summary>
        [StringLength(500)]
        public string? Description { get; set; }

        // ── Origin & Destination (FK to Towns) ──────────────────────────────
        [Required]
        public int OriginTownId { get; set; }
        public Town OriginTown { get; set; } = null!;

        [Required]
        public int DestinationTownId { get; set; }
        public Town DestinationTown { get; set; } = null!;

        // ── Meta ─────────────────────────────────────────────────────────────
        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>Admin who created / approved this route</summary>
        public int CreatedById { get; set; }
        public User CreatedBy { get; set; } = null!;

        // ── Navigation ───────────────────────────────────────────────────────
        /// <summary>All intermediate stops (including origin &amp; destination) in order</summary>
        public ICollection<RouteStop> Stops { get; set; } = new List<RouteStop>();

        /// <summary>All timetable entries using this route</summary>
        public ICollection<Timetable> Timetables { get; set; } = new List<Timetable>();
    }
}
