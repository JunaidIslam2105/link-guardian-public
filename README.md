# Link Guardian

A production-ready URL shortening service with access analytics and security features.

## Features
- REST API with JWT authentication
- Redis-backed rate limiting
- PostgreSQL data storage
- Access logging and analytics
- React frontend with TypeScript
- Dockerized deployment
- DB migrations

## Prerequisites
- Go 1.21+
- PostgreSQL 15+
- Redis 7+
- Docker 24+

## Installation
```bash
git clone https://github.com/JunaidIslam2105/link-guardian.git
cd link-guardian
```

## Configuration
Copy example environment file:
```bash
cp .env.example .env
```
Set values in `.env`:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` - PostgreSQL credentials
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Strong secret for auth tokens
- `CORS_ALLOWED_ORIGINS` - Frontend URLs for CORS

## Running the Application
### Backend
```bash
cd cmd/main
go run main.go
```

### Frontend
```bash
cd web
npm install
npm run dev
```

### Docker
```bash
docker-compose up -d
```

## API Documentation

Endpoints:
- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication
- `POST /links` - Create short URL
- `GET /links/{slug}` - Redirect to original URL
- `GET /logs/{slug}` - Get access analytics


## Contributing
Contributions are welcome! Please open an issue or submit a pull request.

## License
MIT License - See [LICENSE](LICENSE)