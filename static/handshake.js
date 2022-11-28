const socketServer = "http://whiteboardalb-825666193.eu-west-2.elb.amazonaws.com:3000";

//const socket = io.connect("http://localhost:5000",{
const socket = io.connect(socketServer,{
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

socket.on("connect-info", function(data){
    let htmlString = "<p>Client ID: " + data["clientId"] +
                        "</p><p>Server: " + data["server"] +
                        "</p><p>Room: " + data["room"];
    $("#connectInfo").html(htmlString);
})