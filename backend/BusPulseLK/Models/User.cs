using System;
using System.ComponentModel.DataAnnotations;

namespace BusPulseLK.Models
{
    public class User
    {
        public int Id { get; set; } // Primary key

        [Required]
        public string FullName { get; set; } = null!;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = null!;

        [Required]
        public string Password { get; set; } = null!; // Store hashed password

        [Required]
        public string Role { get; set; } = null!; // "Admin", "BusOwner", "Driver", "Conductor", "Passenger"

        public bool IsRegularPassenger { get; set; } = false; // Only for passengers

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool IsVerified { get; set; } = false; // Verification for Bus Owners, Drivers, Conductors
    }
}
