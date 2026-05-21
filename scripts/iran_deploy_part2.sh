#!/usr/bin/env bash
set -e
exec >> /var/log/hh-deploy.log 2>&1
echo "=== RESUMING $(date) ==="

pkill -9 -f "apt-get update" 2>/dev/null || true
pkill -9 -f "apt-get install" 2>/dev/null || true
sleep 2
rm -f /var/lib/apt/lists/lock* /var/cache/apt/archives/lock* /var/lib/dpkg/lock* 2>/dev/null
rm -f /etc/apt/sources.list.d/mongodb-org-7.0.list 2>/dev/null

echo "=== Step 2 retry: MongoDB binary tarball via V2Ray ==="
cd /tmp
proxychains4 -q curl -fSL --max-time 600 https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2204-7.0.16.tgz -o mongo.tgz
ls -lh mongo.tgz
mkdir -p /opt/mongodb
tar -xzf mongo.tgz -C /opt/mongodb --strip-components=1
ln -sf /opt/mongodb/bin/mongod /usr/local/bin/mongod
ln -sf /opt/mongodb/bin/mongos /usr/local/bin/mongos

proxychains4 -q curl -fSL --max-time 180 https://downloads.mongodb.com/compass/mongosh-2.3.2-linux-x64.tgz -o mongosh.tgz 2>&1 | tail -1 || true
tar -xzf mongosh.tgz 2>/dev/null && mv mongosh-2.3.2-linux-x64/bin/mongosh /usr/local/bin/ 2>/dev/null || echo "mongosh skipped"

useradd -r -s /usr/sbin/nologin -d /var/lib/mongodb mongodb 2>/dev/null || true
mkdir -p /var/lib/mongodb /var/log/mongodb
chown -R mongodb:mongodb /var/lib/mongodb /var/log/mongodb

cat > /etc/mongod.conf <<EOF
storage:
  dbPath: /var/lib/mongodb
systemLog:
  destination: file
  path: /var/log/mongodb/mongod.log
  logAppend: true
net:
  port: 27017
  bindIp: 127.0.0.1
processManagement:
  timeZoneInfo: /usr/share/zoneinfo
EOF

cat > /etc/systemd/system/mongod.service <<EOF
[Unit]
Description=MongoDB
After=network.target

[Service]
User=mongodb
ExecStart=/usr/local/bin/mongod --config /etc/mongod.conf
LimitFSIZE=infinity
LimitCPU=infinity
LimitAS=infinity
LimitNOFILE=64000
LimitNPROC=64000
LimitMEMLOCK=infinity
TasksMax=infinity
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now mongod
sleep 5
systemctl is-active mongod
mongod --version | head -2

echo "=== Step 3: PM2 via npm ==="
npm config set proxy socks5h://localhost:10808
npm config set https-proxy socks5h://localhost:10808
npm install -g pm2 2>&1 | tail -3
pm2 -v

echo "=== Step 4: git clone via V2Ray ==="
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
git status

echo "=== Step 5: backend ==="
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
pm2 startup systemd -u root --hp /root 2>&1 | grep "sudo env" | head -1 | sh 2>/dev/null || true

echo "=== Step 6: frontend builds ==="
cd /var/www/happyhour/customer-app
echo "VITE_API_BASE=/api/v1" > .env.production
npm install --silent 2>&1 | tail -2
npm run build 2>&1 | tail -3

cd /var/www/happyhour/merchant-app
echo "VITE_API_BASE=/api/v1" > .env.production
npm install --silent 2>&1 | tail -2
npx vite build --base=/merchant/ 2>&1 | tail -3

echo "=== Step 7: SSL ==="
mkdir -p /etc/nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/happyhour.key \
  -out /etc/nginx/ssl/happyhour.crt \
  -subj "/C=IR/ST=Tehran/L=Tehran/O=HappyHour/CN=92.42.207.118" 2>&1 | tail -1
chmod 600 /etc/nginx/ssl/happyhour.key

echo "=== Step 8: nginx ==="
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

echo "=== Step 9: firewall ==="
ufw allow OpenSSH 2>&1 | tail -1
ufw allow 80/tcp 2>&1 | tail -1
ufw allow 443/tcp 2>&1 | tail -1
ufw --force enable 2>&1 | tail -1

echo ""
echo "=== DEPLOY DONE $(date) ==="
curl -k -s --max-time 5 https://127.0.0.1/health
echo ""
pm2 ls
