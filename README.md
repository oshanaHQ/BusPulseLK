<div align="center">

<br/>

<!-- Logo / Title Banner -->
<img src="https://img.shields.io/badge/🚌_BusPulse_LK-Real--Time_Bus_Tracking-FF6200?style=for-the-badge&labelColor=000000&color=FF6200" alt="BusPulse LK" width="420"/>

<br/><br/>

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-FF6200?style=flat-square&logo=semver&logoColor=white&labelColor=111111" />
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20iOS-0a7ea4?style=flat-square&logo=expo&logoColor=white&labelColor=111111" />
  <img src="https://img.shields.io/badge/Backend-.NET%208.0-512BD4?style=flat-square&logo=dotnet&logoColor=white&labelColor=111111" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white&labelColor=111111" />
  <img src="https://img.shields.io/badge/Real--Time-SignalR-FF6200?style=flat-square&logo=microsoftsignalr&logoColor=white&labelColor=111111" />
  <img src="https://img.shields.io/badge/License-MIT-2E7D32?style=flat-square&labelColor=111111" />
</p>

<br/>

> **🚌 BusPulse LK** is a real-time bus tracking and fleet management platform built for Sri Lanka's public transport system. It enables passengers to track live bus locations, workers to manage trips, owners to oversee their fleet, and admins to govern the entire network — all from one unified mobile application.

<br/>

---

</div>

## 📋 Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🎨 Design System](#-design-system)
- [📱 User Roles](#-user-roles)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [🔌 API Overview](#-api-overview)
- [📡 Real-Time Communication](#-real-time-communication)
- [🗺️ Live Tracking](#️-live-tracking)
- [🔐 Authentication](#-authentication)
- [📂 Project Structure](#-project-structure)
- [🤝 Contributing](#-contributing)

---

## ✨ Features

<table>
  <tr>
    <td align="center" width="220">
      <h3>🛰️ Live Tracking</h3>
      <p>Real-time GPS bus location updates streamed to passengers via SignalR WebSockets</p>
    </td>
    <td align="center" width="220">
      <h3>🗺️ Route Management</h3>
      <p>Interactive route planning with stop-by-stop timetables and station timings</p>
    </td>
    <td align="center" width="220">
      <h3>📢 Announcements</h3>
      <p>Bus owners can broadcast real-time announcements to all passengers on a route</p>
    </td>
  </tr>
  <tr>
    <td align="center" width="220">
      <h3>⭐ Ratings System</h3>
      <p>Passengers can rate buses and drivers; owners can review feedback per bus</p>
    </td>
    <td align="center" width="220">
      <h3>🔔 Push Notifications</h3>
      <p>Expo push notifications for trip events, approvals, and alerts</p>
    </td>
    <td align="center" width="220">
      <h3>🧍 Regular Passengers</h3>
      <p>Passengers can register as regulars on specific routes for priority tracking</p>
    </td>
  </tr>
  <tr>
    <td align="center" width="220">
      <h3>🚌 Fleet Management</h3>
      <p>Bus owners manage their entire fleet, staff assignments, and route requests</p>
    </td>
    <td align="center" width="220">
      <h3>🛡️ Admin Control</h3>
      <p>System administrators approve buses, manage routes, towns, and users</p>
    </td>
    <td align="center" width="220">
      <h3>📋 Issue Reporting</h3>
      <p>In-trip issue reports submitted by workers, reviewed by owners and admins</p>
    </td>
  </tr>
</table>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     BusPulse LK Platform                    │
├──────────────────────────┬──────────────────────────────────┤
│     📱 Mobile App        │         🖥️ Backend API           │
│   (React Native / Expo)  │      (ASP.NET Core 8.0)          │
│                          │                                   │
│  ┌──────────────────┐    │   ┌──────────────────────────┐   │
│  │  Passenger View  │◄───┼──►│  REST Controllers         │   │
│  │  Worker View     │    │   │  JWT Authentication       │   │
│  │  Owner View      │    │   │  Role-Based Authorization │   │
│  │  Admin View      │    │   └──────────────────────────┘   │
│  └──────────────────┘    │                │                  │
│           │              │   ┌──────────────────────────┐   │
│  ┌────────▼───────┐      │   │  SignalR Hub (BusHub)     │   │
│  │  SignalR Client│◄─────┼──►│  Real-Time Broadcasting   │   │
│  │  (@microsoft/  │      │   │  GPS · Status · Announce  │   │
│  │  signalr)      │      │   └──────────────────────────┘   │
│  └────────────────┘      │                │                  │
│                          │   ┌──────────────────────────┐   │
│  ┌──────────────────┐    │   │  PostgreSQL Database      │   │
│  │  OpenStreetMap   │    │   │  (via Entity Framework)   │   │
│  │  (WebView +      │    │   └──────────────────────────┘   │
│  │  Leaflet.js)     │    │                                   │
│  └──────────────────┘    │                                   │
└──────────────────────────┴───────────────────────────────────┘
```

---

## 🎨 Design System

BusPulse LK uses a consistent dark-mode-first design language across all dashboards:

| Token | Value | Usage |
|-------|-------|-------|
| 🟠 **Primary / Accent** | `#FF6200` | CTA buttons, active icons, highlights |
| ⚫ **Background** | `#000000` | App & screen backgrounds |
| 🔲 **Surface** | `#111111` | Cards, bottom tabs, panels |
| 🔳 **Border** | `#222222` | Card borders, dividers |
| ⬜ **Text Primary** | `#FFFFFF` | Headings, primary labels |
| 🔘 **Text Secondary** | `#AAAAAA` | Subtitles, inactive labels |
| 🔷 **Info / Tint** | `#0a7ea4` | Links, info indicators |
| 🟢 **Success** | `#2E7D32` | Active status badges |
| 🔵 **Android Adaptive BG** | `#E6F4FE` | Launcher icon background |
| ⬛ **Splash Screen** | `#0f0f1a` | Launch screen background |

---

## 📱 User Roles

BusPulse LK supports four distinct user roles, each with a dedicated dashboard:

### 🧑‍💼 Admin
- Manage towns, routes, and bus approvals
- Review route requests submitted by owners
- Monitor all users and system-wide data
- Access ratings and issue reports platform-wide

### 🚌 Bus Owner
- Register and manage a fleet of buses
- Assign drivers and workers to buses
- Request new routes from the admin
- Broadcast announcements to passengers
- View real-time ratings and issue reports

### 👷 Worker (Driver / Conductor)
- Start, manage, and end trips
- Broadcast live GPS location to passengers
- Submit issue reports during trips
- Update bus status in real time

### 🧍 Passenger
- Search for buses and routes by town
- Track live bus location on an interactive map
- Register as a regular passenger on preferred routes
- Rate buses and receive push notifications
- Save favorite routes

---

## 🛠️ Tech Stack

### 📱 Frontend (Mobile)

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Native** | 0.81.5 | Core mobile framework |
| **Expo** | ~54.0.25 | Development platform & build tooling |
| **Expo Router** | ~6.0.15 | File-based navigation |
| **TypeScript** | ~5.9.2 | Type safety |
| **@microsoft/signalr** | ^10.0.0 | Real-time WebSocket client |
| **expo-location** | ^55.1.10 | GPS location tracking |
| **expo-notifications** | ~0.32.17 | Push notifications |
| **expo-task-manager** | ~14.0.9 | Background tasks |
| **react-native-webview** | ^13.16.1 | Leaflet.js map rendering |
| **react-native-reanimated** | ~4.1.1 | Smooth animations |
| **@react-native-async-storage** | 2.2.0 | Persistent session storage |

### 🖥️ Backend (API)

| Technology | Version | Purpose |
|------------|---------|---------|
| **ASP.NET Core** | .NET 8.0 | REST API framework |
| **SignalR** | Built-in | Real-time WebSocket hub |
| **Entity Framework Core** | 8.0.4 | ORM & database migrations |
| **PostgreSQL** | — | Primary relational database |
| **Npgsql** | 8.0.4 | PostgreSQL EF provider |
| **JWT Bearer Auth** | 8.0.10 | Stateless authentication |
| **Swagger / OpenAPI** | 6.6.2 | API documentation |

---

## 🚀 Getting Started

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8)
- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL](https://www.postgresql.org/)
- [Expo CLI](https://docs.expo.dev/more/expo-cli/) (`npm install -g expo`)
- [EAS CLI](https://docs.expo.dev/build/setup/) (`npm install -g eas-cli`) *(for device builds)*

---

### 🖥️ Backend Setup

```bash
# 1. Navigate to the backend folder
cd backend/BusPulseLK

# 2. Configure your connection string in appsettings.json
#    Update the "DefaultConnection" with your PostgreSQL credentials

# 3. Apply database migrations
dotnet ef database update

# 4. Run the API server
dotnet run
```

> The API will be available at `http://localhost:5000` (or `https://localhost:5001`).  
> Swagger UI: `http://localhost:5000/swagger`

---

### 📱 Frontend Setup

```bash
# 1. Navigate to the frontend folder
cd frontend/BusPulseLK

# 2. Install dependencies
npm install

# 3. Start the Expo development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

> **Tip:** For real-device GPS tracking, use an [EAS Development Build](https://docs.expo.dev/develop/development-builds/introduction/) instead of Expo Go.

```bash
# Build a development APK for Android
eas build --profile development --platform android
```

---

## 🔌 API Overview

| Module | Endpoints | Description |
|--------|-----------|-------------|
| **Auth / Users** | `POST /api/user/register` · `POST /api/user/login` | Registration, login, JWT issuance |
| **Buses** | `GET/POST /api/buses` · `PATCH /api/buses/{id}/approve` | Fleet CRUD, admin approval |
| **Routes** | `GET/POST /api/routes` · `GET /api/routes/{id}/stops` | Route definitions with stops |
| **Trips** | `POST /api/trips/start` · `POST /api/trips/{id}/end` | Trip lifecycle management |
| **Timetables** | `GET/POST /api/timetables` | Route schedules and station times |
| **Announcements** | `POST /api/announcements` | Bus owner broadcasts |
| **Ratings** | `GET/POST /api/ratings` | Passenger bus ratings |
| **Issue Reports** | `GET/POST /api/issuereports` | In-trip issue submissions |
| **Favorites** | `GET/POST /api/favorites` | Passenger saved routes |
| **Regular Passengers** | `POST /api/regularpassengers/request` | Boarding request system |
| **Route Requests** | `POST /api/routerequests` | Owner route proposals to admin |
| **Search** | `GET /api/search?from=&to=` | Town-to-town bus search |
| **Towns** | `GET/POST /api/towns` | Admin-managed town list |

---

## 📡 Real-Time Communication

BusPulse LK uses **ASP.NET Core SignalR** for all real-time functionality via the `/hubs/bus` endpoint.

### Hub Methods (Client → Server)

| Method | Parameters | Description |
|--------|-----------|-------------|
| `JoinBusGroup` | `busId` | Passenger subscribes to a bus stream |
| `LeaveBusGroup` | `busId` | Passenger unsubscribes |
| `SendLocation` | `busId, lat, lng` | Worker broadcasts GPS position |
| `UpdateBusStatus` | `busId, status` | Worker updates trip status |
| `SendAnnouncement` | `busId, message` | Owner sends broadcast message |

### Hub Events (Server → Client)

| Event | Payload | Description |
|-------|---------|-------------|
| `ReceiveLocation` | `{ busId, lat, lng, timestamp }` | Live GPS update |
| `ReceiveBusStatus` | `busId, status` | Status change notification |
| `ReceiveAnnouncement` | `{ busId, message, timestamp }` | Broadcast announcement |

---

## 🗺️ Live Tracking

Live tracking uses **OpenStreetMap** tiles rendered through a **WebView + Leaflet.js** setup — completely free with no API keys required.

- **Worker side:** `expo-location` streams GPS coordinates at high accuracy via `watchPositionAsync`, which are then pushed to SignalR
- **Passenger side:** Receives coordinates via the `ReceiveLocation` SignalR event and updates a Leaflet map marker in real time
- **Background tracking:** Powered by `expo-task-manager` for continuous updates even when the app is minimized

---

## 🔐 Authentication

BusPulse LK uses **JWT Bearer Tokens** for stateless, role-based authentication.

```
┌─────────────┐    POST /api/user/login     ┌───────────────┐
│   Mobile    │ ──────────────────────────► │   API Server  │
│    App      │ ◄────────────────────────── │               │
│             │     { token: "eyJ..." }      │  Signs JWT    │
│  Stores in  │                             │  with Role    │
│ AsyncStorage│                             │  Claim        │
└─────────────┘                             └───────────────┘

Roles: Admin · BusOwner · Worker · Passenger
```

All protected endpoints require the `Authorization: Bearer <token>` header. Role-based guards are enforced at the controller level using `[Authorize(Roles = "...")]`.

---

## 📂 Project Structure

```
BusPulseLK/
├── 📁 backend/
│   └── BusPulseLK/
│       ├── Controllers/        # REST API controllers (13 modules)
│       ├── Models/             # EF Core entity models & DTOs
│       ├── Hubs/               # SignalR BusHub
│       ├── Data/               # AppDbContext & migrations
│       └── Program.cs          # App bootstrap & DI configuration
│
└── 📁 frontend/
    └── BusPulseLK/
        ├── app/
        │   ├── (auth)/         # Login & registration screens
        │   ├── admin/          # Admin dashboard & management
        │   ├── owner/          # Bus owner dashboard & tools
        │   ├── worker/         # Worker trip management
        │   └── passenger/      # Passenger tracking & search
        ├── components/         # Shared UI components
        ├── constants/          # Theme colors & fonts
        ├── context/            # AuthContext (JWT session)
        ├── services/           # API service layer
        └── hooks/              # Custom React hooks
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

---

<div align="center">

<br/>

**Built with ❤️ for Sri Lanka's commuters**

<img src="https://img.shields.io/badge/Made%20in-Sri%20Lanka%20🇱🇰-FF6200?style=flat-square&labelColor=111111" />
&nbsp;
<img src="https://img.shields.io/badge/Powered%20by-.NET%208%20%2B%20Expo-0a7ea4?style=flat-square&labelColor=111111" />

<br/><br/>

*© 2026 BusPulse LK · [oshanafernando](https://github.com/oshanafernando)*

</div>
