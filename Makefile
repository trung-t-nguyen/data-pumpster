.PHONY: start start-backend start-frontend start-db stop e2e-up e2e-down e2e

start:
	osascript -e "tell app \"Terminal\" to do script \"cd '$(PWD)/data-pumpster-server' && docker compose up -d && ./gradlew bootRun\""
	osascript -e "tell app \"Terminal\" to do script \"cd '$(PWD)/data-pumpster-app' && npm run dev\""
	@echo "Database: localhost:5432"
	@echo "Backend:  http://localhost:8080"
	@echo "Frontend: http://localhost:3000"

start-db:
	cd data-pumpster-server && docker compose up -d

start-backend:
	cd data-pumpster-server && ./gradlew bootRun

start-frontend:
	cd data-pumpster-app && npm run dev

stop:
	-lsof -ti :3000 | xargs kill -9
	-lsof -ti :8080 | xargs kill -9
	cd data-pumpster-server && docker compose down -v

e2e:
	$(MAKE) start
	cd e2e && npm test; CODE=$$?; $(MAKE) stop; exit $$CODE
