.PHONY: start start-backend start-frontend start-db stop e2e-up e2e-down e2e

start:
	osascript -e "tell app \"Terminal\" to do script \"cd '$(PWD)/data-pumpster-service' && docker compose up -d && ./gradlew bootRun\""
	osascript -e "tell app \"Terminal\" to do script \"cd '$(PWD)/data-pumpster-app' && npm run dev\""
	@echo "Database: localhost:5432"
	@echo "Backend:  http://localhost:8080"
	@echo "Frontend: http://localhost:3000"

start-db:
	cd data-pumpster-service && docker compose up -d

start-backend:
	cd data-pumpster-service && ./gradlew bootRun

start-frontend:
	cd data-pumpster-app && npm run dev

stop:
	-lsof -ti :3000 | xargs kill -9
	-lsof -ti :8080 | xargs kill -9
	cd data-pumpster-service && docker compose down -v

e2e:
	$(MAKE) start-db
	cd data-pumpster-service && nohup ./gradlew bootRun > /tmp/backend.log 2>&1 &
	@echo "Waiting for backend on :8080..."
	@until curl -sf --max-time 2 http://localhost:8080/actuator/health > /dev/null 2>&1; do sleep 3; done
	@echo "Backend ready."
	cd e2e && npm test; CODE=$$?; $(MAKE) stop; exit $$CODE
