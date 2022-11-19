
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

    
    socket.on("join", (data=>{
        if(!state[data]){state[data]=[]};
        socket.join(data);
        if(state[data].length>1){catchupClient(socket, data);}
        
    }));

    socket.on("resize", (data=>{
        if(state[data].length>1){catchupClient(socket, data);}
    }));

    socket.on('canvas-data', (data => {
        let r = Array.from(socket.rooms)[1];
        socket.to(r).emit('canvas-data', data);
    }))

    socket.on("clear", (data=>{
        let r = Array.from(socket.rooms)[1];
        socket.to(r).emit("clear","clear");
        state[r] = [];
    }))
})

function catchupClient(socket, data){
    if(!(data in state)){
        state[data]=[];
    }
    if(state[data].length>0){
        console.log(state[data]);
        socket.emit("catchup", state[data]);
    }
}