#!/usr/bin/env bash
set -e
exec > /var/log/hh-deploy.log 2>&1
echo "=== START $(date) ==="

cleanup_apt() {
  pkill -9 -f apt 2>/dev/null || true
  pkill -9 -f dpkg 2>/dev/null || true
  sleep 3
  rm -f /var/lib/apt/lists/lock* /var/cache/apt/archives/lock* /var/lib/dpkg/lock* 2>/dev/null
  dpkg --configure -a >/dev/null 2>&1 || true
}

cleanup_apt
apt-get remove --purge -y nodejs npm 2>&1 | tail -2 || true
apt-get autoremove -y 2>&1 | tail -1 || true

echo "=== Step 1: Download Node 20 binary via V2Ray ==="
for i in 1 2 3; do
  proxychains4 -q curl -fSL --max-time 120 https://nodejs.org/dist/v20.18.1/node-v20.18.1-linux-x64.tar.xz -o /tmp/node.tar.xz && break
  echo "retry $i"
  sleep 3
done
ls -lh /tmp/node.tar.xz
mkdir -p /opt/node20
tar -xJf /tmp/node.tar.xz -C /opt/node20 --strip-components=1
ln -sf /opt/node20/bin/node /usr/local/bin/node
ln -sf /opt/node20/bin/npm /usr/local/bin/npm
ln -sf /opt/node20/bin/npx /usr/local/bin/npx
hash -r
echo "Node: $(node -v) | npm: $(npm -v)"

echo "=== Step 2: Install MongoDB via Iran apt mirror (or download deb directly) ==="
proxychains4 -q curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor --yes
echo "deb [ arch=amd64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-7.0.list
proxychains4 -q apt-get update -o "Acquire::Retries=3" 2>&1 | tail -3
DEBIAN_FRONTEND=noninteractive proxychains4 -q apt-get install -y mongodb-org 2>&1 | tail -3
systemctl enable --now mongod
sleep 5
systemctl is-active mongod

echo "=== Step 3: Install PM2 via npm + V2Ray ==="
npm config set proxy socks5h://localhost:10808
npm config set https-proxy socks5h://localhost:10808
npm install -g pm2 2>&1 | tail -3
pm2 -v

echo "=== Step 4: Configure git via V2Ray + clone farsi branch ==="
git config --global http.proxy socks5h://localhost:10808
git config --global https.proxy socks5h://localhost:10808
mkdir -p /var/www
cd /var/www
if [ -d happyhour ]; then
  cd happyhour && git fetch origin && git checkout farsi && git pull origin farsi
else
  git clone -b farsi https://github.com/MFK03KILLER/happyhour.git
  cd happyhour
fi

echo "=== Step 5: Install backend deps + create .env + seed ==="
cd /var/www/happyhour/backend
npm install --silent 2>&1 | tail -3
cat > .env <<EOF
NODE_ENV=production
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/happyhour
JWT_ACCESS_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
CORS_ORIGINS=http://92.42.207.118,https://92.42.207.118
ADMIN_EMAIL=admin@happyhour.demo
ADMIN_PASSWORD=Admin@12345
MOCK_PAYMENTS=true
QR_SIGNING_SECRET=$(openssl rand -hex 32)
QR_TTL_SECONDS=60
EOF
npm run seed 2>&1 | tail -10
mkdir -p logs
pm2 start ecosystem.config.cjs 2>&1 | tail -3
pm2 save
pm2 startup systemd -u root --hp /root 2>&1 | tail -3 | sh

echo "=== Step 6: Build frontends ==="
cd /var/www/happyhour/customer-app
echo "VITE_API_BASE=/api/v1" > .env.production
npm install --silent 2>&1 | tail -2
npm run build 2>&1 | tail -3

cd /var/www/happyhour/merchant-app
echo "VITE_API_BASE=/api/v1" > .env.production
npm install --silent 2>&1 | tail -2
npx vite build --base=/merchant/ 2>&1 | tail -3

echo "=== Step 7: Self-signed SSL ==="
mkdir -p /etc/nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/happyhour.key \
  -out /etc/nginx/ssl/happyhour.crt \
  -subj "/C=IR/ST=Tehran/L=Tehran/O=HappyHour/CN=92.42.207.118" 2>&1 | tail -2
chmod 600 /etc/nginx/ssl/happyhour.key

echo "=== Step 8: Nginx config ==="
cat > /etc/nginx/sites-available/happyhour <<'NGX'
upstream happyhour_api { server 127.0.0.1:4000; keepalive 32; }

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;
    server_name _;

    ssl_certificate     /etc/nginx/ssl/happyhour.crt;
    ssl_certificate_key /etc/nginx/ssl/happyhour.key;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

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
    location = /health { proxy_pass http://happyhour_api/health; }
    location / {
        root /var/www/happyhour/customer-app/dist;
        try_files $uri $uri/ /index.html;
    }
}
NGX
ln -sf /etc/nginx/sites-available/happyhour /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "=== Step 9: Firewall ==="
ufw allow OpenSSH 2>&1 | tail -1
ufw allow 80/tcp 2>&1 | tail -1
ufw allow 443/tcp 2>&1 | tail -1
ufw --force enable 2>&1 | tail -1

echo "=== DEPLOY DONE $(date) ==="
echo "Test: curl -k https://127.0.0.1/health"
curl -k -s https://127.0.0.1/health
echo ""
pm2 ls
