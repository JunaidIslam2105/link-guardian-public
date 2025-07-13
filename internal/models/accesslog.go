package models

import (
	"time"
)

type AccessLog struct {
	ID         int64     `json:"id"`
	LinkID     int64     `json:"link_id"`
	AccessedAt time.Time `json:"accessed_at"`
	IPAddress  string    `json:"ip_address"`
	UserAgent  string    `json:"user_agent"`
	Referer    string    `json:"referer,omitempty"`
	Country    string    `json:"country,omitempty"`
	City       string    `json:"city,omitempty"`
	DeviceType string    `json:"device_type,omitempty"`
	Browser    string    `json:"browser,omitempty"`
	OS         string    `json:"os,omitempty"`
}

type AccessLogRequest struct {
	ID         int64     `json:"id"`
	LinkID     int64     `json:"link_id"`
	AccessedAt time.Time `json:"accessed_at"`
	IPAddress  string    `json:"ip_address"`
	UserAgent  string    `json:"user_agent"`
	Referer    string    `json:"referer,omitempty"`
	Country    string    `json:"country,omitempty"`
	City       string    `json:"city,omitempty"`
	DeviceType string    `json:"device_type,omitempty"`
	Browser    string    `json:"browser,omitempty"`
	OS         string    `json:"os,omitempty"`
}
