using System.ComponentModel.DataAnnotations;

namespace BusPulseLK.Models
{
    // ── Route DTOs ───────────────────────────────────────────────────────────

    public class CreateRouteDto
    {
        [Required]
        [StringLength(150, MinimumLength = 3)]
        public string Name { get; set; } = null!;

        [Required]
        [StringLength(20)]
        public string RouteNumber { get; set; } = null!;

        [Required]
        public int OriginTownId { get; set; }

        [Required]
        public int DestinationTownId { get; set; }

        /// <summary>
        /// Ordered list of ALL stop town IDs: must start with OriginTownId
        /// and end with DestinationTownId.
        /// Minimum 2 items (origin + destination).
        /// </summary>
        [Required]
        [MinLength(2)]
        public List<int> StopTownIds { get; set; } = new();
    }

    public class UpdateRouteDto
    {
        [StringLength(150, MinimumLength = 3)]
        public string? Name { get; set; }

        [StringLength(20)]
        public string? RouteNumber { get; set; }

        public bool? IsActive { get; set; }

        /// <summary>
        /// If provided, replaces all existing stops with this new ordered list.
        /// Must still start with the route's OriginTownId and end with DestinationTownId.
        /// </summary>
        public List<int>? StopTownIds { get; set; }
    }

    public class RouteResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string RouteNumber { get; set; } = null!;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public TownSummaryDto OriginTown { get; set; } = null!;
        public TownSummaryDto DestinationTown { get; set; } = null!;
        public List<RouteStopDto> Stops { get; set; } = new();
    }

    public class RouteStopDto
    {
        public int Id { get; set; }
        public int StopOrder { get; set; }
        public TownSummaryDto Town { get; set; } = null!;
    }

    public class TownSummaryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
    }

    // ── Route Request DTOs ───────────────────────────────────────────────────

    public class CreateRouteRequestDto
    {
        [Required]
        [StringLength(150, MinimumLength = 3)]
        public string Name { get; set; } = null!;

        [Required]
        [StringLength(20)]
        public string RouteNumber { get; set; } = null!;

        [StringLength(500)]
        public string? Description { get; set; }

        [Required]
        public int OriginTownId { get; set; }

        [Required]
        public int DestinationTownId { get; set; }

        [Required]
        [MinLength(2)]
        public List<int> StopTownIds { get; set; } = new();
    }

    public class UpdateRouteRequestDto
    {
        [StringLength(150, MinimumLength = 3)]
        public string? Name { get; set; }

        [StringLength(20)]
        public string? RouteNumber { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        public List<int>? StopTownIds { get; set; }
    }

    public class RejectRouteRequestDto
    {
        [Required]
        [StringLength(300, MinimumLength = 3)]
        public string StatusReason { get; set; } = null!;
    }

    public class RouteRequestResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string RouteNumber { get; set; } = null!;
        public string? Description { get; set; }
        public string Status { get; set; } = null!;
        public string? StatusReason { get; set; }
        public DateTime CreatedAt { get; set; }
        public TownSummaryDto OriginTown { get; set; } = null!;
        public TownSummaryDto DestinationTown { get; set; } = null!;
        public UserSummaryDto RequestedByUser { get; set; } = null!;
        public List<RouteRequestStopDto> Stops { get; set; } = new();
    }

    public class RouteRequestStopDto
    {
        public int Id { get; set; }
        public int StopOrder { get; set; }
        public TownSummaryDto Town { get; set; } = null!;
    }

    // ── Bus DTOs ─────────────────────────────────────────────────────────────

    public class CreateBusDto
    {
        [Required]
        [StringLength(20, MinimumLength = 4)]
        public string NumberPlate { get; set; } = null!;

        [StringLength(100)]
        public string? Name { get; set; }

        [Required]
        [StringLength(30)]
        public string BusType { get; set; } = "Non-AC";

        [Range(10, 120)]
        public int SeatingCapacity { get; set; } = 50;
    }

    public class UpdateBusDto
    {
        [StringLength(100)]
        public string? Name { get; set; }

        [StringLength(30)]
        public string? BusType { get; set; }

        [Range(10, 120)]
        public int? SeatingCapacity { get; set; }

        public bool? IsActive { get; set; }

        /// <summary>Assign or remove a Driver. Set to 0 to unassign.</summary>
        public int? DriverId { get; set; }

        /// <summary>Assign or remove a Conductor. Set to 0 to unassign.</summary>
        public int? ConductorId { get; set; }
    }

    public class BusResponseDto
    {
        public int Id { get; set; }
        public string NumberPlate { get; set; } = null!;
        public string? Name { get; set; }
        public string BusType { get; set; } = null!;
        public int SeatingCapacity { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public UserSummaryDto Owner { get; set; } = null!;
        public UserSummaryDto? Driver { get; set; }
        public UserSummaryDto? Conductor { get; set; }
    }

    public class UserSummaryDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Role { get; set; } = null!;
    }

    // ── Timetable DTOs ───────────────────────────────────────────────────────

    public class CreateTimetableDto
    {
        [Required]
        public int BusId { get; set; }

        [Required]
        public int RouteId { get; set; }

        /// <summary>Departure time as "HH:mm" or "HH:mm:ss" string</summary>
        [Required]
        [RegularExpression(@"^\d{1,2}:\d{2}(:\d{2})?$", ErrorMessage = "Use HH:mm or HH:mm:ss format")]
        public string DepartureTime { get; set; } = null!;

        [StringLength(50)]
        public string OperatingDays { get; set; } = "Daily";

        public List<StationTimeDto>? StationTimes { get; set; }
    }

    public class UpdateTimetableDto
    {
        [RegularExpression(@"^\d{1,2}:\d{2}(:\d{2})?$", ErrorMessage = "Use HH:mm or HH:mm:ss format")]
        public string? DepartureTime { get; set; }

        [StringLength(50)]
        public string? OperatingDays { get; set; }

        public bool? IsActive { get; set; }

        public List<StationTimeDto>? StationTimes { get; set; }
    }

    public class TimetableResponseDto
    {
        public int Id { get; set; }
        public string DepartureTime { get; set; } = null!;
        public string OperatingDays { get; set; } = null!;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public BusSummaryDto Bus { get; set; } = null!;
        public RouteSummaryDto Route { get; set; } = null!;
        public List<StationTimeDto> StationTimes { get; set; } = new();
    }

    public class BusSummaryDto
    {
        public int Id { get; set; }
        public string NumberPlate { get; set; } = null!;
        public string? Name { get; set; }
        public string BusType { get; set; } = null!;
        public bool IsActive { get; set; }
        public int Capacity { get; set; }
        public int OwnerId { get; set; }
        public UserSummaryDto Owner { get; set; } = null!;
        public UserSummaryDto? Driver { get; set; }
        public UserSummaryDto? Conductor { get; set; }
    }

    public class RouteSummaryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string RouteNumber { get; set; } = null!;
        public string OriginTown { get; set; } = null!;
        public string DestinationTown { get; set; } = null!;
        public double DistanceKm { get; set; }
        public decimal BaseFare { get; set; }
    }

    public class StationTimeDto
    {
        public int RouteStopId { get; set; }
        public int TownId { get; set; }
        public string ExpectedTime { get; set; } = null!;
        public bool IsReturnJourney { get; set; }
    }


    // ── Staff Assignment DTO ─────────────────────────────────────────────────

    /// <summary>
    /// Simple payload used by PATCH assign-driver and assign-conductor endpoints.
    /// </summary>
    public class AssignStaffDto
    {
        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.Range(1, int.MaxValue, ErrorMessage = "UserId must be a positive integer.")]
        public int UserId { get; set; }
    }

    // ── Route–Bus Assignment DTOs ───────────────────────────────────────────

    /// <summary>
    /// Response for GET /api/routes/{id}/buses — one entry per bus,
    /// containing all departure time slots for that bus on this route.
    /// </summary>
    public class RouteBusAssignmentDto
    {
        public BusResponseDto Bus { get; set; } = null!;
        public List<DepartureSlotDto> DepartureSlots { get; set; } = new();
    }

    /// <summary>A single departure slot within a RouteBusAssignmentDto.</summary>
    public class DepartureSlotDto
    {
        public int TimetableId { get; set; }
        public string DepartureTime { get; set; } = null!;
        public string OperatingDays { get; set; } = null!;
        public List<StationTimeDto> StationTimes { get; set; } = new();
    }
}
