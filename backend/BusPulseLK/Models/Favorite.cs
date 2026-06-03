using System.ComponentModel.DataAnnotations;

namespace BusPulseLK.Models
{
    /// <summary>
    /// Links a Passenger to a Bus they have saved as a favourite.
    /// Passengers receive Announcements for all their favourite buses.
    /// </summary>
    public class Favorite
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

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
