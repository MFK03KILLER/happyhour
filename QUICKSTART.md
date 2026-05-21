# Happy Hour — Quick Deploy (Clone from GitHub, PM2 + Nginx)

Repo: https://github.com/MFK03KILLER/happyhour

> Server: Ubuntu 22.04 / 24.04. Replace `SERVER_IP` with your VPS IP everywhere.

---

## 1. One-time server setup

SSH in as `root` (or sudo):

```bash
# Update + base tools
apt update && apt upgrade -y
apt install -y curl git nginx ufw build-essential

# Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# MongoDB 7
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update && apt install -y mongodb-org
systemctl enable --now mongod

# PM2
npm install -g pm2

# Firewall
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable
```

---

## 2. Clone the repo

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/MFK03KILLER/happyhour.git
cd happyhour
```

---

## 3. Backend (Node API)

```bash
cd /var/www/happyhour/backend
npm install

# Create .env
cat > .env <<EOF
NODE_ENV=production
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/happyhour
JWT_ACCESS_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
CORS_ORIGINS=http://SERVER_IP,https://SERVER_IP
ADMIN_EMAIL=admin@happyhour.demo
ADMIN_PASSWORD=Admin@12345
MOCK_PAYMENTS=true
QR_SIGNING_SECRET=$(openssl rand -hex 32)
QR_TTL_SECONDS=60
EOF

# IMPORTANT: replace SERVER_IP in the file you just created
sed -i "s/SERVER_IP/$(curl -s ifconfig.me)/g" .env

# Seed the database
npm run seed

# Start with PM2
mkdir -p logs
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root
# pm2 will print one command — run that command too
```

Verify: `curl http://127.0.0.1:4000/health` → `{"status":"ok",...}`

---

## 4. Build the two frontends

```bash
# Customer app
cd /var/www/happyhour/customer-app
echo "VITE_API_BASE=/api/v1" > .env.production
npm install
npm run build

# Merchant + admin app (built with /merchant/ base path)
cd /var/www/happyhour/merchant-app
echo "VITE_API_BASE=/api/v1" > .env.production
npm install
npx vite build --base=/merchant/
```

---

## 5. Nginx config

```bash
cat > /etc/nginx/sites-available/happyhour <<'EOF'
upstream happyhour_api { server 127.0.0.1:4000; keepalive 32; }

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 2m;
    server_tokens off;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript image/svg+xml;

    location /merchant/ {
        alias /var/www/happyhour/merchant-app/dist/;
        try_files $uri $uri/ /merchant/index.html;
    }

    location /api/ {
        proxy_pass http://happyhour_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
    }

    location = /health {
        proxy_pass http://happyhour_api/health;
    }

    location / {
        root /var/www/happyhour/customer-app/dist;
        try_files $uri $uri/ /index.html;
    }
}
EOF

ln -sf /etc/nginx/sites-available/happyhour /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

---

## 6. Open in your browser

| URL | What you see |
|---|---|
| `http://SERVER_IP/` | Customer app |
| `http://SERVER_IP/merchant/` | Merchant + admin login |
| `http://SERVER_IP/api/docs` | Swagger |

Demo logins:
- Customer: `customer1@happyhour.demo` / `Customer@123`
- Merchant: `pizza.staff@happyhour.demo` / `Merchant@123`
- Admin: `admin@happyhour.demo` / `Admin@12345`

> **Camera scanner needs HTTPS.** It works on `localhost` for testing, but on the public IP you must enable HTTPS. See `DEPLOYMENT.md` Part 6 for the self-signed-cert recipe (3 commands).

---

## 7. Updating later (after a `git push`)

```bash
cd /var/www/happyhour
git pull

# Backend
cd backend && npm install --omit=dev && pm2 restart happyhour-api

# Frontends
cd ../customer-app && npm install && npm run build
cd ../merchant-app && npm install && npx vite build --base=/merchant/
```

No Nginx reload needed for static rebuilds.

---

## Useful commands

```bash
pm2 ls                          # see API status
pm2 logs happyhour-api          # live API logs
pm2 restart happyhour-api       # restart API
systemctl status nginx          # nginx status
tail -f /var/log/nginx/error.log
systemctl status mongod         # mongo status
```
