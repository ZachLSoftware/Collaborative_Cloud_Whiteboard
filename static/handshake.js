//const socket = io.connect("http://localhost:5000");
const socket = io.connect("http://whiteboardalb-825666193.eu-west-2.elb.amazonaws.com:3000",{
        transports: ['websocket'],
});

socket.on("canvas-data", function(data){
    drawNewShape(data);
})

socket.on("connect", () => {
    socket.emit("join", room);
  });

socket.on("catchup", function(data){
    catchup(data);
})

socket.on("clear", function(){
    clearCanvas();    
})