using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BusPulseLK.Migrations
{
    /// <inheritdoc />
    public partial class RemoveUniqueTripConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_trips_TimetableId_TripDate",
                table: "trips");

            migrationBuilder.CreateIndex(
                name: "IX_trips_TimetableId_TripDate",
                table: "trips",
                columns: new[] { "TimetableId", "TripDate" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_trips_TimetableId_TripDate",
                table: "trips");

            migrationBuilder.CreateIndex(
                name: "IX_trips_TimetableId_TripDate",
                table: "trips",
                columns: new[] { "TimetableId", "TripDate" },
                unique: true);
        }
    }
}
