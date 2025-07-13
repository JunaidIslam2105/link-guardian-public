package links

import (
	"link-guardian/internal/models"
	"link-guardian/internal/repositories/db"
	"net/http"

	"github.com/gin-gonic/gin"
)

func ListLinksHandler(c *gin.Context) {
	// Get the user ID from JWT context
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in token"})
		return
	}

	// Convert the user ID to int
	userID := int(userIDInterface.(float64))
	links, err := db.GetAllLinks(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch links"})
		return
	}

	if len(links) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"message": "No links found",
			"links":   []interface{}{},
		})
		return
	}

	// Convert links to response format with proper null handling
	var linkResponses []models.LinkResponse
	for _, link := range links {
		linkResponses = append(linkResponses, link.ToResponse())
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Links retrieved successfully",
		"links":   linkResponses,
		"count":   len(linkResponses),
	})
}
