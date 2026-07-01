using System.ComponentModel.DataAnnotations;

namespace BusPulseLK.Models
{
    public class RegisterUserDto
    {
        [Required]
        public string FullName { get; set; } = null!;

        [Required]
        [EmailAddress(ErrorMessage = "Please provide a valid email address.")]
        public string Email { get; set; } = null!;

        [Required]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters long.")]
        public string Password { get; set; } = null!;

        public string Role { get; set; } = null!; // Admin, BusOwner, Driver, Conductor, Passenger
    }
}
