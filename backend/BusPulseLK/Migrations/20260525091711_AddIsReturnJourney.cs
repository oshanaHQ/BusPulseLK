using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BusPulseLK.Migrations
{
    /// <inheritdoc />
    public partial class AddIsReturnJourney : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsReturnJourney",
                table: "trips",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsReturnJourney",
                table: "timetable_station_times",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsReturnJourney",
                table: "trips");

            migrationBuilder.DropColumn(
                name: "IsReturnJourney",
                table: "timetable_station_times");
        }
    }
}
