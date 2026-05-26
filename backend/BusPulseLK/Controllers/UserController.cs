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
                return BadRequest(new { message = "This email is already registered. Users can only sign up once per email." });

            if (await _context.Users.AnyAsync(u => u.FullName.ToLower() == dto.FullName.ToLower()))
            {
                var random = new Random();
                string suggestedName = $"{dto.FullName}{random.Next(10, 999)}";
                return BadRequest(new { message = $"Username '{dto.FullName}' is already taken. Please try another name, for example: '{suggestedName}'" });
            }

            var allowedRoles = new[] { "Admin", "BusOwner", "Driver", "Conductor", "Passenger" };
            if (!allowedRoles.Contains(dto.Role))
                return BadRequest(new { message = "Invalid role." });

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
                token = token,
                user = new { user.Id, user.FullName, user.Email, user.Role }
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginUserDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (user == null || !VerifyPassword(dto.Password, user.Password))
                return BadRequest(new { message = "Invalid email or password." });

            var token = GenerateJwtToken(user);

            return Ok(new 
            { 
                token = token,
                user = new { user.Id, user.FullName, user.Email, user.Role, user.IsRegularPassenger }
            });
        }

        // ────────────────────────────────────────────────────────────────────
        // GET api/user/staff?role=Driver&search=...
        // Admin or BusOwner search for staff
        // ────────────────────────────────────────────────────────────────────
        [HttpGet("staff")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin,BusOwner")]
        public async Task<ActionResult<IEnumerable<object>>> SearchStaff(
            [FromQuery] string role,
            [FromQuery] string? search = null)
        {
            if (role != "Driver" && role != "Conductor")
                return BadRequest(new { message = "Role must be Driver or Conductor." });

            var query = _context.Users
                .Where(u => u.Role == role)
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                var s = search.ToLower();
                query = query.Where(u => 
                    u.FullName.ToLower().Contains(s) || 
                    u.Email.ToLower().Contains(s));
            }

            var staff = await query
                .Take(20)
                .Select(u => new { u.Id, u.FullName, u.Email, u.Role })
                .ToListAsync();

            return Ok(staff);
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

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? "default_secret_key_for_development"));
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