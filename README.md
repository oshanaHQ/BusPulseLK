<div align="center">

<br/>

<img src="https://img.shields.io/badge/🚌_BusPulse_LK-FF6200?style=for-the-badge&labelColor=000000&logoColor=white" width="340" alt="BusPulse LK"/>

<br/><br/>

<p>
  <img src="https://img.shields.io/badge/v1.0.0-release-FF6200?style=flat-square&labelColor=111111" />
  &nbsp;
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20iOS-0a7ea4?style=flat-square&labelColor=111111" />
  &nbsp;
  <img src="https://img.shields.io/badge/.NET-8.0-512BD4?style=flat-square&labelColor=111111" />
  &nbsp;
  <img src="https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&labelColor=111111" />
  &nbsp;
  <img src="https://img.shields.io/badge/SignalR-Real--Time-FF6200?style=flat-square&labelColor=111111" />
  &nbsp;
  <img src="https://img.shields.io/badge/License-MIT-2E7D32?style=flat-square&labelColor=111111" />
</p>

<br/>

**BusPulse LK** is a real-time bus tracking and fleet management platform for Sri Lanka's public transport network. It connects passengers, bus workers, fleet owners, and system administrators through a single unified mobile application — providing live location updates, schedule tracking, fleet oversight, and data-driven decision making.

<br/>

---

</div>

## Overview

Sri Lanka's public bus network moves millions of people daily, yet real-time information for passengers remains virtually non-existent. BusPulse LK addresses this by building a connected ecosystem where every stakeholder — from the passenger at the bus stop to the fleet owner at their office — has access to the information they need, in real time.

The platform operates across four distinct user roles. **Passengers** can search for buses, track live locations on an interactive map, save favourite routes, rate services, and register as regular riders on specific schedules. **Workers** (drivers and conductors) manage active trips, broadcast GPS positions, mark station progress, and raise in-trip issue reports. **Bus owners** oversee their entire fleet, manage staff assignments and route schedules, submit route proposals to administrators, and communicate directly with passengers through announcements. **Administrators** govern the entire system — approving buses, managing routes and towns, reviewing route requests, and monitoring regular passenger registrations platform-wide.

Location tracking operates in two modes. In **Manual mode**, the worker taps to confirm each stop as the bus passes through, and passengers see a live progress bar with next-stop information and delay estimates against the published timetable. In **Automatic mode**, the device streams live GPS coordinates via `expo-location`, and passengers watch a real-time bus marker move across an interactive OpenStreetMap-powered map — completely free, with no third-party map API costs.

Real-time communication throughout the platform is powered by **ASP.NET Core SignalR**, enabling instant bidirectional updates between the server and all connected clients. This covers live GPS coordinates, stop-progress updates, bus status changes, driver announcements, and emergency route deviation alerts — all pushed to relevant passengers the moment they are triggered by a worker.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      BusPulse LK Platform                    │
├──────────────────────────┬───────────────────────────────────┤
│      📱 Mobile App       │          🖥️  Backend API          │
│  (React Native / Expo)   │       (ASP.NET Core 8.0)          │
│                          │                                    │
│  ┌────────────────────┐  │  ┌──────────────────────────────┐ │
│  │  Passenger View    │◄─┼─►│  REST Controllers (13)       │ │
│  │  Worker View       │  │  │  JWT Authentication          │ │
│  │  Owner View        │  │  │  Role-Based Authorization    │ │
│  │  Admin View        │  │  └──────────────────────────────┘ │
│  └────────────────────┘  │                 │                  │
│            │             │  ┌──────────────────────────────┐ │
│  ┌─────────▼──────────┐  │  │  SignalR Hub  (/hubs/bus)    │ │
│  │  @microsoft/       │◄─┼─►│  GPS · Status · Announce     │ │
│  │  signalr client    │  │  │  Emergency · Progress        │ │
│  └────────────────────┘  │  └──────────────────────────────┘ │
│                          │                 │                  │
│  ┌────────────────────┐  │  ┌──────────────────────────────┐ │
│  │  OpenStreetMap     │  │  │  PostgreSQL Database          │ │
│  │  (WebView+Leaflet) │  │  │  (Entity Framework Core 8)   │ │
│  └────────────────────┘  │  └──────────────────────────────┘ │
└──────────────────────────┴───────────────────────────────────┘
```

---

## Tech Stack

### Mobile — React Native / Expo

| Package | Version | Role |
|---|---|---|
| React Native | 0.81.5 | Core mobile framework |
| Expo | ~54.0.25 | Build tooling & native module access |
| Expo Router | ~6.0.15 | File-based navigation |
| TypeScript | ~5.9.2 | Type safety across the frontend |
| @microsoft/signalr | ^10.0.0 | WebSocket real-time client |
| expo-location | ^55.1.10 | Foreground & background GPS |
| expo-notifications | ~0.32.17 | Push notifications |
| expo-task-manager | ~14.0.9 | Background task execution |
| react-native-webview | ^13.16.1 | Leaflet.js map rendering |
| react-native-reanimated | ~4.1.1 | Animations |
| @react-native-async-storage | 2.2.0 | Persistent JWT session storage |

### Backend — ASP.NET Core 8.0

| Package | Version | Role |
|---|---|---|
| ASP.NET Core | .NET 8.0 | REST API & SignalR host |
| Entity Framework Core | 8.0.4 | ORM & database migrations |
| Npgsql | 8.0.4 | PostgreSQL provider |
| Microsoft.AspNetCore.SignalR | Built-in | Real-time WebSocket hub |
| JWT Bearer Auth | 8.0.10 | Stateless token authentication |
| Swashbuckle (Swagger) | 6.6.2 | API documentation |

---

## Getting Started

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8)
- [Node.js](https://nodejs.org/) v18+
- [PostgreSQL](https://www.postgresql.org/)
- [Expo CLI](https://docs.expo.dev/more/expo-cli/)

### Backend

```bash
cd backend/BusPulseLK

# Configure your PostgreSQL connection string in appsettings.json

dotnet ef database update

dotnet run
```

> API available at `http://localhost:5251` · Swagger UI at `/swagger`

### Mobile App

```bash
cd frontend/BusPulseLK

npm install

npm start          # Expo Dev Server
npm run android    # Android
npm run ios        # iOS
```

> For GPS tracking on a physical device, an [EAS Development Build](https://docs.expo.dev/develop/development-builds/introduction/) is required instead of Expo Go.

```bash
eas build --profile development --platform android
```

---

<div align="center">

<br/>

<img src="https://img.shields.io/badge/React_Native-0a7ea4?style=flat-square&labelColor=111111&logo=react&logoColor=white" />
&nbsp;
<img src="https://img.shields.io/badge/ASP.NET_Core-512BD4?style=flat-square&labelColor=111111&logo=dotnet&logoColor=white" />
&nbsp;
<img src="https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&labelColor=111111&logo=postgresql&logoColor=white" />
&nbsp;
<img src="https://img.shields.io/badge/SignalR-FF6200?style=flat-square&labelColor=111111" />
&nbsp;
<img src="https://img.shields.io/badge/OpenStreetMap-2E7D32?style=flat-square&labelColor=111111&logo=openstreetmap&logoColor=white" />

<br/><br/>

*© 2026 BusPulse LK. All rights reserved.*

</div>
