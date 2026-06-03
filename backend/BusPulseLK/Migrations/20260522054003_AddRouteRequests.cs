using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace BusPulseLK.Migrations
{
    /// <inheritdoc />
    public partial class AddRouteRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "route_requests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    RouteNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    OriginTownId = table.Column<int>(type: "integer", nullable: false),
                    DestinationTownId = table.Column<int>(type: "integer", nullable: false),
                    RequestedByUserId = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    StatusReason = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_route_requests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_route_requests_Users_RequestedByUserId",
                        column: x => x.RequestedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_route_requests_towns_DestinationTownId",
                        column: x => x.DestinationTownId,
                        principalTable: "towns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_route_requests_towns_OriginTownId",
                        column: x => x.OriginTownId,
                        principalTable: "towns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "route_request_stops",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RouteRequestId = table.Column<int>(type: "integer", nullable: false),
                    TownId = table.Column<int>(type: "integer", nullable: false),
                    StopOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_route_request_stops", x => x.Id);
                    table.ForeignKey(
                        name: "FK_route_request_stops_route_requests_RouteRequestId",
                        column: x => x.RouteRequestId,
                        principalTable: "route_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_route_request_stops_towns_TownId",
                        column: x => x.TownId,
                        principalTable: "towns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_route_request_stops_RouteRequestId_StopOrder",
                table: "route_request_stops",
                columns: new[] { "RouteRequestId", "StopOrder" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_route_request_stops_RouteRequestId_TownId",
                table: "route_request_stops",
                columns: new[] { "RouteRequestId", "TownId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_route_request_stops_TownId",
                table: "route_request_stops",
                column: "TownId");

            migrationBuilder.CreateIndex(
                name: "IX_route_requests_DestinationTownId",
                table: "route_requests",
                column: "DestinationTownId");

            migrationBuilder.CreateIndex(
                name: "IX_route_requests_OriginTownId",
                table: "route_requests",
                column: "OriginTownId");

            migrationBuilder.CreateIndex(
                name: "IX_route_requests_RequestedByUserId",
                table: "route_requests",
                column: "RequestedByUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "route_request_stops");

            migrationBuilder.DropTable(
                name: "route_requests");
        }
    }
}
