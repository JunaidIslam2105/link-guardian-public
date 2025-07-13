package models

import (
	"database/sql"
	"time"
)

type Link struct {
	ID         int           `json:"id"`
	Slug       string        `json:"slug"`
	TargetURL  string        `json:"target_url"`
	CreatedAt  time.Time     `json:"created_at"`
	ExpiresAt  sql.NullTime  `json:"expires_at"`
	ClickLimit sql.NullInt32 `json:"click_limit"`
	ClickCount int           `json:"click_count"`
	DeletedAt  sql.NullTime  `json:"deleted_at,omitempty"`
	UserID     sql.NullInt32 `json:"user_id,omitempty"`
}

// LinkResponse is used for JSON serialization with proper null handling
type LinkResponse struct {
	ID         int        `json:"id"`
	Slug       string     `json:"slug"`
	TargetURL  string     `json:"target_url"`
	CreatedAt  time.Time  `json:"created_at"`
	ExpiresAt  *time.Time `json:"expires_at"`
	ClickLimit *int       `json:"click_limit"`
	ClickCount int        `json:"click_count"`
	DeletedAt  *time.Time `json:"deleted_at,omitempty"`
	UserID     *int       `json:"user_id,omitempty"`
}

// ToResponse converts Link to LinkResponse with proper null handling
func (l *Link) ToResponse() LinkResponse {
	response := LinkResponse{
		ID:         l.ID,
		Slug:       l.Slug,
		TargetURL:  l.TargetURL,
		CreatedAt:  l.CreatedAt,
		ClickCount: l.ClickCount,
	}

	if l.ExpiresAt.Valid {
		response.ExpiresAt = &l.ExpiresAt.Time
	}

	if l.ClickLimit.Valid {
		clickLimit := int(l.ClickLimit.Int32)
		response.ClickLimit = &clickLimit
	}

	if l.DeletedAt.Valid {
		response.DeletedAt = &l.DeletedAt.Time
	}

	if l.UserID.Valid {
		userID := int(l.UserID.Int32)
		response.UserID = &userID
	}

	return response
}

type CreateLinkRequest struct {
	TargetURL  string     `json:"target_url" validate:"required,url"`
	ExpiresAt  *time.Time `json:"expires_at,omitempty" validate:"omitempty"`
	ClickLimit *int       `json:"click_limit,omitempty" validate:"omitempty,gt=0"`
}
