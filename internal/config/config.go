package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Database  DatabaseConfig
	Redis     RedisConfig
	Server    ServerConfig
	JWT       JWTConfig
	CORS      CORSConfig
	RateLimit RateLimitConfig
	Migration MigrationConfig
}

type DatabaseConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	Name     string
	SSLMode  string
}

type RedisConfig struct {
	URL      string // Redis connection URL
	Host     string
	Port     int
	Password string
	DB       int
}

type ServerConfig struct {
	Port    string
	GinMode string
}

type JWTConfig struct {
	Secret string
}

type CORSConfig struct {
	AllowedOrigins   []string
	AllowCredentials bool
}

type RateLimitConfig struct {
	Requests      int
	WindowMinutes int
}

type MigrationConfig struct {
	Path string
}

// LoadConfig loads configuration from environment variables
func LoadConfig() (*Config, error) {
	// Try to load .env file from project root
	envPaths := []string{
		".env",          // Current directory
		"../../.env",    // From cmd/main directory
		"../../../.env", // From deeper nested directories
	}

	envLoaded := false
	for _, path := range envPaths {
		if err := godotenv.Load(path); err == nil {
			fmt.Printf("✅ Loaded environment variables from %s\n", path)
			envLoaded = true
			break
		}
	}

	if !envLoaded {
		fmt.Println("No .env file found, using system environment variables")
	}

	config := &Config{}

	// Database configuration
	config.Database.Host = getEnv("DB_HOST", "localhost")
	config.Database.Port = getEnvAsInt("DB_PORT", 5432)
	config.Database.User = getEnv("DB_USER", "postgres")
	config.Database.Password = getEnv("DB_PASSWORD", "")
	config.Database.Name = getEnv("DB_NAME", "linkguardian")
	config.Database.SSLMode = getEnv("DB_SSLMODE", "disable")
	// Redis configuration
	config.Redis.URL = getEnv("REDIS_URL", "")
	// Fallback to individual components if URL is not provided
	if config.Redis.URL == "" {
		config.Redis.Host = getEnv("REDIS_HOST", "localhost")
		config.Redis.Port = getEnvAsInt("REDIS_PORT", 6379)
		config.Redis.Password = getEnv("REDIS_PASSWORD", "")
		config.Redis.DB = getEnvAsInt("REDIS_DB", 0)
	}
	// Server configuration
	// Railway provides PORT env var, fallback to SERVER_PORT, then default to 8081
	config.Server.Port = getEnv("PORT", getEnv("SERVER_PORT", "8081"))
	config.Server.GinMode = getEnv("GIN_MODE", "debug")

	// JWT configuration
	config.JWT.Secret = getEnv("JWT_SECRET", "")
	if config.JWT.Secret == "" {
		return nil, fmt.Errorf("JWT_SECRET environment variable is required")
	}

	// CORS configuration
	originsStr := getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000")
	config.CORS.AllowedOrigins = strings.Split(originsStr, ",")
	config.CORS.AllowCredentials = getEnvAsBool("CORS_ALLOW_CREDENTIALS", true)

	// Rate limiting configuration
	config.RateLimit.Requests = getEnvAsInt("RATE_LIMIT_REQUESTS", 500)
	config.RateLimit.WindowMinutes = getEnvAsInt("RATE_LIMIT_WINDOW_MINUTES", 1)

	// Migration configuration
	config.Migration.Path = getEnv("MIGRATION_PATH", "./scripts/migrations")

	return config, nil
}

// GetDatabaseDSN returns the database connection string
func (c *Config) GetDatabaseDSN() string {
	return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		c.Database.Host, c.Database.Port, c.Database.User,
		c.Database.Password, c.Database.Name, c.Database.SSLMode)
}

// GetRedisAddr returns the Redis address
func (c *Config) GetRedisAddr() string {
	return fmt.Sprintf("%s:%d", c.Redis.Host, c.Redis.Port)
}

// GetRedisURL returns the Redis URL if available, otherwise empty string
func (c *Config) GetRedisURL() string {
	return c.Redis.URL
}

// GetRateLimitWindow returns the rate limit window as time.Duration
func (c *Config) GetRateLimitWindow() time.Duration {
	return time.Duration(c.RateLimit.WindowMinutes) * time.Minute
}

// Helper functions
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}
