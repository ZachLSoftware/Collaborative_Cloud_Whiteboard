const context = document.getElementById("canvas").getContext("2d");
const overlay = document.getElementById("overlay").getContext("2d");
let color = "#000000";
let coord = {x:0, y:0};
let lineThickness=1;
let lineCap="round";
let state=[];
let current=[];
windowSize();
console.log($("#tool").val());

$( window ).resize(function() {windowSize(); socket.emit("resize", room);});

$("#colorPicker").val("#000000");
$("#lineThickness").val(lineThickness);
$("#colorPicker").change(function(){
    color=$(this).val();
});

$("#lineThickness").change(function(){
    lineThickness=$(this).val();
});

$("#canvas").mousedown(function(e){
    current.push({lineWidth:lineThickness, strokeStyle:color})
    startDraw(e);
});

$("#canvas").mouseup(function(e){stop(e)});

$("#clearCanvas").click(function(){
    clearCanvas();
    socket.emit("clear","clear");
});

function clearCanvas(){
    context.clearRect(0, 0, canvas.width, canvas.height);
}

function windowSize() {
    $(".whiteboard").css("left", 0+$("#toolbar").width());
    context.canvas.width = document.documentElement.clientWidth-$("#toolbar").width();
    context.canvas.height = document.documentElement.clientHeight;
    overlay.canvas.width = document.documentElement.clientWidth-$("#toolbar").width();
    overlay.canvas.height = document.documentElement.clientHeight;
}

function startDraw(e){
    switch($("#tool").val()){
        case "pencil":
            current[0]["tool"]="pencil";
            $("#canvas").mousemove(function(ev){drawPencil(ev)});
            break;
        case "square":
            current[0]["tool"]="square";
            reposition(e);
            current[0]["startX"]=coord.x;
            current[0]["startY"]=coord.y;
            var startX=coord.x;
            var startY=coord.y;
            $("#canvas").mousemove(function(ev){drawSquare(ev,startX,startY)});
            break;
    }

    
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

function catchup(state){
    /*
    for(let i=0; i<state.length; i++){
        drawNewShape(state[i], true);
    }
    */
   var image = new Image();
   image.onload=function() {
    context.drawImage(image,0,0);
   }
   image.src=state;
}

async function redraw(){
    if(state){
        for(i=0; i<state.length; i++){
                await drawNewShape(state[i]);
            }
    }
}

async function drawNewShape(current, catchup=false){
    console.log("CURRENT",current);
    switch(current[0]["tool"]){
        case "pencil":
            for(let j=1; j<current.length; j++){
                context.beginPath();
                context.lineWidth=current[0]["lineWidth"];
                context.lineCap=current[0]["lineCap"];
                context.strokeStyle=current[0]["strokeStyle"];
                context.moveTo(current[j]["moveTo"]["x"], current[j]["moveTo"]["y"]);
                context.lineTo(current[j]["lineTo"]["x"], current[j]["lineTo"]["y"]);
                context.stroke();
                if("catchup"){
                    if(j+1!=current.length){
                        await sleep(current[j+1]["time"]-current[j]["time"]-3);
                    }
            }
            }
            break;
        case "square":
            for(let j=1; j<current.length; j++){
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
                if(!catchup){
                    if(j+1!=current.length){
                        await sleep(current[j+1]["time"]-current[j]["time"]-3);
                    }
                }
                
            }
            break;
        }
}

function sleep(time) {
    return new Promise((resolve) => { 
      setTimeout(resolve, time);
    });
  }

function stop(e){

    $("#canvas").unbind("mousemove");

    switch($("#tool").val()){
        case "pencil":
            break;
        case "square":
            overlay.clearRect(0, 0, canvas.width, canvas.height);
            context.beginPath();
            context.lineWidth=current[0]["lineWidth"];
            context.strokeStyle=current[0]["strokeStyle"];
            context.rect(current[0]["startX"],current[0]["startY"],current[current.length-1]["endX"],current[current.length-1]["endY"]);
            context.stroke();
            break;

    }

        socket.emit("canvas-data", current);
        current=[];
  

}