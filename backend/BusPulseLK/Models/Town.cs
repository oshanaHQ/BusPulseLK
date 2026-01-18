using System.ComponentModel.DataAnnotations;

namespace BusPulseLK.Models
{
    public class Town
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 2)]
        public string Name { get; set; } = null!;

        [StringLength(500)]
        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Who added this town 
        public int CreatedById { get; set; }
        public User CreatedBy { get; set; } = null!;
    }
}