package auth

import (
	"link-guardian/internal/models"
	dbRepo "link-guardian/internal/repositories/db"
	authService "link-guardian/internal/services/auth"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

// SignupHandler handles user registration with proper security measures
func SignupHandler(c *gin.Context) {
	var req models.SignupRequest

	// Parse and validate request
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Invalid signup request from IP %s: %v", c.ClientIP(), err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"message": "Please check your input and try again",
		})
		return
	}

	// Validate struct fields
	if err := validate.Struct(req); err != nil {
		log.Printf("Signup validation failed from IP %s: %v", c.ClientIP(), err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Validation failed",
			"message": "Please ensure all fields are properly filled",
		})
		return
	}

	// Get auth service from context (will be injected by middleware)
	authSvc, exists := c.Get("authService")
	if !exists {
		log.Printf("Auth service not found in context for signup from IP %s", c.ClientIP())
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Service unavailable",
			"message": "Please try again later",
		})
		return
	}

	authService := authSvc.(*authService.AuthService)

	// Sanitize inputs
	req.Username = strings.TrimSpace(req.Username)
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	// Validate username and password
	if err := authService.ValidateUsername(req.Username); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid username",
			"message": err.Error(),
		})
		return
	}

	if err := authService.ValidatePassword(req.Password); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid password",
			"message": err.Error(),
		})
		return
	}

	// Check if email and username are unique
	if err := dbRepo.IsEmailUnique(req.Email); err != nil {
		log.Printf("Email uniqueness check failed for %s from IP %s", req.Email, c.ClientIP())
		c.JSON(http.StatusConflict, gin.H{
			"error":   "Registration failed",
			"message": "An account with this email already exists",
		})
		return
	}

	if err := dbRepo.IsUsernameUnique(req.Username); err != nil {
		log.Printf("Username uniqueness check failed for %s from IP %s", req.Username, c.ClientIP())
		c.JSON(http.StatusConflict, gin.H{
			"error":   "Registration failed",
			"message": "This username is already taken",
		})
		return
	}

	// Hash the password
	hashedPassword, err := authService.HashPassword(req.Password)
	if err != nil {
		log.Printf("Password hashing failed for user %s from IP %s: %v", req.Username, c.ClientIP(), err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Registration failed",
			"message": "Please try again later",
		})
		return
	}

	// Create user with hashed password
	userID, err := dbRepo.InsertUserToDB(req.Username, req.Email, hashedPassword)
	if err != nil {
		log.Printf("User creation failed for %s from IP %s: %v", req.Username, c.ClientIP(), err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Registration failed",
			"message": "Please try again later",
		})
		return
	}

	// Generate JWT token
	tokenString, err := authService.GenerateJWTToken(userID, req.Username)
	if err != nil {
		log.Printf("Token generation failed for user %s (ID: %d) from IP %s: %v", req.Username, userID, c.ClientIP(), err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Registration completed but login failed",
			"message": "Please try logging in manually",
		})
		return
	}

	// Log successful registration
	log.Printf("User registered successfully: %s (ID: %d) from IP %s", req.Username, userID, c.ClientIP())

	// Return success response
	c.JSON(http.StatusCreated, gin.H{
		"message": "User created successfully",
		"user": gin.H{
			"id":       userID,
			"username": req.Username,
			"email":    req.Email,
		},
		"token": tokenString,
	})
}
