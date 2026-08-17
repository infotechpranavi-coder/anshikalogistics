# Anshika Logistics — Trip & Diesel Expense Management

Enterprise SaaS for managing fleet trips, fuel, expenses, and invoices — replacing spreadsheet workflows with live calculations and instant invoice previews.

## Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** + shadcn/ui
- **Prisma** + MongoDB
- **NextAuth / Auth.js** (credentials + RBAC)
- **React Hook Form** + Zod
- **TanStack Table** + React Query
- **Recharts**, React PDF, Cloudinary, date-fns

## Getting Started

### 1. Install

```bash
npm install
```

### 2. Environment

Copy `.env.example` to `.env` and set:

```env
DATABASE_URL="mongodb://localhost:27017/fleetfuel?replicaSet=rs0"
AUTH_SECRET="your-secret"
AUTH_URL="http://localhost:3000"
```

MongoDB must support transactions (replica set). For local MongoDB:

```bash
mongod --replSet rs0
# then in mongosh: rs.initiate()
```

### 3. Database

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

Demo login: `admin@fleetfuel.com` / `password123`

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```
app/                 # Routes (auth + dashboard)
actions/             # Server Actions (CRUD + reports)
features/            # Feature UI (trips, vehicles, …)
components/          # Shared UI + layout
repositories/        # Prisma data access helpers
schemas/             # Zod validation
utils/calculations   # Distance, fuel, expense math
lib/                 # Auth, prisma, audit, export, QR
services/            # Cloudinary uploads
```

## Core UX — Trip Entry

`/trips/new` is a split-screen workspace:

- **Left:** trip / fuel / expense / payment form
- **Right:** live invoice preview (updates on every keystroke)

Auto-calculations (see `utils/calculations.ts`):

| Field | Formula |
|-------|---------|
| Distance | Unloading KM − Loading KM |
| Fuel Required | Distance ÷ Mileage |
| Fuel Cost | Fuel Required × Diesel Rate |
| Expense Total | Sum of expense lines |
| Grand Total | Fuel Cost + Expense Total |
| Pending | Grand Total − Paid |

## Roles

| Role | Access |
|------|--------|
| ADMIN | Full access |
| MANAGER | Operations + reports |
| OPERATOR | Trips, invoices, expenses |
| DRIVER | Own trips / expenses |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run db:push` | Push Prisma schema to MongoDB |
| `npm run db:seed` | Seed demo data |

## Modules

Dashboard · Trips · Vehicles · Drivers · Invoices · Expenses · Reports · Settings · Users · Notifications · Profile
