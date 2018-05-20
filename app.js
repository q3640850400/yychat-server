"use strict"

const maxmember = 2;
var MeetingRooms = new Map();
var Room = new Set();
MeetingRooms.set("jy", Room)
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;
const wss = new WebSocketServer({
    port: 7777
})
console.log(`[SERVER]yychat等待连接...... || ${new Date()}`)
wss.on('connection', function(ws, req) {
    console.log(req)
    console.dir(`新的连接 || ${new Date()}`)
    ws.on('message', function(message) {
        try {
            let inmsg = JSON.parse(message)
            switch (inmsg.code) {
                case "login":
                    {
                        Room.add(inmsg.data);
                        let t = '';
                        Room.forEach(x => {
                            t += ' ' + x;
                        })
                        let outmsg = {
                            code: "sys",
                            data: "在线：" + t
                        }

                        ws.send(JSON.stringify(outmsg));
                        outmsg = {
                            code: "msg",
                            name: inmsg.data,
                            data: inmsg.data + "进来了" + "<br/>"
                        }
                        wss.clients.forEach(client => {
                            client.send(JSON.stringify(outmsg));
                        });
                        break;
                    }
                case "msg":
                    {
                        wss.clients.forEach(client => {
                            client.send(message);
                        });
                        break;
                    }
                case "heartbeat":
                    {
                        break;
                    }
                case "writting":
                    {
                        wss.clients.forEach(client => {
                            if (ws !== client) {
                                client.send(message);
                            }
                        });
                        break;
                    }
            }
        } catch (err) {
            console.log("接收到非法信息：" + err.message + " || " + message);
        }
        console.log(`[SERVER]${message} || ${new Date()}`)

    })
    ws.on('close', function(close) {
        console.log(`[SERVER]连接断开 || ${new Date()}`)
    })
})