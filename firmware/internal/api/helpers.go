package api

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"

	cbauth "github.com/yoennis/cardbridge-core/internal/auth"
	"github.com/yoennis/cardbridge-core/internal/middleware"
)

func newID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func claimsFromCtx(r *http.Request) *cbauth.Claims {
	return r.Context().Value(middleware.ClaimsKey).(*cbauth.Claims)
}
