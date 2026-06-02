package api

import (
	"database/sql"
	"encoding/json"
	"net/http"

	webpush "github.com/SherClockHolmes/webpush-go"
)

func loadOrGenerateVAPIDKeys(db *sql.DB) (pub, priv string, err error) {
	err = db.QueryRow(`SELECT public_key, private_key FROM vapid_keys WHERE id = 1`).Scan(&pub, &priv)
	if err == nil {
		return pub, priv, nil
	}
	priv, pub, err = webpush.GenerateVAPIDKeys()
	if err != nil {
		return "", "", err
	}
	_, err = db.Exec(`INSERT INTO vapid_keys (id, public_key, private_key) VALUES (1, ?, ?)`, pub, priv)
	return pub, priv, err
}

func (h *Handler) GetVapidKey(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]string{"publicKey": h.vapidPublic})
}

type subscribeRequest struct {
	Endpoint string `json:"endpoint"`
	P256DH   string `json:"p256dh"`
	Auth     string `json:"auth"`
}

func (h *Handler) Subscribe(w http.ResponseWriter, r *http.Request) {
	claims := claimsFromCtx(r)
	var req subscribeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "invalid request", http.StatusBadRequest)
		return
	}
	id := newID()
	_, err := h.db.ExecContext(r.Context(), `
		INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth)
		VALUES (?, ?, ?, ?, ?)
		ON CONFLICT(endpoint) DO UPDATE SET p256dh=excluded.p256dh, auth=excluded.auth`,
		id, claims.Subject, req.Endpoint, req.P256DH, req.Auth,
	)
	if err != nil {
		writeError(w, "internal error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) Unsubscribe(w http.ResponseWriter, r *http.Request) {
	claims := claimsFromCtx(r)
	var req struct {
		Endpoint string `json:"endpoint"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "invalid request", http.StatusBadRequest)
		return
	}
	h.db.ExecContext(r.Context(),
		`DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?`,
		claims.Subject, req.Endpoint)
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) TestPush(w http.ResponseWriter, r *http.Request) {
	claims := claimsFromCtx(r)

	rows, err := h.db.QueryContext(r.Context(),
		`SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?`,
		claims.Subject)
	if err != nil {
		writeError(w, "internal error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type payload struct {
		Title string `json:"title"`
		Body  string `json:"body"`
		Tag   string `json:"tag"`
	}
	data, _ := json.Marshal(payload{
		Title: "CardBridge",
		Body:  "Push notifications are working!",
		Tag:   "cb-test",
	})

	var sent int
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
			TTL:             30,
		})
		if err == nil {
			resp.Body.Close()
			sent++
		}
	}

	writeJSON(w, map[string]int{"sent": sent})
}
