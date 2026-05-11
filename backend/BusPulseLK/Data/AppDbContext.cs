using Microsoft.EntityFrameworkCore;
using BusPulseLK.Models;

namespace BusPulseLK.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // ── DbSets ───────────────────────────────────────────────────────────
        public DbSet<User> Users { get; set; }
        public DbSet<Town> Towns { get; set; }
        public DbSet<BusPulseLK.Models.Route> Routes { get; set; }
        public DbSet<RouteStop> RouteStops { get; set; }
        public DbSet<Bus> Buses { get; set; }
        public DbSet<Timetable> Timetables { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ── Towns ─────────────────────────────────────────────────────────
            modelBuilder.Entity<Town>()
                .ToTable("towns");

            modelBuilder.Entity<Town>()
                .HasIndex(t => t.Name)
                .IsUnique();

            modelBuilder.Entity<Town>()
                .HasOne(t => t.CreatedBy)
                .WithMany()
                .HasForeignKey(t => t.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

            // ── Routes ────────────────────────────────────────────────────────
            modelBuilder.Entity<BusPulseLK.Models.Route>()
                .ToTable("routes");

            modelBuilder.Entity<BusPulseLK.Models.Route>()
                .HasOne(r => r.OriginTown)
                .WithMany()
                .HasForeignKey(r => r.OriginTownId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<BusPulseLK.Models.Route>()
                .HasOne(r => r.DestinationTown)
                .WithMany()
                .HasForeignKey(r => r.DestinationTownId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<BusPulseLK.Models.Route>()
                .HasOne(r => r.CreatedBy)
                .WithMany()
                .HasForeignKey(r => r.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

            // ── RouteStops ────────────────────────────────────────────────────
            modelBuilder.Entity<RouteStop>()
                .ToTable("route_stops");

            // Each stop position must be unique within a route
            modelBuilder.Entity<RouteStop>()
                .HasIndex(rs => new { rs.RouteId, rs.StopOrder })
                .IsUnique();

            // A town can only appear once per route
            modelBuilder.Entity<RouteStop>()
                .HasIndex(rs => new { rs.RouteId, rs.TownId })
                .IsUnique();

            modelBuilder.Entity<RouteStop>()
                .HasOne(rs => rs.Route)
                .WithMany(r => r.Stops)
                .HasForeignKey(rs => rs.RouteId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RouteStop>()
                .HasOne(rs => rs.Town)
                .WithMany()
                .HasForeignKey(rs => rs.TownId)
                .OnDelete(DeleteBehavior.Restrict);

            // ── Buses ─────────────────────────────────────────────────────────
            modelBuilder.Entity<Bus>()
                .ToTable("buses");

            // Number plates must be unique across all buses
            modelBuilder.Entity<Bus>()
                .HasIndex(b => b.NumberPlate)
                .IsUnique();

            modelBuilder.Entity<Bus>()
                .HasOne(b => b.Owner)
                .WithMany()
                .HasForeignKey(b => b.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Bus>()
                .HasOne(b => b.Driver)
                .WithMany()
                .HasForeignKey(b => b.DriverId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Bus>()
                .HasOne(b => b.Conductor)
                .WithMany()
                .HasForeignKey(b => b.ConductorId)
                .OnDelete(DeleteBehavior.SetNull);

            // ── Timetables ────────────────────────────────────────────────────
            modelBuilder.Entity<Timetable>()
                .ToTable("timetables");

            // Prevent the same bus being scheduled twice at the same time on a route
            modelBuilder.Entity<Timetable>()
                .HasIndex(t => new { t.BusId, t.RouteId, t.DepartureTime })
                .IsUnique();

            modelBuilder.Entity<Timetable>()
                .HasOne(t => t.Bus)
                .WithMany(b => b.Timetables)
                .HasForeignKey(t => t.BusId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Timetable>()
                .HasOne(t => t.Route)
                .WithMany(r => r.Timetables)
                .HasForeignKey(t => t.RouteId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Timetable>()
                .HasOne(t => t.CreatedBy)
                .WithMany()
                .HasForeignKey(t => t.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}