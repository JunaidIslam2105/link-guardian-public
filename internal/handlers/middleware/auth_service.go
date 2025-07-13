package middleware

import (
	"link-guardian/internal/services/auth"

	"github.com/gin-gonic/gin"
)

// AuthServiceMiddleware injects the auth service into the Gin context
func AuthServiceMiddleware(authService *auth.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set("authService", authService)
		c.Next()
	}
}
