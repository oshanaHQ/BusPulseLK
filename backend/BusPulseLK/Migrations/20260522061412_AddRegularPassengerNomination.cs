using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BusPulseLK.Migrations
{
    /// <inheritdoc />
    public partial class AddRegularPassengerNomination : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "NominatedByUserId",
                table: "regular_passenger_requests",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_regular_passenger_requests_NominatedByUserId",
                table: "regular_passenger_requests",
                column: "NominatedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_regular_passenger_requests_Users_NominatedByUserId",
                table: "regular_passenger_requests",
                column: "NominatedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_regular_passenger_requests_Users_NominatedByUserId",
                table: "regular_passenger_requests");

            migrationBuilder.DropIndex(
                name: "IX_regular_passenger_requests_NominatedByUserId",
                table: "regular_passenger_requests");

            migrationBuilder.DropColumn(
                name: "NominatedByUserId",
                table: "regular_passenger_requests");
        }
    }
}
