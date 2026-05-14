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

        // ── New DbSets ───────────────────────────────────────────────────────
        public DbSet<Trip> Trips { get; set; }
        public DbSet<TownProgress> TownProgresses { get; set; }
        public DbSet<Announcement> Announcements { get; set; }
        public DbSet<Favorite> Favorites { get; set; }
        public DbSet<Rating> Ratings { get; set; }
        public DbSet<IssueReport> IssueReports { get; set; }
        public DbSet<RegularPassengerRequest> RegularPassengerRequests { get; set; }

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

            // ── Trips ─────────────────────────────────────────────────────────
            modelBuilder.Entity<Trip>()
                .ToTable("trips");

            // A timetable entry can have multiple trips per date (e.g. forward and return)
            modelBuilder.Entity<Trip>()
                .HasIndex(t => new { t.TimetableId, t.TripDate });

            modelBuilder.Entity<Trip>()
                .HasOne(t => t.Timetable)
                .WithMany()
                .HasForeignKey(t => t.TimetableId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Trip>()
                .HasOne(t => t.LastPassedTown)
                .WithMany()
                .HasForeignKey(t => t.LastPassedTownId)
                .OnDelete(DeleteBehavior.SetNull);

            // ── TownProgresses ────────────────────────────────────────────────
            modelBuilder.Entity<TownProgress>()
                .ToTable("town_progresses");

            // A town can only be marked as passed once per trip
            modelBuilder.Entity<TownProgress>()
                .HasIndex(tp => new { tp.TripId, tp.TownId })
                .IsUnique();

            modelBuilder.Entity<TownProgress>()
                .HasOne(tp => tp.Trip)
                .WithMany(t => t.TownProgresses)
                .HasForeignKey(tp => tp.TripId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TownProgress>()
                .HasOne(tp => tp.Town)
                .WithMany()
                .HasForeignKey(tp => tp.TownId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TownProgress>()
                .HasOne(tp => tp.UpdatedBy)
                .WithMany()
                .HasForeignKey(tp => tp.UpdatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // ── Announcements ─────────────────────────────────────────────────
            modelBuilder.Entity<Announcement>()
                .ToTable("announcements");

            modelBuilder.Entity<Announcement>()
                .HasOne(a => a.Bus)
                .WithMany()
                .HasForeignKey(a => a.BusId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Announcement>()
                .HasOne(a => a.Trip)
                .WithMany(t => t.Announcements)
                .HasForeignKey(a => a.TripId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Announcement>()
                .HasOne(a => a.CreatedBy)
                .WithMany()
                .HasForeignKey(a => a.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

            // ── Favorites ─────────────────────────────────────────────────────
            modelBuilder.Entity<Favorite>()
                .ToTable("favorites");

            // A passenger can only favorite a bus once
            modelBuilder.Entity<Favorite>()
                .HasIndex(f => new { f.PassengerId, f.BusId })
                .IsUnique();

            modelBuilder.Entity<Favorite>()
                .HasOne(f => f.Passenger)
                .WithMany()
                .HasForeignKey(f => f.PassengerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Favorite>()
                .HasOne(f => f.Bus)
                .WithMany()
                .HasForeignKey(f => f.BusId)
                .OnDelete(DeleteBehavior.Cascade);

            // ── Ratings ───────────────────────────────────────────────────────
            modelBuilder.Entity<Rating>()
                .ToTable("ratings");

            // A passenger can only rate a bus once
            modelBuilder.Entity<Rating>()
                .HasIndex(r => new { r.PassengerId, r.BusId })
                .IsUnique();

            modelBuilder.Entity<Rating>()
                .HasOne(r => r.Passenger)
                .WithMany()
                .HasForeignKey(r => r.PassengerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Rating>()
                .HasOne(r => r.Bus)
                .WithMany()
                .HasForeignKey(r => r.BusId)
                .OnDelete(DeleteBehavior.Cascade);

            // ── IssueReports ──────────────────────────────────────────────────
            modelBuilder.Entity<IssueReport>()
                .ToTable("issue_reports");

            modelBuilder.Entity<IssueReport>()
                .HasOne(ir => ir.Passenger)
                .WithMany()
                .HasForeignKey(ir => ir.PassengerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<IssueReport>()
                .HasOne(ir => ir.Bus)
                .WithMany()
                .HasForeignKey(ir => ir.BusId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<IssueReport>()
                .HasOne(ir => ir.Trip)
                .WithMany()
                .HasForeignKey(ir => ir.TripId)
                .OnDelete(DeleteBehavior.SetNull);

            // ── RegularPassengerRequests ──────────────────────────────────────
            modelBuilder.Entity<RegularPassengerRequest>()
                .ToTable("regular_passenger_requests");

            // A passenger can only have one active request per bus
            modelBuilder.Entity<RegularPassengerRequest>()
                .HasIndex(r => new { r.PassengerId, r.BusId })
                .IsUnique();

            modelBuilder.Entity<RegularPassengerRequest>()
                .HasOne(r => r.Passenger)
                .WithMany()
                .HasForeignKey(r => r.PassengerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RegularPassengerRequest>()
                .HasOne(r => r.Bus)
                .WithMany()
                .HasForeignKey(r => r.BusId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RegularPassengerRequest>()
                .HasOne(r => r.ReviewedBy)
                .WithMany()
                .HasForeignKey(r => r.ReviewedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}