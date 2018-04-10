"use strict"


var room=new Array()
const WebSocket=require('ws')

const WebSocketServer=WebSocket.Server

const wss= new WebSocketServer({
        port:3005
    })
    console.log("[SERVER]waiting for connections......")
wss.on('connection', function (ws,req) {
    
    console.log(`[SERVER] connection()`);
    
    console.log(`client:${req.connection.remoteAddress}`)
    console.log(wss.clients)
    ws.on('message', function (message) {
        console.log(`[SERVER] Received: ${message}`);
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