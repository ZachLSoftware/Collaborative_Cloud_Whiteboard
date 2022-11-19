const socket = io.connect("http://localhost:5000");//"http://http://ec2-18-170-224-112.eu-west-2.compute.amazonaws.com/whiteboard?room=e7bmzX0VOlySCHozg13b:5050");

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