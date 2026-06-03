using System.ComponentModel.DataAnnotations;

namespace BusPulseLK.Models
{
    /// <summary>
    /// An intermediate (or endpoint) town along a Route, with an ordering index.
    /// StopOrder = 1 is the origin, the highest StopOrder is the destination.
    /// </summary>
    public class RouteStop
    {
        public int Id { get; set; }

        [Required]
        public int RouteId { get; set; }
        public Route Route { get; set; } = null!;

        [Required]
        public int TownId { get; set; }
        public Town Town { get; set; } = null!;

        /// <summary>1-based position of this stop along the route (1 = origin)</summary>
        [Required]
        [Range(1, 500)]
        public int StopOrder { get; set; }
    }
}
