"use strict"

const maxmember = 2;
var WaitingRooms = new Map();
var GamingRooms = new Map();
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;
const wss = new WebSocketServer({
    port: 7777
})
console.log(`[SERVER]yychat等待连接...... || ${new Date()}`)
wss.on('connection', function(ws, req) {
    //console.log(ws)
    console.dir(`新的连接 || ${new Date()}`)
    ws.on('message', function(message) {
        console.log(`[SERVER]${message} || ${new Date()}`)
        wss.clients.forEach(client => {
            client.send(message);
        });
    })
    ws.on('close', function(close) {
        console.log(`[SERVER]连接断开 || ${new Date()}`)
    })
})