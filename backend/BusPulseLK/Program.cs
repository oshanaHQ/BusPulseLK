using BusPulseLK.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using BusPulseLK.Models;
using System.Security.Cryptography;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddSignalR();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.SetIsOriginAllowed(_ => true) // Allow any origin with credentials
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "default_secret_key_for_development")),
            RoleClaimType = ClaimTypes.Role,
            NameClaimType = ClaimTypes.NameIdentifier
        };
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowAll");

// Important order
app.UseAuthentication();  // Add this
app.UseAuthorization();

app.MapControllers();
app.MapHub<BusPulseLK.Hubs.BusHub>("/hubs/bus");

// ── Seed Admin User ────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<AppDbContext>();
    
    var adminEmail = "Admin1@gmail.com";
    var adminPassword = "admin12002";
    
    // Hash password
    using var sha256 = SHA256.Create();
    var bytes = Encoding.UTF8.GetBytes(adminPassword);
    var hash = sha256.ComputeHash(bytes);
    var hashedPassword = Convert.ToBase64String(hash);

    var existingAdmin = context.Users.FirstOrDefault(u => u.Email == adminEmail);
    if (existingAdmin == null)
    {
        var adminUser = new User
        {
            FullName = "System Admin",
            Email = adminEmail,
            Password = hashedPassword,
            Role = "Admin",
            IsVerified = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(adminUser);
    }
    else
    {
        // Update password and role to ensure they are correct
        existingAdmin.Password = hashedPassword;
        existingAdmin.Role = "Admin";
        existingAdmin.IsVerified = true;
    }
    context.SaveChanges();
}

app.Run();
