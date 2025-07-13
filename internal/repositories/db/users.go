package db

import (
	"database/sql"
	"fmt"
	"log"

	"link-guardian/internal/models"
)

func IsEmailUnique(email string) (error error) {
	query := "SELECT COUNT(*) FROM users WHERE email = $1"
	var count int

	err := db.QueryRow(query, email).Scan(&count)
	if err != nil {
		log.Fatalf("Error checking email uniqueness: %v", err)
	}

	if count > 0 {
		return fmt.Errorf("email %s is already in use", email)
	}
	return nil
}

func IsUsernameUnique(username string) (error error) {
	query := "SELECT COUNT(*) FROM users WHERE username = $1"
	var count int

	err := db.QueryRow(query, username).Scan(&count)
	if err != nil {
		log.Fatalf("Error checking username uniqueness: %v", err)
	}

	if count > 0 {
		return fmt.Errorf("username %s is already in use", username)
	}
	return nil
}

func InsertUserToDB(username, email, password string) (int, error) {
	query := `INSERT INTO users (username, email, password, created_at) 
			  VALUES ($1, $2, $3, NOW()) RETURNING id`
	var userID int

	err := db.QueryRow(query, username, email, password).Scan(&userID)
	if err != nil {
		fmt.Println("Error inserting user:", err)
		return 0, fmt.Errorf("failed to insert user: %w", err)

	}
	return userID, nil
}

func CheckLoginCredentials(email, password string) (int, error) {
	query := "SELECT id FROM users WHERE email = $1 AND password = $2"
	var userID int

	err := db.QueryRow(query, email, password).Scan(&userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, fmt.Errorf("invalid email or password")
		}
		return 0, fmt.Errorf("failed to check login credentials: %w", err)
	}

	return userID, nil
}

func GetUsernameByID(userID int) (string, error) {
	query := "SELECT username FROM users WHERE id = $1"
	var username string

	err := db.QueryRow(query, userID).Scan(&username)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", fmt.Errorf("user not found")
		}
		return "", fmt.Errorf("failed to get username: %w", err)
	}

	return username, nil
}

func GetUserByEmail(email string) (*models.User, error) {
	query := `SELECT id, username, email, password, created_at FROM users WHERE LOWER(email) = LOWER($1)`
	var user models.User

	err := db.QueryRow(query, email).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.Password,
		&user.CreatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return &user, nil
}
