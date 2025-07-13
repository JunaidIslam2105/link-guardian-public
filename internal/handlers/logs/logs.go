package logs

import (
	"encoding/json"
	"fmt"
	"link-guardian/internal/models"
	"link-guardian/internal/repositories/db"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// geoIPResult is the structure for ip-api.com response
type geoIPResult struct {
	Country string `json:"countryCode"`
	City    string `json:"city"`
}

// getGeoIPInfo fetches country and city from ip-api.com
func getGeoIPInfo(ip string) (country, city string) {
	url := fmt.Sprintf("http://ip-api.com/json/%s?fields=countryCode,city", ip)
	client := http.Client{Timeout: 2 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return "", ""
	}
	defer resp.Body.Close()
	var result geoIPResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", ""
	}
	return result.Country, result.City
}

// LogLinkAccess logs a link access event to the database
func LogLinkAccess(linkID int, ipAddress, userAgent, referer string, accessedAt time.Time) error {
	// Parse deviceType, browser, os from userAgent
	deviceType, browser, os := db.ParseUserAgent(userAgent)
	country, city := getGeoIPInfo(ipAddress)
	fmt.Println("Country:", country, "City:", city)
	return db.InsertAccessLogToDB(linkID, ipAddress, userAgent, referer, country, city, deviceType, browser, os, accessedAt)
}

// ListAccessLogsHandler returns access logs, optionally filtered by link_id and limited
func ListAccessLogsHandler(c *gin.Context) {
	linkID := c.Query("link_id")
	limitStr := c.Query("limit")
	limit := 50
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	logs, err := db.GetAccessLogs(linkID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch access logs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"logs": logs})
}

// ListAccessLogsByUserHandler returns access logs for a specific user
func ListAccessLogsByUserHandler(c *gin.Context) {
	userID := c.Query("user_id")
	username := c.Query("username")
	limitStr := c.Query("limit")
	limit := 50
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	var logs []models.AccessLog
	var err error

	// Check if we have a user identifier
	if userID != "" {
		// Convert user ID to int
		uid, err := strconv.Atoi(userID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID format"})
			return
		}
		logs, err = db.GetAccessLogsByUser(uid, limit)
	} else if username != "" {
		logs, err = db.GetAccessLogsByUser(username, limit)
	} else {
		// Fallback to regular access logs if no user identifier is provided
		linkID := c.Query("link_id")
		logs, err = db.GetAccessLogs(linkID, limit)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch access logs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"logs": logs})
}
