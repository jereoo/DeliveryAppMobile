# LAN-ONLY STARTUP – No tunnel. Phone and PC on same Wi-Fi.
#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BACKEND_PATH="../DeliveryAppBackend"
MOBILE_PATH="."

echo -e "${BLUE}LAN-ONLY MOBILE STARTUP (No tunnel)${NC}"
echo -e "${BLUE}=====================================${NC}"

# Step 1: Django
echo -e "${YELLOW}Checking Django backend...${NC}"
if curl -s http://localhost:8000/api/health/ > /dev/null 2>&1; then
    echo -e "${GREEN}Django already running${NC}"
else
    echo -e "${YELLOW}Starting Django...${NC}"
    cd "$BACKEND_PATH"
    [ -f "venv/bin/activate" ] && source venv/bin/activate || [ -f ".venv/bin/activate" ] && source .venv/bin/activate
    python manage.py runserver 0.0.0.0:8000 &
    for i in {1..30}; do
        if curl -s http://localhost:8000/api/health/ > /dev/null 2>&1; then echo -e "${GREEN}Django ready${NC}"; break; fi
        sleep 2
    done
    cd - > /dev/null
fi

# Step 2: Local IP for .env
echo -e "${YELLOW}Detecting local IP...${NC}"
LOCAL_IP=$(ip route get 1 2>/dev/null | awk '{print $7; exit}' || hostname -I 2>/dev/null | awk '{print $1}' || echo "192.168.1.80")
echo -e "${GREEN}Local IP: $LOCAL_IP${NC}"

# Step 3: .env (LAN only)
cat > .env << EOF
# LAN-only
BACKEND_URL=http://${LOCAL_IP}:8000/api
EOF
echo -e "${GREEN}.env updated with BACKEND_URL=http://${LOCAL_IP}:8000/api${NC}"

# Step 4: Start Expo (LAN only – no tunnel)
echo -e "${YELLOW}Starting Expo (LAN only)...${NC}"
npx expo start --clear --port 8081
