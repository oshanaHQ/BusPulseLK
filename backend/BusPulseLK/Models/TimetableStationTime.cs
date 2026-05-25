using System.ComponentModel.DataAnnotations;

namespace BusPulseLK.Models
{
    /// <summary>
    /// Represents the expected (normal) arrival time at a specific stop for a given timetable.
    /// </summary>
    public class TimetableStationTime
    {
        public int Id { get; set; }

        [Required]
        public int TimetableId { get; set; }
        public Timetable Timetable { get; set; } = null!;

        [Required]
        public int RouteStopId { get; set; }
        public RouteStop RouteStop { get; set; } = null!;

        /// <summary>
        /// The expected time of arrival at this station for this specific timetable.
        /// </summary>
        [Required]
        public TimeSpan ExpectedTime { get; set; }

        /// <summary>Whether this time applies to the return journey.</summary>
        public bool IsReturnJourney { get; set; } = false;
    }
}
