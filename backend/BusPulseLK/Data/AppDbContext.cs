using Microsoft.EntityFrameworkCore;
using BusPulseLK.Models;

namespace BusPulseLK.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Town> Towns { get; set; }     // ← NEW LINE ADDED

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Optional: better table name (lowercase - common in PostgreSQL)
            modelBuilder.Entity<Town>()
                .ToTable("towns");

            // Prevent duplicate town names (case insensitive)
            modelBuilder.Entity<Town>()
                .HasIndex(t => t.Name)
                .IsUnique();
        }
    }
}