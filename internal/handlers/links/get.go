package links

import (
	"link-guardian/internal/repositories/db"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func GetLinkHandler(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Slug is required"})
		return
	}

	link, err := db.GetLinkBySlug(slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Link not found"})
		return
	}

	if link.ExpiresAt.Valid && link.ExpiresAt.Time.Before(time.Now()) {
		c.JSON(http.StatusGone, gin.H{"error": "Link has expired"})
		return
	}

	if link.ClickLimit.Valid && int(link.ClickLimit.Int32) <= link.ClickCount {
		c.JSON(http.StatusGone, gin.H{"error": "Link has reached its maximum number of clicks"})
		return
	}

	err = db.IncrementClickCount(slug)
	if err != nil {
		c.Error(err)
	}

	// Log the access for analytics
	ipAddress := c.ClientIP()
	userAgent := c.Request.UserAgent()
	referer := c.Request.Referer()

	// Log the access event to the database using the db package
	err = db.LogAccessWithDetails(int64(link.ID), ipAddress, userAgent, referer)
	if err != nil {
		// Optionally log this error, but do not block redirect
		c.Error(err)
	}

	// Perform the redirect
	c.Redirect(http.StatusFound, link.TargetURL)
}
