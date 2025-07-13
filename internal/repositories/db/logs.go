package db

import (
	"database/sql"
	"fmt"
	"link-guardian/internal/models"
	"strings"
	"time"
)

// InsertAccessLog inserts a new access log entry into the database
func InsertAccessLogToDB(linkID int, ipAddress, userAgent, referer, country, city, deviceType, browser, os string, accessedAt time.Time) error {
	query := `INSERT INTO access_logs 
		(link_id, ip_address, user_agent, referer, country, city, device_type, browser, os, accessed_at) 
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`

	_, err := db.Exec(query, linkID, ipAddress, userAgent, referer, country, city, deviceType, browser, os, accessedAt)
	if err != nil {
		return fmt.Errorf("failed to log access: %w", err)
	}

	return nil
}

// ParseUserAgent extracts device, browser and OS information from user agent string
func ParseUserAgent(userAgent string) (deviceType, browser, os string) {
	userAgent = strings.ToLower(userAgent)

	// Determine device type
	if strings.Contains(userAgent, "mobile") || strings.Contains(userAgent, "android") || strings.Contains(userAgent, "iphone") {
		deviceType = "mobile"
	} else if strings.Contains(userAgent, "tablet") || strings.Contains(userAgent, "ipad") {
		deviceType = "tablet"
	} else {
		deviceType = "desktop"
	}

	// Determine browser
	if strings.Contains(userAgent, "firefox") {
		browser = "Firefox"
	} else if strings.Contains(userAgent, "chrome") && !strings.Contains(userAgent, "edg") {
		browser = "Chrome"
	} else if strings.Contains(userAgent, "safari") && !strings.Contains(userAgent, "chrome") {
		browser = "Safari"
	} else if strings.Contains(userAgent, "edg") {
		browser = "Edge"
	} else if strings.Contains(userAgent, "opera") {
		browser = "Opera"
	} else {
		browser = "Other"
	}

	// Determine OS
	if strings.Contains(userAgent, "windows") {
		os = "Windows"
	} else if strings.Contains(userAgent, "mac os") {
		os = "macOS"
	} else if strings.Contains(userAgent, "linux") {
		os = "Linux"
	} else if strings.Contains(userAgent, "android") {
		os = "Android"
	} else if strings.Contains(userAgent, "iphone") || strings.Contains(userAgent, "ipad") {
		os = "iOS"
	} else {
		os = "Other"
	}

	return
}

// LogAccessWithDetails records a new access log entry with additional details
func LogAccessWithDetails(linkID int64, ipAddress, userAgent, referer string) error {
	// Parse user agent for additional details
	deviceType, browser, os := ParseUserAgent(userAgent)

	// Full query with all fields
	query := `INSERT INTO access_logs 
		(link_id, ip_address, user_agent, referer, device_type, browser, os) 
		VALUES ($1, $2, $3, $4, $5, $6, $7)`

	// Execute the query
	_, err := db.Exec(query, linkID, ipAddress, userAgent, referer, deviceType, browser, os)
	if err != nil {
		return fmt.Errorf("failed to log access with details: %w", err)
	}

	return nil
}

// GetAccessLogs fetches access logs, optionally filtered by linkID and limited
func GetAccessLogs(linkID string, limit int) ([]models.AccessLog, error) {
	var rows *sql.Rows
	var err error
	if linkID != "" {
		rows, err = db.Query(`SELECT id, link_id, accessed_at, ip_address, user_agent FROM access_logs WHERE link_id = $1 ORDER BY accessed_at DESC LIMIT $2`, linkID, limit)
	} else {
		rows, err = db.Query(`SELECT id, link_id, accessed_at, ip_address, user_agent FROM access_logs ORDER BY accessed_at DESC LIMIT $1`, limit)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var logs []models.AccessLog
	for rows.Next() {
		var log models.AccessLog
		if err := rows.Scan(&log.ID, &log.LinkID, &log.AccessedAt, &log.IPAddress, &log.UserAgent); err != nil {
			return nil, err
		}
		logs = append(logs, log)
	}
	return logs, nil
}

// GetAccessLogsByUser fetches access logs for a specific user by userID or username
// Returns logs for all links owned by the specified user
func GetAccessLogsByUser(userIdentifier interface{}, limit int) ([]models.AccessLog, error) {
	var query string
	var args []interface{}

	switch v := userIdentifier.(type) {
	case int, int64:
		// If user ID is provided
		query = `
			SELECT al.id, al.link_id, al.accessed_at, al.ip_address, al.user_agent
			FROM access_logs al
			JOIN links l ON al.link_id = l.id
			WHERE l.user_id = $1
			ORDER BY al.accessed_at DESC
			LIMIT $2
		`
		args = []interface{}{v, limit}
	case string:
		// If username is provided
		query = `
			SELECT al.id, al.link_id, al.accessed_at, al.ip_address, al.user_agent
			FROM access_logs al
			JOIN links l ON al.link_id = l.id
			JOIN users u ON l.user_id = u.id
			WHERE u.username = $1
			ORDER BY al.accessed_at DESC
			LIMIT $2
		`
		args = []interface{}{v, limit}
	default:
		return nil, fmt.Errorf("invalid user identifier type: must be int/int64 for user ID or string for username")
	}

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user access logs: %w", err)
	}
	defer rows.Close()

	var logs []models.AccessLog
	for rows.Next() {
		var log models.AccessLog
		if err := rows.Scan(&log.ID, &log.LinkID, &log.AccessedAt, &log.IPAddress, &log.UserAgent); err != nil {
			return nil, fmt.Errorf("failed to scan access log row: %w", err)
		}
		logs = append(logs, log)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating access log rows: %w", err)
	}

	return logs, nil
}
