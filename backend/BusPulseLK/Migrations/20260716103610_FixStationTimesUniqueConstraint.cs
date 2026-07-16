using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BusPulseLK.Migrations
{
    /// <inheritdoc />
    public partial class FixStationTimesUniqueConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop the old constraint that only covers (TimetableId, RouteStopId).
            // This prevented adding both a forward and a return time for the same stop.
            migrationBuilder.DropIndex(
                name: "IX_timetable_station_times_TimetableId_RouteStopId",
                table: "timetable_station_times");

            // Create the correct constraint: a stop can appear once per direction per timetable.
            migrationBuilder.CreateIndex(
                name: "IX_timetable_station_times_TimetableId_RouteStopId_IsReturnJourney",
                table: "timetable_station_times",
                columns: new[] { "TimetableId", "RouteStopId", "IsReturnJourney" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_timetable_station_times_TimetableId_RouteStopId_IsReturnJourney",
                table: "timetable_station_times");

            migrationBuilder.CreateIndex(
                name: "IX_timetable_station_times_TimetableId_RouteStopId",
                table: "timetable_station_times",
                columns: new[] { "TimetableId", "RouteStopId" },
                unique: true);
        }
    }
}
