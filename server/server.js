/*
    * Internet and Cloud Computing CO3219 - University of Leicester
    * Group 7
    * Authors - Zachary Larsen
    *         - Dante Baptiste
    *         - Matthew Elliott
    *         - Alexander Bradshaw
*/

//Get dependencies
const { Server } = require('socket.io');
const { Cluster } = require("ioredis");
const { createAdapter } = require("@socket.io/redis-adapter");



const redisHost = "whiteboarde.ikwtnf.clustercfg.euw2.cache.amazonaws.com";

//Get servername
const os = require("os");
const serverName = os.hostname();

//Set cors to prevent errors.
var io=new Server({
    cors: {
        origin: "*"
      }
});

//const pubClient = createClient({ host: "redis://127.0.0.1", port: 6379 });

//Connect to AWS redis cluster
const pubClient = new Cluster([
    { 
        host: redisHost, 
        port: 6379 
    }
]);
const subClient = pubClient.duplicate();

//Create a redis-adapter
io.adapter(createAdapter(pubClient, subClient));

//Start listening on port 3000
io.listen(3000);

//Create listener for new clients
io.on('connection', (socket) => {

    //Handle Join event
    socket.on("join", (data=>{

        //Set room data on redis
        pubClient.persist(data);

        //Join socket to room
        socket.join(data);

        //Pass connection information to client for display
        let connection = {clientId: socket.id, room: data, server: serverName}
        socket.emit("connect-info", connection);

        //Get any existing whiteboard data for room
        catchupClient(socket, data);

    }));

    //Resends current state when canvas is resized
    socket.on("resize", (data=>{
        catchupClient(socket, data);
    }));

    //Handles new drawing data
    socket.on('canvas-data', (async data => {

        //Get room
        let r = Array.from(socket.rooms)[1];

        //Handles if client sends an empty shape
        if(data.length>1){

            //Only stores end result of square or circle. If not stores the entire shape detail.
            if(data[0]["tool"]!="pencil" && data[0]["tool"]!="eraser"){
                pubClient.rpush.apply(pubClient, [r].concat(JSON.stringify([data[0],data[data.length-1]])));
            }
            else{pubClient.rpush.apply(pubClient, [r].concat(JSON.stringify(data)))};
        
            //Broadcast new shape to room
            socket.to(r).emit('canvas-data', data);
        }
    }))

    //Handles clearing of whiteboard
    socket.on("clear", (data=>{

        //Get socket room
        let r = Array.from(socket.rooms)[1];

        //Send clear signal to all clients
        socket.to(r).emit("clear","clear");

        //Clear stored state
        pubClient.del(r);
    }))

    //Handle Disconnecting Client
    socket.on("disconnecting", (data => {

        //Get socket Room
       let r =Array.from(socket.rooms)[1]

       //If client is the only client in the room set data to expire in 1 hour
        if(io.sockets.adapter.rooms.get(r).size==1){
            console.log("Setting Dat ato expire")
            pubClient.expire(r, 3600);
        }
    }))

})

async function catchupClient(socket, data){

    //Create array to store data
    let state = [];

    //Get state data from redis cluster
    const result = await pubClient.lrange(data, 0, -1);

    //Parse each row and store
    result.forEach((item,i) =>{
        state.push(JSON.parse(item));
   });

    //Send data to client
    socket.emit("catchup", state);
}
