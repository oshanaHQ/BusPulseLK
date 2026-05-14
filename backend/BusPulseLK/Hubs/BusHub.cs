using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace BusPulseLK.Hubs
{
    public class BusHub : Hub
    {
        // Join a group for a specific bus or trip
        public async Task JoinBusGroup(string busId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Bus_{busId}");
        }

        public async Task LeaveBusGroup(string busId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Bus_{busId}");
        }

        // Broadcast location/progress update
        // This is called by the Driver/Conductor app
        public async Task UpdateBusStatus(string busId, object status)
        {
            // Broadcast to the group including the busId so clients can verify
            await Clients.Group($"Bus_{busId}").SendAsync("ReceiveBusStatus", busId, status);
        }

        // Broadcast a general announcement
        public async Task SendAnnouncement(string busId, string message)
        {
            await Clients.Group($"Bus_{busId}").SendAsync("ReceiveAnnouncement", new { busId, message, timestamp = System.DateTime.UtcNow });
        }
    }
}
