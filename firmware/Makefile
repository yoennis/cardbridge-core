.PHONY: build build-pi build-pi-v6 build-all build-pi-all run clean

BINARY := cardbridge
OUT    := bin
CMD    := ./cmd/server

build:
	@mkdir -p $(OUT)
	go build -o $(OUT)/$(BINARY) $(CMD)

# RPi Zero 2W — ARM64 (Cortex-A53, recommended)
build-pi:
	@mkdir -p $(OUT)
	GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -o $(OUT)/$(BINARY)-arm64 $(CMD)
	@echo "✓  $(OUT)/$(BINARY)-arm64 ready"

# RPi Zero 1st-gen — ARMv6 32-bit
build-pi-v6:
	@mkdir -p $(OUT)
	GOOS=linux GOARCH=arm GOARM=6 go build -ldflags="-s -w" -o $(OUT)/$(BINARY)-armv6 $(CMD)
	@echo "✓  $(OUT)/$(BINARY)-armv6 ready"

# Build frontend + embed into Go binary (local/dev)
build-all:
	@echo "→ building frontend…"
	@cd ../app && npm run build
	@rm -rf web/dist && cp -r ../app/dist web/dist
	@mkdir -p $(OUT)
	go build -o $(OUT)/$(BINARY) $(CMD)
	@echo "✓  $(OUT)/$(BINARY) ready"

# Build frontend + arm64 Pi binary
build-pi-all:
	@echo "→ building frontend…"
	@cd ../app && npm run build
	@rm -rf web/dist && cp -r ../app/dist web/dist
	@mkdir -p $(OUT)
	GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -o $(OUT)/$(BINARY)-arm64 $(CMD)
	@echo "✓  $(OUT)/$(BINARY)-arm64 ready"

run:
	go run $(CMD)

clean:
	rm -rf $(OUT)
