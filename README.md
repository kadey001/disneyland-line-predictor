# Disneyland Line Predictor

A full-stack application for predicting and monitoring Disneyland wait times, featuring a Next.js frontend and Go microservice backend with a shared PostgreSQL database.

While existing theme park data sites are good at showing current wait times, they don't provide comprehensive trends and predictions. This webapp fills that gap by providing useful graphs for wait times and wait time trends, along with historical data analysis.

## Architecture

- **Frontend**: Next.js 15 with TypeScript, React 19, Tailwind CSS v4, and shadcn/ui components
- **Backend**: Two Go microservices for data collection and API serving
  - `live-data-collector-service`: Collects live wait time data from external APIs
  - `wait-times-api`: Serves wait time data via REST API
- **Database**: PostgreSQL database with Prisma ORM for schema management
- **Data Visualization**: Recharts for interactive charts and trend analysis
- **Deployment**: Docker Compose for development, Google Cloud Functions for production
- **Infrastructure**: Terraform for Google Cloud resource management

## Service Architecture

The backend consists of two specialized Go microservices:

### Live Data Collector Service (`go-services/live-data-collector-service/`)
- **Port**: 8081
- **Purpose**: Collects real-time wait time data from external APIs (queue-times.com)
- **Responsibilities**:
  - Scheduled data collection
  - Data validation and cleaning
  - Storage in PostgreSQL database

### Wait Times API Service (`go-services/wait-times-api/`)
- **Port**: 8080
- **Purpose**: Provides REST API for accessing wait time data
- **Responsibilities**:
  - Serving historical and current wait time data
  - Data aggregation and filtering
  - API authentication and rate limiting

## Quick Start

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- Go 1.21+ (for local Go development)
- PostgreSQL (or use the Docker setup)

### Option 1: Full Setup (Recommended)
```bash
# Clone the repository
git clone https://github.com/kadey001/disneyland-line-predictor.git
cd disneyland-line-predictor

# Install dependencies and start all services
npm run setup
```

This command will:
1. Install Node.js dependencies
2. Generate Prisma client
3. Start all Docker services (PostgreSQL database, Go services)
4. Run database migrations
5. Start the Next.js development server

### Option 2: Manual Setup
```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npm run prisma:generate

# 3. Start Docker services
npm run docker:up

# 4. Run database migrations
npm run prisma:migrate

# 5. Start development server
npm run dev
```

### Option 3: Go Services Only
If you only want to run the Go microservices (for testing or API development):

```bash
# Build and run Go services
cd go-services/wait-times-api
go run main.go

# In another terminal
cd go-services/live-data-collector-service
go run main.go
```

## Services

The application runs the following services:

| Service | Port | Description |
|---------|------|-------------|
| Next.js App | 3000 | Main web application with dashboard and analytics |
| Live Data Collector (Go) | 8081 | Microservice for collecting live wait time data |
| Wait Times API (Go) | 8080 | REST API for serving wait time data |
| PostgreSQL | 5432 | Database for historical wait time data |
| Prisma Studio | 5555 | Database administration UI (manual start) |

## Available Scripts

### Development
- `npm run dev` - Start Next.js development server with Turbopack
- `npm run build` - Build the Next.js application for production
- `npm run start` - Start the production Next.js server
- `npm run lint` - Run ESLint on the codebase

### Database Management
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database browser)
- `npm run prisma:db:push` - Push schema changes to database
- `npm run prisma:format` - Format Prisma schema file

### Docker Management
- `npm run docker:up` - Start all Docker services
- `npm run docker:down` - Stop all Docker services
- `npm run docker:build` - Rebuild Docker images
- `npm run docker:restart` - Restart all services
- `npm run docker:logs` - View logs from all services

### Setup
- `npm run setup` - Complete setup: install deps, generate client, start Docker, migrate DB

## API Endpoints

### Wait Times API (Port 8080)
- `GET /wait-times` - Retrieve current wait times and historical data for all important rides
- `GET /health` - Health check endpoint

### Live Data Collector (Port 8081)
- `POST /collect` - Trigger data collection from external APIs
- `GET /health` - Health check endpoint

### Next.js Application (Port 3000)
- `/` - Homepage with live wait times overview
- `/dashboard` - Interactive dashboard with analytics and trends
- `/wait-times` - Detailed wait times page with charts and predictions

## Environment Variables

Configuration is managed through environment variables. Create a `.env.local` file in the root directory:

```env
# Database Connection
DATABASE_URL="postgresql://postgres:password@localhost:5432/disneyland?sslmode=disable"

# For Go Service (if running separately)
GO_DATABASE_URL="postgresql://postgres:password@localhost:5432/disneyland?sslmode=disable"

# Next.js Configuration (if using authentication)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
```

For Docker development, the PostgreSQL service is automatically configured.

## Database Access

- **Prisma Studio UI**: http://localhost:5555 (run `npm run prisma:studio`)
  - Visual database browser designed specifically for Prisma
  - Browse, edit, and manage your database records
  - No login required - automatically connects to your database

- **Direct PostgreSQL Connection**:
  - Host: localhost
  - Port: 5432
  - Database: disneyland
  - Username: postgres
  - Password: password

## Database Schema

The application uses a PostgreSQL database with the following main tables:

### RideWaitTimeSnapshot
```sql
id           SERIAL PRIMARY KEY
ride_id      BIGINT
ride_name    VARCHAR NOT NULL
is_open      BOOLEAN NOT NULL
wait_time    BIGINT
snapshot_time TIMESTAMP NOT NULL
```

### RideDataHistory
```sql
id              BIGSERIAL PRIMARY KEY
external_id     VARCHAR NOT NULL
park_id         VARCHAR NOT NULL
entity_type     VARCHAR NOT NULL
name            VARCHAR NOT NULL
status          VARCHAR NOT NULL
last_updated    TIMESTAMP NOT NULL
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
standby_wait_time INTEGER
return_time_state VARCHAR
return_start    TIMESTAMP
return_end      TIMESTAMP
ride_id         VARCHAR NOT NULL
operating_hours JSON DEFAULT '[]'
forecast        JSON DEFAULT '[]'
```

## Important Rides Monitored

The system tracks wait times for these key Disneyland attractions:

- Space Mountain
- Big Thunder Mountain Railroad
- Tiana's Bayou Adventure
- Indiana Jones™ Adventure
- Jungle Cruise
- Mickey & Minnie's Runaway Railway
- Buzz Lightyear Astro Blasters
- Star Wars: Rise of the Resistance
- Millennium Falcon: Smugglers Run
- Pirates of the Caribbean
- Haunted Mansion

## Deployment

### Development
Run locally using Docker Compose for the full stack experience.

### Production
The Go microservices can be deployed to:
- **Google Cloud Functions** (recommended) - See `terraform/` directory for infrastructure
- **Google Cloud Run** - Cloud run service using Docker container
- **Docker containers** - Container-based deployment

The Next.js frontend can be deployed to:
- **Vercel** (recommended for Next.js)
- **Google Cloud Run**
- Any Node.js hosting platform

## Current Features
- **Real-time Wait Times**: Live data from queue-times.com API
- **Historical Data Storage**: Persistent wait time tracking with deduplication
- **Interactive Dashboard**: Visual charts and trend analysis
- **Ride Comparison**: Compare wait times across different attractions
- **Data Visualization**: Interactive charts using Recharts
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Microservice Architecture**: Separated data collection and API services for better scalability
- **Docker Support**: Complete containerized development environment

## Planned Features
- **Predictive Analytics**: Train ML models using historical data for wait time predictions
- **Optimal Visit Planning**: Suggest the best times to visit specific rides
- **Smart Recommendations**: AI-powered suggestions based on current conditions and user preferences  
- **Geolocation Integration**: Personalized recommendations based on your location in the park
- **Multi-Park Support**: Expand to Disney California Adventure and other theme parks
- **Mobile App**: Native mobile application for on-the-go planning
- **Real-time Notifications**: Push notifications for ride status changes
