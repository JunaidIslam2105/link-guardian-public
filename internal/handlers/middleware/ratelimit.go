package middleware

import (
	"context"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"net/http"
	"time"
)

type RateLimiterConfig struct {
	RedisClient *redis.Client
	Requests    int
	Window      time.Duration
}

func RateLimiterMiddleWare(config RateLimiterConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		clientIP := c.ClientIP()
		windowKey := fmt.Sprintf("ratelimit:%s:%d", clientIP, time.Now().Unix()/int64(config.Window.Seconds()))
		fmt.Println(windowKey + " - RateLimiterMiddleware")

		ctx := context.Background()

		val, err := config.RedisClient.Incr(ctx, windowKey).Result()
		if err != nil {
			c.JSON(500, gin.H{"error": "Internal server error"})
			c.Abort()
			return
		}
		if val == 1 {
			config.RedisClient.Expire(ctx, windowKey, config.Window)
		}

		c.Header("X-RateLimit-Limit", fmt.Sprintf("%d", config.Requests))
		c.Header("X-RateLimit-Remaining", fmt.Sprintf("%d", max(0, config.Requests-int(val))))

		if val > int64(config.Requests) {
			c.Header("Retry-After", fmt.Sprintf("%d", int(config.Window.Seconds())))
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "Rate limit exceeded. Please try again later.",
			})
			return
		}
		c.Next()
	}
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
