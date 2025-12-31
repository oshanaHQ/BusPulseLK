using Microsoft.EntityFrameworkCore;
using BusPulseLK.Models; // Namespace where User.cs is

namespace BusPulseLK.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; } // Add your tables here
    }
}
