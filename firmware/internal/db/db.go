package db

import (
	"database/sql"

	_ "modernc.org/sqlite"
)

func New(path string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1) // SQLite only supports one writer at a time
	if err := migrate(db); err != nil {
		return nil, err
	}
	return db, nil
}

func migrate(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id            TEXT PRIMARY KEY,
			name          TEXT NOT NULL,
			email         TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS push_subscriptions (
			id         TEXT PRIMARY KEY,
			user_id    TEXT NOT NULL,
			endpoint   TEXT UNIQUE NOT NULL,
			p256dh     TEXT NOT NULL,
			auth       TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS vapid_keys (
			id          INTEGER PRIMARY KEY CHECK (id = 1),
			public_key  TEXT NOT NULL,
			private_key TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS units (
			serial       TEXT PRIMARY KEY,
			owner_id     TEXT NOT NULL,
			activated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (owner_id) REFERENCES users(id)
		);
	`)
	return err
}
