using System.ComponentModel.DataAnnotations;

namespace BusPulseLK.Models
{
    /// <summary>
    /// A passenger's request to become a "Regular Passenger" on a specific bus.
    /// Requires approval from the Driver or Conductor assigned to that bus.
    /// Once approved, the passenger's IsRegularPassenger flag is set to true.
    /// </summary>
    public class RegularPassengerRequest
    {
        public int Id { get; set; }

        // ── Requester ────────────────────────────────────────────────────────
        [Required]
        public int PassengerId { get; set; }
        public User Passenger { get; set; } = null!;

        // ── Bus being requested for ───────────────────────────────────────────
        [Required]
        public int BusId { get; set; }
        public Bus Bus { get; set; } = null!;

        // ── Status ────────────────────────────────────────────────────────────
        /// <summary>"Pending" | "Approved" | "Rejected"</summary>
        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Pending";

        // ── Approver ─────────────────────────────────────────────────────────
        /// <summary>Worker (Driver/Conductor) who nominated this passenger.</summary>
        public int? NominatedByUserId { get; set; }
        public User? NominatedByUser { get; set; }

        /// <summary>Admin who approved or rejected this request.</summary>
        public int? ReviewedByUserId { get; set; }
        public User? ReviewedBy { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReviewedAt { get; set; }
    }
}
