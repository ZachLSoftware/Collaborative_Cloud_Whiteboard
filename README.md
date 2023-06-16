# Collaborative Whiteboard
The collaborative whiteboard is a simple web application that allows for multiple users to use a whiteboard at the same time.
Users can join a room together and begin drawing.

## Installation
To run this project you will need Python 3, Node.JS and to install the dependencies found in requirements.txt
*pip install -r requirements.txt*

Using NPM, install the Node depencies:
*sudo npm install socket.io*
*sudo npm install @socket.io/redis-adapter ioredis*
*sudo npm install pm2@latest -g*

The project also requires Redis to be installed:
[Redis Installation](https://redis.io/docs/getting-started/installation/)

To build out the application on a new server, use the *setup.sh* file.

## Usage
A user is directed to a landing page. They can create or generate a new room. If a user wants to join that room, they can share the link out. Users have the ability to use several tools to interact with the whiteboard. Once a user has drawn a shape, the application will display the shape on other users screens. If a room is inactive for an hour, the room is removed and the data is cleaned up.
