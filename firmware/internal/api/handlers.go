package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/go-chi/chi/v5"
	webpush "github.com/SherClockHolmes/webpush-go"
	cbauth "github.com/yoennis/cardbridge-core/internal/auth"
	"github.com/yoennis/cardbridge-core/internal/mqttsync"
	"github.com/yoennis/cardbridge-core/internal/storage"
)

type Handler struct {
	store        *storage.Store
	db           *sql.DB
	jwtSecret    string
	vapidPublic  string
	vapidPrivate string
	mqtt         *mqttsync.Manager
}

func NewHandler(store *storage.Store, db *sql.DB, jwtSecret string, mqtt *mqttsync.Manager) *Handler {
	pub, priv, err := loadOrGenerateVAPIDKeys(db)
	if err != nil {
		pub, priv = "", ""
	}
	return &Handler{store: store, db: db, jwtSecret: jwtSecret, vapidPublic: pub, vapidPrivate: priv, mqtt: mqtt}
}

// ─── Auth ────────────────────────────────────────────────────────────────────

type authRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type userResponse struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

type authResponse struct {
	Token string       `json:"token"`
	User  userResponse `json:"user"`
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req authRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "invalid request", http.StatusBadRequest)
		return
	}
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	if req.Name == "" || req.Email == "" || len(req.Password) < 6 {
		writeError(w, "name, email and password (min 6 chars) are required", http.StatusBadRequest)
		return
	}

	hash, err := cbauth.HashPassword(req.Password)
	if err != nil {
		writeError(w, "internal error", http.StatusInternalServerError)
		return
	}

	id := newID()
	_, err = h.db.ExecContext(r.Context(),
		`INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)`,
		id, req.Name, req.Email, hash,
	)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			writeError(w, "email already registered", http.StatusConflict)
			return
		}
		writeError(w, "internal error", http.StatusInternalServerError)
		return
	}

	token, err := cbauth.GenerateToken(h.jwtSecret, id, req.Email, req.Name)
	if err != nil {
		writeError(w, "internal error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	writeJSON(w, authResponse{Token: token, User: userResponse{ID: id, Name: req.Name, Email: req.Email}})
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req authRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "invalid request", http.StatusBadRequest)
		return
	}
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	var id, name, hash string
	err := h.db.QueryRowContext(r.Context(),
		`SELECT id, name, password_hash FROM users WHERE email = ?`, req.Email,
	).Scan(&id, &name, &hash)
	if err == sql.ErrNoRows || !cbauth.CheckPassword(hash, req.Password) {
		writeError(w, "invalid email or password", http.StatusUnauthorized)
		return
	}
	if err != nil {
		writeError(w, "internal error", http.StatusInternalServerError)
		return
	}

	token, err := cbauth.GenerateToken(h.jwtSecret, id, req.Email, name)
	if err != nil {
		writeError(w, "internal error", http.StatusInternalServerError)
		return
	}

	writeJSON(w, authResponse{Token: token, User: userResponse{ID: id, Name: name, Email: req.Email}})
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	claims := claimsFromCtx(r)
	writeJSON(w, userResponse{ID: claims.Subject, Name: claims.Name, Email: claims.Email})
}

// ─── Devices & Clips ─────────────────────────────────────────────────────────

func (h *Handler) ListDevices(w http.ResponseWriter, r *http.Request) {
	devices, err := h.store.Devices()
	if err != nil {
		writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, devices)
}

func (h *Handler) ListClips(w http.ResponseWriter, r *http.Request) {
	clips, err := h.store.Clips(chi.URLParam(r, "deviceID"))
	if err != nil {
		writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, clips)
}

func (h *Handler) StreamClip(w http.ResponseWriter, r *http.Request) {
	path, ok := h.store.ClipPath(chi.URLParam(r, "deviceID"), chi.URLParam(r, "clipID"))
	if !ok {
		http.NotFound(w, r)
		return
	}
	f, err := os.Open(path)
	if err != nil {
		writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer f.Close()
	stat, _ := f.Stat()
	http.ServeContent(w, r, stat.Name(), stat.ModTime(), f)
}

// ─── File watcher callback ────────────────────────────────────────────────────

// OnNewClip is called by the storage.Watcher when a new video file is stable.
// It broadcasts a push notification to every subscribed user.
func (h *Handler) OnNewClip(clip storage.Clip) {
	type payload struct {
		Title string `json:"title"`
		Body  string `json:"body"`
		Tag   string `json:"tag"`
	}

	body := clip.Name
	if clip.Duration > 0 {
		body = fmt.Sprintf("%s · %dm%02ds", clip.Name, clip.Duration/60, clip.Duration%60)
	}
	data, _ := json.Marshal(payload{
		Title: "CardBridge — new clip",
		Body:  body,
		Tag:   "cb-clip-" + clip.ID,
	})

	rows, err := h.db.Query(`SELECT endpoint, p256dh, auth FROM push_subscriptions`)
	if err != nil {
		return
	}
	defer rows.Close()

	for rows.Next() {
		var endpoint, p256dh, auth string
		if err := rows.Scan(&endpoint, &p256dh, &auth); err != nil {
			continue
		}
		resp, err := webpush.SendNotification(data, &webpush.Subscription{
			Endpoint: endpoint,
			Keys:     webpush.Keys{P256dh: p256dh, Auth: auth},
		}, &webpush.Options{
			VAPIDPublicKey:  h.vapidPublic,
			VAPIDPrivateKey: h.vapidPrivate,
			Subscriber:      "cardbridge@local",
			TTL:             86400,
		})
		if err == nil {
			resp.Body.Close()
		}
	}
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, msg string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
