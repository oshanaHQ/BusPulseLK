namespace BusPulseLK.Models
{
    public class RegisterUserDto
    {
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string Role { get; set; } = null!; // Admin, BusOwner, Driver, Conductor, Passenger
    }
}
