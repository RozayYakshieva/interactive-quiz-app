# Interactive Quiz App

A full-stack platform for creating and hosting real-time quizzes. Hosts can build quizzes, launch game sessions, and follow player progress live, while participants join with a session code and compete from their own devices.

This project was created as part of a summer practice program at SPbPU in collaboration with VK Education.

## Features

- User registration and JWT-based authentication
- Quiz creation and editing
- Single-choice and multiple-choice questions
- Drag-and-drop question reordering
- Configurable time limits for questions
- Live game sessions with unique join codes
- Anonymous participant access
- Real-time game updates over WebSockets
- Answer progress tracking and live leaderboards
- Host dashboard, session history, and profile settings
- Automatic database migrations with Flyway

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- Axios
- STOMP over WebSockets
- Tailwind CSS
- dnd-kit
- Lucide React

### Backend

- Java 21
- Spring Boot 3
- Spring Security
- Spring Data JPA
- Spring WebSocket
- JWT authentication
- PostgreSQL
- Flyway
- Gradle

## Project Structure

```text
interactive-quiz-app/
├── backend/                 # Spring Boot API and WebSocket server
│   ├── src/main/java/       # Application source code
│   ├── src/main/resources/  # Configuration and Flyway migrations
│   └── Dockerfile
├── frontend/                # React client
│   ├── public/
│   └── src/
├── .env.example             # Backend environment variable template
└── README.md
```

## Prerequisites

Install the following software before running the project locally:

- Java 21
- Node.js 20.19 or newer
- npm
- PostgreSQL

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd interactive-quiz-app
```

### 2. Create the PostgreSQL database

Create an empty database named `quiz_app`:

```sql
CREATE DATABASE quiz_app;
```

Flyway will create and update the required tables when the backend starts.

### 3. Configure the backend

Copy the example environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Update `.env` with your local database credentials and a secure JWT secret:

```dotenv
DB_URL=jdbc:postgresql://localhost:5432/quiz_app
DB_USERNAME=postgres
DB_PASSWORD=your-postgres-password
JWT_SECRET=replace-with-a-long-random-secret-at-least-32-characters
JWT_EXPIRATION=86400000
```

Do not commit the `.env` file. It is excluded from Git.

### 4. Run the backend

On macOS or Linux:

```bash
cd backend
./gradlew bootRun
```

On Windows:

```powershell
cd backend
.\gradlew.bat bootRun
```

The backend starts at `http://localhost:8080`.

### 5. Configure and run the frontend

Create `frontend/.env.local`:

```dotenv
VITE_API_URL=http://localhost:8080
```

Then install the dependencies and start the development server:

```bash
cd frontend
npm install
npm run dev
```

Open the URL shown by Vite, usually `http://localhost:5173`.

## Available Scripts

Run frontend commands from the `frontend` directory:

```bash
npm run dev       # Start the development server
npm run build     # Create a production build
npm run lint      # Run ESLint
npm run preview   # Preview the production build
```

Run backend commands from the `backend` directory:

```bash
./gradlew bootRun          # Start the backend
./gradlew test             # Run backend tests
./gradlew spotlessCheck    # Check Java formatting
./gradlew spotlessApply    # Apply Java formatting
./gradlew bootJar          # Build an executable JAR
```

Use `gradlew.bat` instead of `gradlew` on Windows.

## Environment Variables

| Variable | Description | Default |
| --- | --- | --- |
| `DB_URL` | PostgreSQL JDBC connection URL | `jdbc:postgresql://localhost:5432/quiz_app` |
| `DB_USERNAME` | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `local_dev_password` |
| `JWT_SECRET` | Secret used to sign JWT tokens | Required |
| `JWT_EXPIRATION` | Token lifetime in milliseconds | `86400000` |
| `PORT` | Backend server port | `8080` |
| `VITE_API_URL` | Backend URL used by the frontend | Same origin |

## Real-Time Communication

The application exposes a STOMP WebSocket endpoint at `/ws`. The backend publishes game events through `/topic` destinations and accepts application messages through the `/app` prefix.

## Production Build

Build the frontend:

```bash
cd frontend
npm install
npm run build
```

The generated files are placed in `frontend/dist`.

Build the backend:

```bash
cd backend
./gradlew bootJar
```

The executable JAR is placed in `backend/build/libs`.

The backend can also be built as a Docker image:

```bash
docker build -t interactive-quiz-backend ./backend
```

Pass the database and JWT environment variables when starting the container.

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make and test your changes.
4. Commit your changes with a clear message.
5. Open a pull request.
