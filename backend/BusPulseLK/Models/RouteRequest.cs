using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace BusPulseLK.Models
{
    public class RouteRequest
    {
        public int Id { get; set; }

        [Required]
        [StringLength(150, MinimumLength = 3)]
        public string Name { get; set; } = null!;

        [Required]
        [StringLength(20)]
        public string RouteNumber { get; set; } = null!;

        [StringLength(500)]
        public string? Description { get; set; }

        [Required]
        public int OriginTownId { get; set; }
        public Town OriginTown { get; set; } = null!;

        [Required]
        public int DestinationTownId { get; set; }
        public Town DestinationTown { get; set; } = null!;

        [Required]
        public int RequestedByUserId { get; set; }
        public User RequestedByUser { get; set; } = null!;

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Pending"; // "Pending", "Approved", "Rejected"

        [StringLength(300)]
        public string? StatusReason { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<RouteRequestStop> Stops { get; set; } = new List<RouteRequestStop>();
    }
}
