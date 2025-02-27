start: stop
	@echo "Starting docker compose"
	docker compose up -d

build-start: build start

build: stop
	@echo "Running build command cleaning the existent build"
	docker compose build --no-cache

stop:
	@echo "Stopping docker compose"
	docker compose down