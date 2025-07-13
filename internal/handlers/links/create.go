package links

import (
	"crypto/rand"
	"database/sql"
	"fmt"
	"link-guardian/internal/models"
	"link-guardian/internal/repositories/db"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

var linkValidator = validator.New()

func CreateLinkHandler(c *gin.Context) {
	var req models.CreateLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request or payload"})
		return
	}

	if err := linkValidator.Struct(req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}

	// Get the user ID from JWT context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"error": "User ID not found in token"})
		return
	}

	slug, err := generateUniqueSlug(8)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to generate unique slug"})
		return
	}

	now := time.Now()
	link := models.Link{
		Slug:       slug,
		TargetURL:  req.TargetURL,
		CreatedAt:  now,
		ClickCount: 0,
		UserID: sql.NullInt32{
			Int32: int32(userID.(float64)), // Convert interface{} to int32
			Valid: true,
		},
	}

	if req.ExpiresAt != nil {
		link.ExpiresAt = sql.NullTime{
			Time:  *req.ExpiresAt,
			Valid: true,
		}
	}

	if req.ClickLimit != nil {
		link.ClickLimit = sql.NullInt32{
			Int32: int32(*req.ClickLimit),
			Valid: true,
		}
	}

	err = db.InsertLinktoDB(link.Slug, link.TargetURL, link.CreatedAt, link.ExpiresAt, link.ClickLimit, link.ClickCount, link.UserID)

	if err != nil {
		fmt.Println("Error inserting link into database:", err)
		c.JSON(500, gin.H{"error": "Failed to create link"})
		return
	}

	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	host := c.Request.Host
	shortURL := fmt.Sprintf("%s://%s/l/%s", scheme, host, slug)

	c.JSON(http.StatusCreated, gin.H{
		"message":   "Link generated successfully",
		"short_url": shortURL,
		"link":      link.ToResponse(),
	})
}

func generateUniqueSlug(length int) (string, error) {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_"
	const maxAttempts = 10
	for attempt := 0; attempt < maxAttempts; attempt++ {
		b := make([]byte, length)
		if _, err := rand.Read(b); err != nil {
			return "", err
		}
		for i := 0; i < length; i++ {
			b[i] = charset[int(b[i])%len(charset)]
		}
		slug := string(b)
		uniqueSlug, err := db.CheckIfSlugUnique(slug)
		if err == nil {
			return uniqueSlug, nil
		}
	}
	return "", fmt.Errorf("failed to generate unique slug after %d attempts", maxAttempts)
}
