using System;
using System.ComponentModel.DataAnnotations;

namespace BusPulseLK.Models
{
    public class User
    {
        public int Id { get; set; } // Primary key

        [Required]
        public string FullName { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string Password { get; set; } // Store hashed password

        [Required]
        public string Role { get; set; } // "Admin", "BusOwner", "Driver", "Conductor", "Passenger"

        public bool IsRegularPassenger { get; set; } = false; // Only for passengers

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool IsVerified { get; set; } = false; // Verification for Bus Owners, Drivers, Conductors
    }
}
