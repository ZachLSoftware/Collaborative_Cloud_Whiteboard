
/*var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http,{
    cors: {
        origin: "*"
      }
});*/
let state={};
const { Server } = require('socket.io');
const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");
var io=new Server({
    cors: {
        origin: "*"
      }
});
const pubClient = createClient({ url: "redis://127.0.0.1:6379" });

const subClient = pubClient.duplicate();
Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    io.listen(5000);
  });


io.on('connection', (socket) => {
    //socket.on("error",)
    console.log('User ' + socket.id + 'online');
    
    socket.on("join", (data=>{
        if(!state[data]){state[data]=[]};
        socket.join(data);
        if(state[data].length>1){catchupClient(socket, data);}
        
    }));

    socket.on("resize", (data=>{
        socket.join(data);
        if(state[data].length>1){catchupClient(socket, data);}
    }));

    socket.on('canvas-data', (data => {
        let r = Array.from(socket.rooms)[1];
        state[r].push(data);
        socket.to(r).emit('canvas-data', data);
        console.log(state[r]);
    }))

    socket.on("clear", (data=>{
        let r = Array.from(socket.rooms)[1];
        socket.to(r).emit("clear","clear");
        state[r] = [];
    }))
})

/*
var server_port = process.env.YOUR_PORT || process.env.PORT || 3000;
http.listen(server_port, () => {
    console.log("Started on : " + server_port);
});
*/
io.listen(3000);

function catchupClient(socket, data){
    if(!(data in state)){
        state[data]=[];
    }
    if(state[data].length>0){
        socket.emit("catchup", state[data]);
    }
}