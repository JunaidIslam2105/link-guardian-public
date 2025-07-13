package db

import (
	"database/sql"
	"fmt"
	"link-guardian/internal/models"
	"time"
)

var db *sql.DB

func InitDB(database *sql.DB) {
	db = database
}

func InsertLinktoDB(Slug string, TargetURL string, CreatedAt time.Time, ExpiresAt sql.NullTime, ClickLimit sql.NullInt32, ClickCount int, UserID sql.NullInt32) error {
	query := `INSERT INTO links (slug, target_url, created_at, expires_at, click_limit, click_count, user_id) 
			  VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := db.Exec(query, Slug, TargetURL, CreatedAt, ExpiresAt, ClickLimit, ClickCount, UserID)

	return err
}

func CheckIfSlugUnique(slug string) (string, error) {
	var exists bool
	query := "SELECT EXISTS(SELECT 1 FROM links WHERE slug = $1)"
	err := db.QueryRow(query, slug).Scan(&exists)

	if err != nil {
		return "", fmt.Errorf("Database check for slug uniqueness failed: %w", err)
	}

	if !exists {
		return slug, nil
	}
	return "", fmt.Errorf("Found slug already in database")
}

func GetLinkBySlug(slug string) (models.Link, error) {
	var link models.Link

	query := "SELECT id, slug, target_url, created_at, expires_at, click_limit, click_count, deleted_at, user_id FROM links WHERE slug = $1 AND deleted_at IS NULL"

	err := db.QueryRow(query, slug).Scan(&link.ID, &link.Slug, &link.TargetURL, &link.CreatedAt, &link.ExpiresAt, &link.ClickLimit, &link.ClickCount, &link.DeletedAt, &link.UserID)
	if err != nil {
		if err == sql.ErrNoRows {
			return models.Link{}, fmt.Errorf("link not found")
		}
		return models.Link{}, fmt.Errorf("failed to get link: %w", err)
	}
	return link, nil
}

func IncrementClickCount(slug string) error {
	query := "UPDATE links SET click_count = click_count + 1 WHERE slug = $1"
	result, err := db.Exec(query, slug)
	if err != nil {
		return fmt.Errorf("failed to increment click count: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error getting rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("link not found")
	}

	return nil
}

func GetAllLinks(userID int) ([]models.Link, error) {
	var links []models.Link

	query := "SELECT id, slug, target_url, created_at, expires_at, click_limit, click_count, deleted_at, user_id FROM links WHERE deleted_at IS NULL AND user_id = $1 ORDER BY created_at DESC"

	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get links: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var link models.Link
		if err := rows.Scan(&link.ID, &link.Slug, &link.TargetURL, &link.CreatedAt, &link.ExpiresAt, &link.ClickLimit, &link.ClickCount, &link.DeletedAt, &link.UserID); err != nil {
			return nil, fmt.Errorf("failed to scan link row: %w", err)
		}
		links = append(links, link)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating links rows: %w", err)
	}

	return links, nil
}

func SoftDeleteLink(slug string, userID int) error {
	// First check if link belongs to the user
	var linkUserID int
	checkQuery := "SELECT user_id FROM links WHERE slug = $1 AND deleted_at IS NULL"
	err := db.QueryRow(checkQuery, slug).Scan(&linkUserID)
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("link not found")
		}
		return fmt.Errorf("failed to check link ownership: %w", err)
	}

	// Verify ownership
	if linkUserID != userID {
		return fmt.Errorf("unauthorized: link belongs to a different user")
	}

	// Proceed with deletion
	query := "UPDATE links SET deleted_at = NOW() WHERE slug = $1 AND deleted_at IS NULL"
	result, err := db.Exec(query, slug)
	if err != nil {
		return fmt.Errorf("failed to delete link: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error getting rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("link not found or already deleted")
	}

	return nil
}
