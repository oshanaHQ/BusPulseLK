using Microsoft.AspNetCore.Mvc;
using BusPulseLK.Data;
using BusPulseLK.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;

namespace BusPulseLK.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public UserController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterUserDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("Email already exists.");

            var allowedRoles = new[] { "Admin", "BusOwner", "Driver", "Conductor", "Passenger" };
            if (!allowedRoles.Contains(dto.Role))
                return BadRequest("Invalid role.");

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                Role = dto.Role,
                Password = HashPassword(dto.Password),
                IsRegularPassenger = false, // Always start as non-regular
                IsVerified = new[] { "Admin", "Passenger" }.Contains(dto.Role)
                // BusOwner, Driver, Conductor start unverified
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var token = GenerateJwtToken(user);
            return Ok(new 
            { 
                Message = "User registered successfully.", 
                Token = token,
                User = new { user.Id, user.FullName, user.Email, user.Role }
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginUserDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (user == null || !VerifyPassword(dto.Password, user.Password))
                return BadRequest("Invalid email or password.");

            // Check if account needs verification
            if (!user.IsVerified && new[] { "BusOwner", "Driver", "Conductor" }.Contains(user.Role))
                return BadRequest("Account is pending verification.");

            var token = GenerateJwtToken(user);

            return Ok(new 
            { 
                Token = token,
                User = new { user.Id, user.FullName, user.Email, user.Role, user.IsRegularPassenger }
            });
        }

        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(password);
            var hash = sha256.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }

        private bool VerifyPassword(string plainPassword, string hashedPassword)
        {
            var hashOfInput = HashPassword(plainPassword);
            return hashOfInput == hashedPassword;
        }

        private string GenerateJwtToken(User user)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("IsRegularPassenger", user.IsRegularPassenger.ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}