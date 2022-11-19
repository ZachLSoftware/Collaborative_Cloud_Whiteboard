
//Get Canvas Context Elements
const context = document.getElementById("canvas").getContext("2d");
const overlay = document.getElementById("overlay").getContext("2d");

//Initialize Canvas Variables
let color = "#000000";
let coord = {x:0, y:0};
let lineThickness=1;
let lineCap="round";

//Initialize shape array
let current=[];
windowSize();

//Resizes the client window. Resizing resets the canvas, so we get the canvas state and redraw
$( window ).resize(function() {windowSize(); socket.emit("resize", room);});

//Reset color picker to default
$("#colorPicker").val(color);
$("#lineThickness").val(lineThickness);

//When the color changes, set variable
$("#colorPicker").change(function(){
    color=$(this).val();
});

//When line thickness changes set variable
$("#lineThickness").change(function(){
    lineThickness=$(this).val();
});

//Get Mousedown event
$("#canvas").mousedown(function(e){

    //Push styling to array
    current.push({lineWidth:lineThickness, strokeStyle:color})
    startDraw(e);
});

//End Drawing
$("#canvas").mouseup(function(e){stop(e)});


//Handle clearing of the canvas
$("#clearCanvas").click(function(){
    clearCanvas();

    //Alert all sockets in room to clear
    socket.emit("clear","clear");
});

//Clears the canvas
function clearCanvas(){
    context.clearRect(0, 0, canvas.width, canvas.height);
}


//Handles Resizing
function windowSize() {
    //Resets the edge of toolbar
    $(".whiteboard").css("left", 0+$("#toolbar").width());

    //Resize both canvas
    context.canvas.width = document.documentElement.clientWidth-$("#toolbar").width();
    context.canvas.height = document.documentElement.clientHeight;
    overlay.canvas.width = document.documentElement.clientWidth-$("#toolbar").width();
    overlay.canvas.height = document.documentElement.clientHeight;
}

function startDraw(e){

    //Switch case based on Tool to set correct parameters
    switch($("#tool").val()){
        case "pencil":
            current[0]["tool"]="pencil";
            $("#canvas").mousemove(function(ev){drawPencil(ev)});
            break;
        case "square":
            current[0]["tool"]="square";

            //Get starting corner of square
            reposition(e);
            current[0]["startX"]=coord.x;
            current[0]["startY"]=coord.y;
            var startX=coord.x;
            var startY=coord.y;
            $("#canvas").mousemove(function(ev){drawSquare(ev,startX,startY)});
            break;
    }

    //Reposition coordinates for next move
    reposition(e);
}

function drawPencil(e){
    let d=new Date();
    context.beginPath();
    context.lineWidth=current[0]["lineWidth"];
    context.lineCap=lineCap;
    context.strokeStyle=current[0]["strokeStyle"];
    context.moveTo(coord.x, coord.y);
    current.push({moveTo:{x:coord.x, y:coord.y}, time: d.getMilliseconds()});
    reposition(e);
    context.lineTo(coord.x, coord.y);
    current.slice(-1)[0]["lineTo"]={x:coord.x, y:coord.y};
    context.stroke();
    
}

function drawSquare(e, sx, sy){
    let d=new Date();
    overlay.clearRect(0, 0, canvas.width, canvas.height);
    overlay.beginPath();
    overlay.lineWidth=current[0]["lineWidth"];
    overlay.strokeStyle=current[0]["strokeStyle"];
    overlay.moveTo(sx, sy);
    reposition(e);
    current.push({endX:coord.x-sx, endY:coord.y-sy, time: d.getMilliseconds()});
    let ex=coord.x-sx;
    let ey=coord.y-sy;
    overlay.rect(sx, sy, ex, ey);
    overlay.stroke()
}

function reposition(e){
    coord.x=e.clientX - canvas.offsetLeft;
    coord.y=e.clientY - canvas.offsetTop;
}

//Handle Catchup events. Send each shape to drawNewShape
function catchup(state){
    for(let i=0; i<state.length; i++){
        drawNewShape(state[i], true);
    }

}

async function drawNewShape(current, catchup=false){

    //Handle each tool differently
    switch(current[0]["tool"]){
        case "pencil":
            for(let j=1; j<current.length; j++){
                context.beginPath();
                context.lineWidth=current[0]["lineWidth"];
                context.lineCap="round";
                context.moveTo(current[j]["moveTo"]["x"], current[j]["moveTo"]["y"]);
                context.lineTo(current[j]["lineTo"]["x"], current[j]["lineTo"]["y"]);
                context.stroke();

                //If we are drawing real-time, animate
                if(!catchup){
                    if(j+1!=current.length){
                        await sleep(current[j+1]["time"]-current[j]["time"]);
                    }
            }
            }
            break;
        case "square":
            
            //If client is in catchup, just draw the last frame.
            if(catchup){
                j=current.length-1;
            }else{j=1}

            for(j; j<current.length; j++){
                //If we are in the last frame set context to main canvas
                if(j!=current.length-1){
                    ctx=overlay;
                }else{ctx=context};
                overlay.clearRect(0, 0, canvas.width, canvas.height);
                ctx.beginPath()
                ctx.lineWidth=current[0]["lineWidth"];
                ctx.strokeStyle=current[0]["strokeStyle"];
                ctx.moveTo(current[0]["startX"],current[0]["startY"]);
                ctx.rect(current[0]["startX"],current[0]["startY"], current[j]["endX"], current[j]["endY"]);
                ctx.stroke();

                //If not catching up, animate
                if(!catchup){
                    if(j+1!=current.length){
                        await sleep(current[j+1]["time"]-current[j]["time"]-3);
                    }
                }
            }
            break;
        }
}

//Sleep function to provide animation
function sleep(time) {
    return new Promise((resolve) => { 
      setTimeout(resolve, time);
    });
  }

function stop(e){

    //Unbind mouse move event on draw
    $("#canvas").unbind("mousemove");

    switch($("#tool").val()){
        case "pencil":
            break;
        
        //If square, draw last shape on main canvas
        case "square":
            overlay.clearRect(0, 0, canvas.width, canvas.height);
            context.beginPath();
            context.lineWidth=current[0]["lineWidth"];
            context.strokeStyle=current[0]["strokeStyle"];
            context.rect(current[0]["startX"],current[0]["startY"],current[current.length-1]["endX"],current[current.length-1]["endY"]);
            context.stroke();
            break;

    }

        //Send new shape
        socket.emit("canvas-data", current);

        //Clear current shape data
        current=[];
}