package api

import (
	"database/sql"
	"io/fs"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	cbmiddleware "github.com/yoennis/cardbridge-core/internal/middleware"
	"github.com/yoennis/cardbridge-core/internal/storage"
	"github.com/yoennis/cardbridge-core/web"
)

// NewRouter is the standard entry point — creates its own Handler internally.
func NewRouter(store *storage.Store, db *sql.DB, jwtSecret, appOrigin string) *chi.Mux {
	return BuildRouter(NewHandler(store, db, jwtSecret, nil), jwtSecret, appOrigin)
}

// BuildRouter builds the chi router from a pre-constructed Handler.
// Use this when you need a reference to the Handler before the router exists
// (e.g. to wire up a storage.Watcher that calls h.OnNewClip).
func BuildRouter(h *Handler, jwtSecret, appOrigin string) *chi.Mux {
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{appOrigin},
		AllowedMethods:   []string{"GET", "POST", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "Range"},
		ExposedHeaders:   []string{"Content-Length", "Content-Range", "Accept-Ranges"},
		AllowCredentials: false,
	}))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("ok"))
	})

	r.Route("/api", func(r chi.Router) {
		// Public
		r.Post("/auth/register", h.Register)
		r.Post("/auth/login", h.Login)
		r.Get("/notifications/vapid-key", h.GetVapidKey)
		r.Get("/device/info", h.GetDeviceInfo)
		r.Get("/device/diagnostics", h.GetDiagnostics)

		// Protected — JWT required
		r.Group(func(r chi.Router) {
			r.Use(cbmiddleware.Authenticate(jwtSecret))
			r.Use(h.RequireUnitOwner)
			r.Get("/auth/me", h.Me)
			r.Get("/devices", h.ListDevices)
			r.Get("/devices/{deviceID}/clips", h.ListClips)
			r.Get("/devices/{deviceID}/clips/{clipID}/stream", h.StreamClip)
			r.Post("/notifications/subscribe", h.Subscribe)
			r.Delete("/notifications/unsubscribe", h.Unsubscribe)
			r.Post("/notifications/test", h.TestPush)
			r.Get("/network/scan", h.ScanWifi)
			r.Get("/network/config", h.GetNetworkConfig)
			r.Post("/network/config", h.SetNetworkConfig)
			r.Post("/network/connect", h.ConnectHomeWifi)
			r.Post("/device/activate", h.ActivateDevice)
			r.Post("/device/name", h.SetDeviceName)
			r.Get("/integrations/mqtt", h.GetMQTTConfig)
			r.Post("/integrations/mqtt", h.SetMQTTConfig)
			r.Delete("/integrations/mqtt", h.DeleteMQTTConfig)
		})
	})

	// Serve embedded React SPA for all other routes
	spaFS, err := fs.Sub(web.FS, "dist")
	if err == nil {
		r.Handle("/*", spaHandler(spaFS))
	}

	return r
}

func spaHandler(fsys fs.FS) http.Handler {
	fileServer := http.FileServer(http.FS(fsys))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/")
		if path == "" {
			path = "index.html"
		}
		f, err := fsys.Open(path)
		if err != nil {
			// File not found — serve index.html for SPA client-side routing
			r.URL.Path = "/"
		} else {
			f.Close()
		}
		fileServer.ServeHTTP(w, r)
	})
}
