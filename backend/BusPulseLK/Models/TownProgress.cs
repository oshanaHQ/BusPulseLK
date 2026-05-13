using System.ComponentModel.DataAnnotations;

namespace BusPulseLK.Models
{
    /// <summary>
    /// Records that a bus passed a specific town during a Trip.
    /// Created by a Driver, Conductor, or approved Regular Passenger.
    /// Each town can only be marked once per trip.
    /// </summary>
    public class TownProgress
    {
        public int Id { get; set; }

        // ── Trip ─────────────────────────────────────────────────────────────
        [Required]
        public int TripId { get; set; }
        public Trip Trip { get; set; } = null!;

        // ── Town ─────────────────────────────────────────────────────────────
        [Required]
        public int TownId { get; set; }
        public Town Town { get; set; } = null!;

        // ── Timestamp ────────────────────────────────────────────────────────
        public DateTime PassedAt { get; set; } = DateTime.UtcNow;

        // ── Who reported this update ──────────────────────────────────────────
        [Required]
        public int UpdatedByUserId { get; set; }
        public User UpdatedBy { get; set; } = null!;
    }
}
