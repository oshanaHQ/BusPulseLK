using System.ComponentModel.DataAnnotations;

namespace BusPulseLK.Models
{
    /// <summary>
    /// Represents a physical bus registered by a BusOwner.
    /// A bus can be assigned to routes via Timetable entries.
    /// </summary>
    public class Bus
    {
        public int Id { get; set; }

        /// <summary>Number plate e.g. "WP CAB-9981"</summary>
        [Required]
        [StringLength(20, MinimumLength = 4)]
        public string NumberPlate { get; set; } = null!;

        /// <summary>Friendly display name e.g. "Royal Express"</summary>
        [StringLength(100)]
        public string? Name { get; set; }

        /// <summary>"AC" | "Non-AC" | "Semi-Luxury" | "Luxury"</summary>
        [Required]
        [StringLength(30)]
        public string BusType { get; set; } = "Non-AC";

        /// <summary>Total passenger seating capacity</summary>
        [Range(10, 120)]
        public int SeatingCapacity { get; set; } = 50;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // ── Owner ────────────────────────────────────────────────────────────
        /// <summary>The BusOwner user who registered this bus</summary>
        [Required]
        public int OwnerId { get; set; }
        public User Owner { get; set; } = null!;

        // ── Assigned Staff ───────────────────────────────────────────────────
        /// <summary>Currently assigned Driver (User with Role = Driver)</summary>
        public int? DriverId { get; set; }
        public User? Driver { get; set; }

        /// <summary>Currently assigned Conductor (User with Role = Conductor)</summary>
        public int? ConductorId { get; set; }
        public User? Conductor { get; set; }

        // ── Navigation ───────────────────────────────────────────────────────
        public ICollection<Timetable> Timetables { get; set; } = new List<Timetable>();
    }
}
