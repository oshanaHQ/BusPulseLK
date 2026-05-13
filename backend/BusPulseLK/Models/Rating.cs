using System.ComponentModel.DataAnnotations;

namespace BusPulseLK.Models
{
    /// <summary>
    /// A star rating (1–5) and optional comment left by a Passenger for a Bus.
    /// A passenger can only rate a given bus once.
    /// </summary>
    public class Rating
    {
        public int Id { get; set; }

        // ── Passenger ────────────────────────────────────────────────────────
        [Required]
        public int PassengerId { get; set; }
        public User Passenger { get; set; } = null!;

        // ── Bus ───────────────────────────────────────────────────────────────
        [Required]
        public int BusId { get; set; }
        public Bus Bus { get; set; } = null!;

        // ── Rating ────────────────────────────────────────────────────────────
        /// <summary>Star rating from 1 (worst) to 5 (best).</summary>
        [Required]
        [Range(1, 5)]
        public int Stars { get; set; }

        [StringLength(500)]
        public string? Comment { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
