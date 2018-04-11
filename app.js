"use strict"

const maxmember=1;
var Room;
var RoomNo;
var WaitingRooms=new Map();
var GamingRooms=new Map();
var tetris_frequancy=new Array();
const WebSocket=require('ws');

const WebSocketServer=WebSocket.Server;

const wss= new WebSocketServer({
        port:3005
    })
    console.log("[SERVER]waiting for connections......")
wss.on('connection', function (ws,req) {
    console.log(`[SERVER] 已连接`);
    if(WaitingRooms.size===0){
        var room={
            tetris_20:new Array(),
            RoomNo:0,
            gametime:0,
            gamestate:0,
            playerstate:new Map(),
            links:new Set()
        }
        var i=0;while(i<20){room.tetris_20.push(parseInt(Math.random()*8));i++;}
        WaitingRooms.set(req.headers.flueid,room)//如果等候室没有房间，就创建一个新房间
    }
    WaitingRooms.forEach((val,key)=>{
        if(val.links.size<maxmember){//如果等候室有房间，就加入一个房间
            val.links.add(ws)
            ws.send(`你的房间号: ${key}`, (err) => {
                if (err) {console.log(`[SERVER] error: ${err}`);}
             });
            if(val.links.size>=maxmember){//把满的房间从等候室放到游戏室
                GamingRooms.set(key,val)
                WaitingRooms.delete(key)
            }            
            return
        }
    })
    console.log(`当前等待房间数：${WaitingRooms.size}  游戏房间数：${GamingRooms.size}`)

    ws.on('message', function (message) {
        console.log(`[SERVER] Received: ${message}`);
        var msg=JSON.parse(message)
        switch(msg.code){
            case 'ready0':{
                console.log('ready0')
                break
            }
            case 'ready1':{
                
            }
            case 'score':{}
            case 'update':{}
            case 'fail':{}
            case 'end':{}
            case 'off':{}
            default :{break}
        }
        ws.send(`ECHO: ${message}`, (err) => {
            if (err) {
                console.log(`[SERVER] error: ${err}`);
            }
        });
    })
    
    ws.on('close',function(close){
        console.log(`connection lost: ${close}`)
    })
    
});