
let state={};
let result = [];
const { Server } = require('socket.io');
const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");
var io=new Server({
    cors: {
        origin: "*"
      }
});
//const pubClient = createClient({ url: "redis://127.0.0.1:6379" });
const pubClient = createClient({ url: "redis://whiteboardtestcluster.ikwtnf.clustercfg.memorydb.eu-west-2.amazonaws.com:6379" });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    io.listen(3000);
  });


io.on('connection', (socket) => {

    
    socket.on("join", (data=>{
        pubClient.persist(data);
        socket.join(data);
        catchupClient(socket, data);
        
    }));

    socket.on("resize", (data=>{
        catchupClient(socket, data);
    }));

    socket.on('canvas-data', (async data => {
        let r = Array.from(socket.rooms)[1];
        
           //const result = await pubClient.lRange(r, 0, -1);

           //console.log(await JSON.parse(result));

        if(data.length>1){
            if(data[0]["tool"]!="pencil" && data[0]["tool"]!="eraser"){
                pubClient.rPush.apply(pubClient, [r].concat(JSON.stringify([data[0],data[data.length-1]])));
        }else{pubClient.rPush.apply(pubClient, [r].concat(JSON.stringify(data)))};
        socket.to(r).emit('canvas-data', data);
        }
    }))

    socket.on("clear", (data=>{
        let r = Array.from(socket.rooms)[1];
        socket.to(r).emit("clear","clear");
        state[r] = [];
    }))
    socket.on("disconnecting", (data => {
       // console.log("Disconnecting " + socket.id, io.sockets.adapter.rooms.get(Array.from(socket.rooms)[1]));
       let r =Array.from(socket.rooms)[1]
        if(io.sockets.adapter.rooms.get(r).size==1){
            console.log("Setting Dat ato expire")
            pubClient.expire(r, 5);
        }
    }))

    socket.on("disconnect", (data => {
    }))
})

async function catchupClient(socket, data){
    let state = [];
    const result = await pubClient.lRange(data, 0, -1);
    result.forEach((item,i) =>{
        state.push(JSON.parse(item));
   });
    if(state.length>0){
        socket.emit("catchup", state);
    }
}