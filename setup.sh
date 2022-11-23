#!/bin/bash

apt-get install python3-venv -y

apt-get install nginx -y

systemctl start nginx
systemctl enable nginx

cd whiteboard
python3 -m venv venv

source venv/bin/activate

pip install wheel
pip install gunicorn flask

deactivate

echo '[Unit]
Description=Gunicorn instance to serve Flask
After=network.target
[Service]
User=root
Group=www-data
WorkingDirectory=/home/ubuntu/whiteboard
Environment="PATH=/home/ubuntu/whiteboard/venv/bin"
ExecStart=/home/ubuntu/whiteboard/venv/bin/gunicorn --bind 0.0.0.0:5000 wsgi:app
[Install]
WantedBy=multi-user.target' >> /etc/systemd/system/whiteboard.service

systemctl daemon-reload

systemctl start whiteboard
systemctl enable whiteboard

echo "server {
    listen 80;

    server_name *.amazonaws.com;
    location / {
        include proxy_params;
        proxy_pass  http://127.0.0.1:5000;
    }
}" >> /etc/nginx/conf.d/whiteboard.conf

systemctl restart nginx
apt-get install nodejs
apt-get install npm
npm cache clean -f
npm install -g n
n stable
cd /home/ubuntu/whiteboard/server
npm install socket.io
npm install @socket.io/redis-adapter ioredis
npm install pm2@latest -g

sudo -u ubuntu pm2 startup

env PATH=$PATH:/usr/local/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

pm2 start /home/ubuntu/whiteboard/server/server.js