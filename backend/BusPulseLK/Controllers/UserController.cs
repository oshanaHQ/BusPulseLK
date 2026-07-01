using Microsoft.AspNetCore.Mvc;
using BusPulseLK.Data;
using BusPulseLK.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Caching.Memory;
using BusPulseLK.Services;

namespace BusPulseLK.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IMemoryCache _cache;
        private readonly IEmailService _emailService;

        public UserController(AppDbContext context, IConfiguration configuration, IMemoryCache cache, IEmailService emailService)
        {
            _context = context;
            _configuration = configuration;
            _cache = cache;
            _emailService = emailService;
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
        // Forgot Password Flow
        // ────────────────────────────────────────────────────────────────────

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null)
                return Ok(new { message = "If the email is registered, a reset code will be sent." }); // Security best practice

            var random = new Random();
            var code = random.Next(100000, 999999).ToString();

            // Store code in cache for 15 minutes mapped to email
            _cache.Set($"PwdReset_{dto.Email}", code, TimeSpan.FromMinutes(15));

            var subject = "BusPulseLK - Password Reset Code";
            var body = $@"
                <div style='font-family: Arial, sans-serif; padding: 20px;'>
                    <h2>Password Reset Request</h2>
                    <p>Hi {user.FullName},</p>
                    <p>We received a request to reset your password. Use the following 6-digit code to complete the process:</p>
                    <h1 style='color: #FF6200; letter-spacing: 5px;'>{code}</h1>
                    <p>This code will expire in 15 minutes.</p>
                    <p>If you didn't request this, you can safely ignore this email.</p>
                    <br>
                    <p>Thanks,<br>BusPulseLK Team</p>
                </div>
            ";

            await _emailService.SendEmailAsync(dto.Email, subject, body);

            return Ok(new { message = "If the email is registered, a reset code will be sent." });
        }

        [HttpPost("verify-reset-code")]
        public IActionResult VerifyResetCode(VerifyResetCodeDto dto)
        {
            if (_cache.TryGetValue($"PwdReset_{dto.Email}", out string? cachedCode))
            {
                if (cachedCode == dto.Code)
                {
                    return Ok(new { message = "Code verified." });
                }
            }
            return BadRequest(new { message = "Invalid or expired code." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto dto)
        {
            if (dto.NewPassword == null || dto.NewPassword.Length < 8)
                return BadRequest(new { message = "Password must be at least 8 characters long." });

            if (_cache.TryGetValue($"PwdReset_{dto.Email}", out string? cachedCode))
            {
                if (cachedCode == dto.Code)
                {
                    var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
                    if (user == null) return NotFound(new { message = "User not found." });

                    user.Password = HashPassword(dto.NewPassword);
                    await _context.SaveChangesAsync();

                    // Remove code so it can't be reused
                    _cache.Remove($"PwdReset_{dto.Email}");

                    return Ok(new { message = "Password reset successfully." });
                }
            }
            return BadRequest(new { message = "Invalid or expired code." });
        }

        // ────────────────────────────────────────────────────────────────────
        // GET api/user/profile
        // Returns the caller's own profile (all roles)
        // ────────────────────────────────────────────────────────────────────
        [HttpGet("profile")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> GetProfile()
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            return Ok(new UserProfileDto
            {
                Id       = user.Id,
                FullName = user.FullName,
                Email    = user.Email,
                Role     = user.Role,
                AvatarId = user.AvatarId,
            });
        }

        // ────────────────────────────────────────────────────────────────────
        // PUT api/user/update-profile
        // Updates display name and/or avatar index (all roles)
        // ────────────────────────────────────────────────────────────────────
        [HttpPut("update-profile")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> UpdateProfile(UpdateProfileDto dto)
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(dto.FullName))
            {
                // Uniqueness check — exclude the current user
                var nameTaken = await _context.Users
                    .AnyAsync(u => u.Id != userId && u.FullName.ToLower() == dto.FullName.ToLower());
                if (nameTaken)
                {
                    var random = new Random();
                    string suggested = $"{dto.FullName}{random.Next(10, 999)}";
                    return BadRequest(new { message = $"Name '{dto.FullName}' is already taken. Try '{suggested}'." });
                }
                user.FullName = dto.FullName;
            }

            if (dto.AvatarId.HasValue)
                user.AvatarId = dto.AvatarId.Value;

            await _context.SaveChangesAsync();

            return Ok(new UserProfileDto
            {
                Id       = user.Id,
                FullName = user.FullName,
                Email    = user.Email,
                Role     = user.Role,
                AvatarId = user.AvatarId,
            });
        }

        // ────────────────────────────────────────────────────────────────────
        // PUT api/user/change-password
        // Verifies current password then sets new hashed password (all roles)
        // ────────────────────────────────────────────────────────────────────
        [HttpPut("change-password")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            if (!VerifyPassword(dto.CurrentPassword, user.Password))
                return BadRequest(new { message = "Current password is incorrect." });

            if (dto.NewPassword == dto.CurrentPassword)
                return BadRequest(new { message = "New password must be different from your current password." });

            user.Password = HashPassword(dto.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Password changed successfully." });
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
        // ────────────────────────────────────────────────────────────────────
        // GET api/user/admin-stats
        // Admin only: Returns quick stats and recent activities for dashboard
        // ────────────────────────────────────────────────────────────────────
        [HttpGet("admin-stats")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAdminStats()
        {
            var totalBuses = await _context.Buses.CountAsync();
            var totalPassengers = await _context.Users.CountAsync(u => u.Role == "Passenger");
            var pendingApprovals = await _context.Buses.CountAsync(b => !b.IsActive);
            var activeRoutes = await _context.Routes.CountAsync(r => r.IsActive);

            var recentActivity = new List<object>();

            // Fetch recent users (e.g., new owners)
            var recentUsers = await _context.Users
                .Where(u => u.Role == "BusOwner")
                .OrderByDescending(u => u.CreatedAt)
                .Take(2)
                .Select(u => new
                {
                    Type = "NewOwner",
                    Text = $"New Owner Registration: {u.FullName}",
                    Time = u.CreatedAt,
                    Icon = "person-add-outline"
                })
                .ToListAsync();
            recentActivity.AddRange(recentUsers);

            // Fetch recent buses added
            var recentBuses = await _context.Buses
                .OrderByDescending(b => b.CreatedAt)
                .Take(2)
                .Select(b => new
                {
                    Type = "BusAdded",
                    Text = $"Bus Added: {b.NumberPlate}",
                    Time = b.CreatedAt,
                    Icon = "bus-outline"
                })
                .ToListAsync();
            recentActivity.AddRange(recentBuses);

            // Fetch recent routes
            var recentRoutes = await _context.Routes
                .Include(r => r.OriginTown)
                .Include(r => r.DestinationTown)
                .OrderByDescending(r => r.CreatedAt)
                .Take(2)
                .Select(r => new
                {
                    Type = "RouteUpdated",
                    Text = $"Route Updated: {r.OriginTown.Name}-{r.DestinationTown.Name}",
                    Time = r.CreatedAt,
                    Icon = "git-branch-outline"
                })
                .ToListAsync();
            recentActivity.AddRange(recentRoutes);

            var sortedActivity = recentActivity.OrderByDescending(a => ((dynamic)a).Time).Take(4).ToList();

            return Ok(new
            {
                Stats = new
                {
                    TotalBuses = totalBuses,
                    TotalPassengers = totalPassengers,
                    PendingApprovals = pendingApprovals,
                    ActiveRoutes = activeRoutes
                },
                Activities = sortedActivity
            });
        }
    }
}