#!/usr/bin/env bash
set -e
exec >> /var/log/hh-deploy.log 2>&1
echo "=== PART 3 $(date) ==="

# Add Node binaries to PATH globally
echo 'export PATH=/opt/node20/bin:$PATH' > /etc/profile.d/node20.sh
export PATH=/opt/node20/bin:$PATH
hash -r

echo "Node: $(node -v) | npm: $(npm -v)"

# Re-install pm2 globally and symlink
npm config set proxy socks5h://localhost:10808
npm config set https-proxy socks5h://localhost:10808
npm install -g pm2 2>&1 | tail -3
ln -sf /opt/node20/bin/pm2 /usr/local/bin/pm2
pm2 -v

echo "=== git clone via V2Ray ==="
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
git status | head -3

echo "=== backend ==="
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
pm2 delete happyhour-api 2>/dev/null || true
pm2 start ecosystem.config.cjs 2>&1 | tail -3
pm2 save
pm2 startup systemd -u root --hp /root 2>&1 | grep -E "sudo|env PATH" | tail -1 | sh 2>&1 | tail -2 || true

echo "=== frontends ==="
cd /var/www/happyhour/customer-app
echo "VITE_API_BASE=/api/v1" > .env.production
npm install --silent 2>&1 | tail -2
npm run build 2>&1 | tail -3

cd /var/www/happyhour/merchant-app
echo "VITE_API_BASE=/api/v1" > .env.production
npm install --silent 2>&1 | tail -2
npx vite build --base=/merchant/ 2>&1 | tail -3

echo "=== SSL + nginx ==="
mkdir -p /etc/nginx/ssl
[ -f /etc/nginx/ssl/happyhour.crt ] || openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/happyhour.key \
  -out /etc/nginx/ssl/happyhour.crt \
  -subj "/C=IR/ST=Tehran/L=Tehran/O=HappyHour/CN=92.42.207.118" 2>&1 | tail -1
chmod 600 /etc/nginx/ssl/happyhour.key

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

ufw allow OpenSSH 2>&1 | tail -1
ufw allow 80/tcp 2>&1 | tail -1
ufw allow 443/tcp 2>&1 | tail -1
ufw --force enable 2>&1 | tail -1

echo ""
echo "=== DEPLOY DONE $(date) ==="
curl -k -s --max-time 5 https://127.0.0.1/health
echo ""
pm2 ls
