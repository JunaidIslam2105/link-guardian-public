package links

import (
	"link-guardian/internal/repositories/db"
	"net/http"

	"github.com/gin-gonic/gin"
)

func DeleteLinkHandler(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Slug is required"})
		return
	}

	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in token"})
		return
	}

	// Convert the user ID to int
	userID := int(userIDInterface.(float64))

	err := db.SoftDeleteLink(slug, userID)
	if err != nil {
		if err.Error() == "link not found or already deleted" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Link not found or already deleted"})
			return
		} else if err.Error() == "unauthorized: link belongs to a different user" {
			c.JSON(http.StatusForbidden, gin.H{"error": "You do not have permission to delete this link"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete link"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Link deleted successfully",
		"slug":    slug,
	})
}
