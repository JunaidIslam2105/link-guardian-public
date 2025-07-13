package main

import (
	"context"
	"database/sql"
	"fmt"
	"io/ioutil"
	"link-guardian/internal/config"
	"link-guardian/internal/handlers/auth"
	"link-guardian/internal/handlers/links"
	"link-guardian/internal/handlers/logs"
	"link-guardian/internal/handlers/middleware"
	dbRepo "link-guardian/internal/repositories/db"
	authService "link-guardian/internal/services/auth"
	"log"
	"os"
	"path/filepath"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
)

var db *sql.DB

func main() {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Set Gin mode from configuration
	gin.SetMode(cfg.Server.GinMode)

	// Initialize database
	if err := initDatabase(cfg); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Initialize Redis
	redisClient, err := initRedis(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize Redis: %v", err)
	}

	// Run migrations
	if err := runMigrations(cfg); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Setup router
	router := setupRouter(cfg, redisClient)

	// Start server
	log.Printf("🚀 Starting server on port %s", cfg.Server.Port)
	if err := router.Run(":" + cfg.Server.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func initDatabase(cfg *config.Config) error {
	var err error
	db, err = sql.Open("postgres", cfg.GetDatabaseDSN())
	if err != nil {
		return fmt.Errorf("error opening database connection: %v", err)
	}

	if err = db.Ping(); err != nil {
		return fmt.Errorf("error connecting to the database: %v", err)
	}

	fmt.Println("✅ Successfully connected to PostgreSQL")
	dbRepo.InitDB(db)
	return nil
}

func initRedis(cfg *config.Config) (*redis.Client, error) {
	var redisClient *redis.Client

	// Check if Redis URL is provided
	if redisURL := cfg.GetRedisURL(); redisURL != "" {
		// Use Redis URL
		opt, err := redis.ParseURL(redisURL)
		if err != nil {
			return nil, fmt.Errorf("error parsing Redis URL: %v", err)
		}
		redisClient = redis.NewClient(opt)
	} else {
		// Use individual components
		redisClient = redis.NewClient(&redis.Options{
			Addr:     cfg.GetRedisAddr(),
			Password: cfg.Redis.Password,
			DB:       cfg.Redis.DB,
		})
	}

	ctx := context.Background()
	if _, err := redisClient.Ping(ctx).Result(); err != nil {
		return nil, fmt.Errorf("error connecting to Redis: %v", err)
	}

	fmt.Println("✅ Successfully connected to Redis")
	return redisClient, nil
}

func setupRouter(cfg *config.Config, redisClient *redis.Client) *gin.Engine {
	router := gin.New()

	// Add default middleware manually
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// Create auth service with JWT secret from config
	authService := authService.NewAuthService(cfg.JWT.Secret)

	// Inject auth service into context for all routes
	router.Use(middleware.AuthServiceMiddleware(authService))

	// CORS configuration
	router.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORS.AllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		AllowCredentials: cfg.CORS.AllowCredentials,
	}))

	// Rate limiting middleware
	rateLimiter := middleware.RateLimiterMiddleWare(middleware.RateLimiterConfig{
		RedisClient: redisClient,
		Requests:    cfg.RateLimit.Requests,
		Window:      cfg.GetRateLimitWindow(),
	})

	// Security and rate limiting middleware
	router.Use(middleware.SecureHeader())
	router.Use(rateLimiter)

	// Public routes
	router.GET("/l/:slug", links.GetLinkHandler)
	router.GET("/logs/user", logs.ListAccessLogsByUserHandler)
	router.POST("/signup", auth.SignupHandler)
	router.POST("/login", auth.LoginHandler)

	// Protected routes
	protected := router.Group("")
	protected.Use(middleware.JWTAuthMiddleware())
	{
		protected.POST("/links", links.CreateLinkHandler)
		protected.GET("/links", links.ListLinksHandler)
		protected.DELETE("/links/:slug", links.DeleteLinkHandler)
	}

	return router
}

func runMigrations(cfg *config.Config) error {
	migrationDir := cfg.Migration.Path
	if !filepath.IsAbs(migrationDir) {
		// Convert relative path to absolute path based on current working directory
		cwd, err := os.Getwd()
		if err != nil {
			return fmt.Errorf("failed to get current working directory: %v", err)
		}
		migrationDir = filepath.Join(cwd, migrationDir)
	}

	log.Printf("🔍 Looking for migrations in: %s", migrationDir)

	// Read migration files from directory
	files, err := filepath.Glob(filepath.Join(migrationDir, "*.sql"))
	if err != nil {
		return fmt.Errorf("failed to find migration files: %v", err)
	}

	if len(files) == 0 {
		log.Printf("⚠️  No migration files found in %s", migrationDir)

		// Try alternative paths if not found
		altPaths := []string{
			"./scripts/migrations",
			"../../scripts/migrations",
			"../../../scripts/migrations",
		}

		for _, altPath := range altPaths {
			var altDir string
			if filepath.IsAbs(altPath) {
				altDir = altPath
			} else {
				cwd, _ := os.Getwd()
				altDir = filepath.Join(cwd, altPath)
			}

			altFiles, err := filepath.Glob(filepath.Join(altDir, "*.sql"))
			if err == nil && len(altFiles) > 0 {
				log.Printf("✅ Found migrations in alternative path: %s", altDir)
				files = altFiles
				migrationDir = altDir
				break
			}
		}

		if len(files) == 0 {
			log.Println("⚠️  No migration files found in any location")
			return nil
		}
	}

	for _, file := range files {
		content, err := ioutil.ReadFile(file)
		if err != nil {
			return fmt.Errorf("failed to read migration script %s: %v", file, err)
		}

		if _, err := db.Exec(string(content)); err != nil {
			return fmt.Errorf("failed to execute migration script %s: %v", file, err)
		}

		log.Printf("✅ Executed migration: %s", filepath.Base(file))
	}

	fmt.Println("✅ All migrations executed successfully")
	return nil
}
