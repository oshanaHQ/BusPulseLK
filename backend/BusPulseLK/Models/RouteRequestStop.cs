using System.ComponentModel.DataAnnotations;

namespace BusPulseLK.Models
{
    public class RouteRequestStop
    {
        public int Id { get; set; }

        [Required]
        public int RouteRequestId { get; set; }
        public RouteRequest RouteRequest { get; set; } = null!;

        [Required]
        public int TownId { get; set; }
        public Town Town { get; set; } = null!;

        [Required]
        [Range(1, 500)]
        public int StopOrder { get; set; }
    }
}
