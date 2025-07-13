package auth

import (
	"link-guardian/internal/models"
	dbRepo "link-guardian/internal/repositories/db"
	authService "link-guardian/internal/services/auth"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

var loginValidator = validator.New()

// LoginAttempt represents a login attempt for rate limiting
type LoginAttempt struct {
	IP        string
	Email     string
	Timestamp time.Time
	Success   bool
}

// LoginHandler handles user authentication with security measures
func LoginHandler(c *gin.Context) {
	var req models.LoginRequest

	// Parse and validate request
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Invalid login request from IP %s: %v", c.ClientIP(), err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"message": "Please check your input and try again",
		})
		return
	}

	if err := loginValidator.Struct(req); err != nil {
		log.Printf("Login validation failed from IP %s: %v", c.ClientIP(), err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Validation failed",
			"message": "Please ensure all fields are properly filled",
		})
		return
	}

	// Get auth service from context
	authSvc, exists := c.Get("authService")
	if !exists {
		log.Printf("Auth service not found in context for login from IP %s", c.ClientIP())
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Service unavailable",
			"message": "Please try again later",
		})
		return
	}

	authService := authSvc.(*authService.AuthService)

	// Sanitize inputs
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.Password = strings.TrimSpace(req.Password)

	// Get user by email
	user, err := dbRepo.GetUserByEmail(req.Email)
	if err != nil {
		log.Printf("Login attempt with non-existent email %s from IP %s", req.Email, c.ClientIP())
		// Generic error message to prevent user enumeration
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Authentication failed",
			"message": "Invalid email or password",
		})
		return
	}

	// Verify password
	if err := authService.VerifyPassword(req.Password, user.Password); err != nil {
		log.Printf("Failed login attempt for user %s from IP %s: invalid password", req.Email, c.ClientIP())
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Authentication failed",
			"message": "Invalid email or password",
		})
		return
	}

	// Generate JWT token
	tokenString, err := authService.GenerateJWTToken(user.ID, user.Username)
	if err != nil {
		log.Printf("Token generation failed for user %s (ID: %d) from IP %s: %v", user.Username, user.ID, c.ClientIP(), err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Authentication failed",
			"message": "Please try again later",
		})
		return
	}

	// Log successful login
	log.Printf("User logged in successfully: %s (ID: %d) from IP %s", user.Username, user.ID, c.ClientIP())

	// Return success response
	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
		},
		"token": tokenString,
	})
}
