using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BusPulseLK.Migrations
{
    /// <inheritdoc />
    public partial class AddTripTrackingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "CurrentLatitude",
                table: "trips",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "CurrentLongitude",
                table: "trips",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TrackingMode",
                table: "trips",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "towns",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "towns",
                type: "double precision",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CurrentLatitude",
                table: "trips");

            migrationBuilder.DropColumn(
                name: "CurrentLongitude",
                table: "trips");

            migrationBuilder.DropColumn(
                name: "TrackingMode",
                table: "trips");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "towns");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "towns");
        }
    }
}
