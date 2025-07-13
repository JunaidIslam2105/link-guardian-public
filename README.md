# Link Guardian

A production-ready URL shortening service with access analytics and security features.

## Features
- REST API with JWT authentication
- Redis-backed rate limiting with configurable thresholds
- Link expiration dates and click limits per shortened URL
- PostgreSQL data storage with soft deletion
- Detailed access logging including:
  - Geographic location tracking
  - Device type detection
  - Referrer URL tracking
  - Timestamped access records
- React frontend with TypeScript
- Dockerized deployment
- DB migrations

## API Endpoints

| Method | Path | Description | Authentication Required |
|--------|------|-------------|--------------------------|
| GET    | /l/:slug | Redirect to original URL | No |
| GET    | /logs/user | List access logs for authenticated user | Yes |
| POST   | /signup | Create new user account | No |
| POST   | /login | Authenticate user | No |
| POST   | /links | Create new shortened link | Yes |
| GET    | /links | List user's shortened links | Yes |
| DELETE | /links/:slug | Delete a shortened link | Yes |

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

## Contributing
Contributions are welcome! Please open an issue or submit a pull request.

## License
MIT License - See [LICENSE](LICENSE)