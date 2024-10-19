dev:
	concurrently "air" "cd frontend && npm run dev"
	
build:
	cd frontend && npm run build
	go build