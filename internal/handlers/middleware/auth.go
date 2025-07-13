package middleware

import (
	"link-guardian/internal/services/auth"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// JWTAuthMiddleware creates a JWT authentication middleware that uses the auth service
func JWTAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get auth service from context
		authSvc, exists := c.Get("authService")
		if !exists {
			log.Printf("Auth service not found in context for request from IP %s", c.ClientIP())
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Service unavailable",
				"message": "Authentication service not available",
			})
			c.Abort()
			return
		}

		authService := authSvc.(*auth.AuthService)

		// Extract Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Authorization required",
				"message": "Authorization header is missing",
			})
			c.Abort()
			return
		}

		// Parse Bearer token
		headerParts := strings.Split(authHeader, " ")
		if len(headerParts) != 2 || headerParts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Invalid authorization format",
				"message": "Expected 'Bearer <token>' format",
			})
			c.Abort()
			return
		}

		tokenString := headerParts[1]

		// Validate token using auth service
		claims, err := authService.ValidateJWTToken(tokenString)
		if err != nil {
			log.Printf("Token validation failed from IP %s: %v", c.ClientIP(), err)
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Invalid token",
				"message": "Please login again",
			})
			c.Abort()
			return
		}

		// Extract user information from claims
		userID, ok := claims["user_id"]
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Invalid token claims",
				"message": "Token is malformed",
			})
			c.Abort()
			return
		}

		username, ok := claims["username"]
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Invalid token claims",
				"message": "Token is malformed",
			})
			c.Abort()
			return
		}

		// Set user information in context for handlers to use
		c.Set("user_id", userID)
		c.Set("username", username)

		c.Next()
	}
}
