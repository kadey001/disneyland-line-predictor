# Disneyland Line Predictor

A full-stack application for predicting and monitoring Disneyland wait times, featuring a Next.js frontend and Go microservice backend with PostgreSQL database.

## Architecture

- **Frontend**: Next.js 15 with TypeScript, React 19, Tailwind CSS, and shadcn/ui
- **Backend**: Two Go microservices (live-data-collector-service, wait-times-api)
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Docker Compose for development, Google Cloud for production

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Go 1.21+ (optional, for local development)

### Setup
```bash
# Clone and setup
git clone https://github.com/kadey001/disneyland-line-predictor.git
cd disneyland-line-predictor

# Install dependencies and start all services
npm run setup
```

This starts the Next.js app (port 3000), Go services (ports 8080/8081), and PostgreSQL database.

## Available Scripts

### Development
- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run start` - Start production server

### Database
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open database browser (port 5555)
- `npm run prisma:generate` - Generate Prisma client

### Docker
- `npm run docker:up` - Start all services
- `npm run docker:down` - Stop all services
- `npm run docker:logs` - View service logs

### Setup
- `npm run setup` - Complete setup (deps, client, Docker, migrations)

## API Endpoints

### Wait Times API (Port 8080)
- `GET /wait-times` - Current and historical wait time data
- `GET /health` - Health check

### Live Data Collector (Port 8081)
- `POST /collect` - Trigger data collection
- `GET /health` - Health check

## Environment Variables

Create `.env.local`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/disneyland?sslmode=disable"

# Supabase Configuration (for real-time updates)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
```

### Supabase Setup for Real-time Updates

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from the project settings
3. Enable real-time for the `ride_data_history` table in your Supabase dashboard
4. Add the environment variables above to your `.env.local` file

The app will automatically use real-time subscriptions when Supabase is configured, falling back to polling if not available.

## Database Schema

### Key Tables
- **RideWaitTimeSnapshot**: Live wait time snapshots
- **RideDataHistory**: Historical ride data with forecasts

## Deployment

- **Development**: Docker Compose
- **Production**: Google Cloud Functions (Go services), Vercel (Next.js frontend)

## Features

- Real-time wait time monitoring
- Interactive charts and trend analysis
- Historical data storage
- Responsive dashboard
- Microservice architecture
