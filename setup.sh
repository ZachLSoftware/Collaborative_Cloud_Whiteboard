#!/bin/bash

#Install nginx HTTP Server
sudo apt-get install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx

#Install virtual Environment for Flask App
sudo apt-get install python3-venv -y
sudo python3 -m venv venv
source venv/bin/activate

#Install Flask Dependencies
sudo pip install wheel
sudo pip install gunicorn flask
deactivate

#Create Systemctl Service to start gunicorn
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

#Refresh Dameon and enable flask application
sudo systemctl daemon-reload
sudo systemctl start whiteboard
sudo systemctl enable whiteboard

#Create nginx configuration to point to flask
echo "server {
    listen 80;

    server_name *.amazonaws.com;
    location / {
        include proxy_params;
        proxy_pass  http://127.0.0.1:5000;
    }
}" >> /etc/nginx/conf.d/whiteboard.conf

sudo systemctl restart nginx

#Install dependencies for Node server
sudo apt-get install nodejs
sudo apt-get install npm
sudo npm cache clean -f
sudo npm install -g n
sudo n stable

sudo npm install socket.io
sudo npm install @socket.io/redis-adapter ioredis
sudo npm install pm2@latest -g

#use pm2 to start node server automatically
pm2 startup
sudo env PATH=$PATH:/usr/local/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
sudo pm2 start /home/ubuntu/whiteboard/server/server.js
pm2 save