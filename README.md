# CRMpro - AI CSV Importer Dashboard

An enterprise-grade, high-performance CSV data importer powered by Node.js, Express, TypeScript, Next.js (App Router), and Tailwind CSS. The system parses large customer data exports streamingly in the browser and processes schema validation, deduplication checks, and AI-assisted CRM conversions batch-by-batch over Server-Sent Events (SSE).

## Core Architecture

```
                                +-------------------+
                                |   Next.js Client  |
                                +---------+---------+
                                          |
                                          | Uploads CSV & Opens SSE
                                          v
                                +---------+---------+
                                |  Express Backend  |
                                +---------+---------+
                                          |
        +-------------------+-------------+-------------+-------------------+
        |                   |                           |                   |
        v                   v                           v                   v
+-------+-------+   +-------+-------+           +-------+-------+   +-------+-------+
|  CSV Stream   |   |   Multer File |           | Winston JSON  |   |  AI Fallback  |
|  Parser       |   |   Validator   |           | Structured Log|   |  Heuristics   |
+---------------+   +---------------+           +---------------+   +---------------+
```

## Features

- **Intelligent Preprocessing**: Pre-calculates header similarity rates alongside sample values regex validation to infer target column types.
- **Adaptive Batch Sizing**: Profiles average row size to dynamically chunk records (15, 30, or 50 rows per batch) to avoid token context overflow.
- **Resilient AI Pipelines & Provider Fallbacks**: Swaps providers (e.g. Gemini to OpenAI) if the primary endpoint experiences timeout faults.
- **Auditing & Human Review Queues**: Flags fields with extraction confidence below 70%, allowing inline edits directly on the dashboard.
- **Deduplication Check**: Validates and highlights duplicate email/phone record rows.
- **On-The-Fly Manual Remapping**: Override mapped target columns in the dashboard UI and recalculate the values instantly on the client.
- **Structured Token Sizing & Cost Analysis**: Computes prompt/completion token usage and estimated usage costs.

---

## Tech Stack & Folder Structure

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Framer Motion, Lucide icons, Sonner toast notifications.
- **Backend**: Express 5, TypeScript, Winston Logger, Multer upload parser, Jest unit tests.
- **DevOps**: GitHub Actions CI/CD workflows, Multi-container Docker configuration.

```
CRMpro/
├── app/                     # Next.js Pages
├── components/              # Dashboard UI Components
├── backend/
│   ├── src/
│   │   ├── config/          # Startup Config Validators
│   │   ├── controllers/     # Express API Routing Handlers
│   │   ├── middleware/      # Rate limiters & Security checks
│   │   ├── routes/          # Endpoints Routing definitions
│   │   ├── services/        # Winston logs, CSV Stream & AI services
│   │   └── utils/           # Helper methods
│   ├── jest.config.js       # Jest testing specs
│   └── Dockerfile           # Backend container build scripts
├── Dockerfile               # Frontend container build scripts
└── docker-compose.yml       # Docker Compose multi-container setup
```

---

## Quickstart & Installation

### Running Locally

1. **Clone & Install workspace dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment parameters**:
   Create a `.env` file in the `backend/` directory:
   ```env
   PORT=5000
   MAX_FILE_SIZE=26214400
   MAX_BATCH_SIZE=25
   NODE_ENV=development
   # Optionals
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Start backend service**:
   ```bash
   cd backend
   npm run dev
   ```

4. **Start frontend dashboard**:
   ```bash
   # From root workspace
   npm run dev
   ```
   Open `http://localhost:3000` to access the application.

---

### Docker Container Usage

Build and run both the Next.js frontend and the Express backend using a single Docker Compose command:

```bash
docker-compose up --build
```
The client launches on `http://localhost:3000` and proxies queries directly to the backend container listening on `http://localhost:5000`.

---

### Running Jest Test Suites

Verify backend service logic and normalizations using Jest unit testing:

```bash
cd backend
npm test
```
Outputs validation coverage parameters for CSV chunking, email formatting, and phone normalizations.
