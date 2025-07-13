package cleanup

import (
	"database/sql"
	"fmt"
	"log"
	"time"
)

type ExpiredLinkCleanupService struct {
	db            *sql.DB
	interval      time.Duration
	stopChan      chan struct{}
	isRunning     bool
	cleanupBefore time.Time
}

func NewExpiredLinkCleanupService(db *sql.DB, interval time.Duration) *ExpiredLinkCleanupService {
	return &ExpiredLinkCleanupService{
		db:        db,
		interval:  interval,
		stopChan:  make(chan struct{}),
		isRunning: false,
	}
}

func (s *ExpiredLinkCleanupService) Start() {
	if s.isRunning {
		return
	}

	s.isRunning = true
	go s.runCleanupLoop()
	log.Println("Expired link cleanup service started")
}

func (s *ExpiredLinkCleanupService) Stop() {
	if !s.isRunning {
		return
	}

	s.stopChan <- struct{}{}
	s.isRunning = false
	log.Println("Expired link cleanup service stopped")
}

func (s *ExpiredLinkCleanupService) runCleanupLoop() {
	ticker := time.NewTicker(s.interval)
	defer ticker.Stop()

	s.cleanupExpiredLinks()

	for {
		select {
		case <-ticker.C:
			s.cleanupExpiredLinks()
		case <-s.stopChan:
			return
		}
	}
}

func (s *ExpiredLinkCleanupService) cleanupExpiredLinks() {
	log.Println("Running expired link cleanup...")

	now := time.Now()

	tx, err := s.db.Begin()
	if err != nil {
		log.Printf("Error starting transaction for link cleanup: %v\n", err)
		return
	}

	timeExpiryQuery := `
		UPDATE links 
		SET deleted_at = $1 
		WHERE 
			(expires_at IS NOT NULL AND expires_at < $2) AND 
			deleted_at IS NULL
	`
	timeResult, err := tx.Exec(timeExpiryQuery, now, now)
	if err != nil {
		tx.Rollback()
		log.Printf("Error cleaning up time-expired links: %v\n", err)
		return
	}

	timeRowsAffected, _ := timeResult.RowsAffected()

	clickExpiryQuery := `
		UPDATE links 
		SET deleted_at = $1 
		WHERE 
			(click_limit IS NOT NULL AND click_count >= click_limit) AND 
			deleted_at IS NULL
	`
	clickResult, err := tx.Exec(clickExpiryQuery, now)
	if err != nil {
		tx.Rollback()
		log.Printf("Error cleaning up click-limited links: %v\n", err)
		return
	}

	clickRowsAffected, _ := clickResult.RowsAffected()

	if err := tx.Commit(); err != nil {
		log.Printf("Error committing link cleanup transaction: %v\n", err)
		return
	}

	log.Printf("Cleanup complete: %d time-expired links and %d click-limited links marked as deleted\n",
		timeRowsAffected, clickRowsAffected)
}

func (s *ExpiredLinkCleanupService) GetExpiredLinkCount() (int, error) {
	var count int
	now := time.Now()

	query := `
		SELECT COUNT(*) FROM links 
		WHERE 
			((expires_at IS NOT NULL AND expires_at < $1) OR 
			(click_limit IS NOT NULL AND click_count >= click_limit)) AND 
			deleted_at IS NULL
	`

	err := s.db.QueryRow(query, now).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("error counting expired links: %w", err)
	}

	return count, nil
}
