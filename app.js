"use strict"

const maxmember = 2;
var WaitingRooms = new Map();
var GamingRooms = new Map();
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;
const wss = new WebSocketServer({
    port: 3005
})
console.log("[SERVER]waiting for connections......")
wss.on('connection', function (ws, req) {
    console.log( `${new Date()}[SERVER] ${req.headers.flueid}已连接`);
    var MyRoom;
    var MyflueID = req.headers.flueid;
    if (WaitingRooms.size === 0) {//如果等候室没有房间，就创建一个新房间
        MyRoom = {
            tetris_20: new Array(),
            RoomNo: MyflueID,
            gametime: 0,
            gamestate: 0,
            playerstate: new Map(),
            links: new Set()
        }
        var i = 0; while (i < 20) { MyRoom.tetris_20.push(parseInt(Math.random() * 8)); i++; } i = null;
        WaitingRooms.set(MyflueID, MyRoom)//把房间放进等候室
    }
    WaitingRooms.forEach((val, key) => {
        if (val.links.size < maxmember) {//如果等候室有房间，就加入一个房间
            val.links.add(ws);
            MyRoom = val;
            MyRoom.playerstate[MyflueID] = 0
            var outmsg = { code: 'sys', data: `你的房间号: ${key}` }
            ws.send(JSON.stringify(outmsg))
            let outmsg={code:'join',data:MyflueID}
            MyRoom.links.forEach((client)=>{
                if(client!==ws && client.readyState===WebSocket.OPEN){
                    client.send(outmsg)
                }
            })
            // ws.send(`你的房间号: ${key}`, (err) => {
            //     if (err) { console.log(`[SERVER] error: ${err}`); }
            // });
            if (val.links.size >= maxmember) {//把满的房间从等候室放到游戏室
                GamingRooms.set(key, val)
                WaitingRooms.delete(key)
            }
            return
        }
    })
    console.log(`${new Date()}
    [SERVER]当前等待房间数：${WaitingRooms.size}  游戏房间数：${GamingRooms.size}`)

    ws.on('message', function (message) {
        console.log(`[SERVER] Received [${MyflueID}]: ${message}`);
        var inmsg = JSON.parse(message)
        switch (inmsg.code) {
            case 'ready0': {
                MyRoom.playerstate[MyflueID] = 0
                var outmsg = { code: 'pool', data: MyRoom.tetris_20 }
                ws.send(JSON.stringify(outmsg))
                break
            }
            case 'ready1': {
                MyRoom.playerstate[MyflueID] = 1
                var outmsg = { code: 'start' }
                ws.send(JSON.stringify(outmsg))
                break
            }
            case 'score': {
                MyRoom.playerstate[MyflueID] = 2
                MyRoom.links.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(message)
                    }
                })
            }
            case 'update': {
                MyRoom.links.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(message)
                    }
                })
            }
            case 'fail': {
                MyRoom.playerstate[MyflueID] = 9
                MyRoom.links.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(message)
                    }
                })
                let i = 0; let win;
                MyRoom.playerstate.forEach((val, key) => {
                    if (val !== 9) { i++; win = key; }
                })
                switch (i) {
                    case 1: {
                        let outmsg = { code: 'win', data: win }
                        MyRoom.links.forEach((client) => {
                            if (client !== ws && client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify(outmsg))
                            }
                        })
                        break
                    }
                }
            }
            default: { break }
        }
    })

    ws.on('close', function (close) {
        MyRoom.playerstate[MyflueID] = 9
        console.log(`connection lost: ${close}`)
        var outmsg = { code: 'off', data: MyflueID }
        MyRoom.links.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(outmsg))
            }
        })
        let i = 0; let win;
        MyRoom.playerstate.forEach((val, key) => {
            if (val !== 9) { i++; win = key; }
        })
        switch (i) {
            case 1: {
                let outmsg = { code: 'win', data: win }
                MyRoom.links.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(outmsg))
                    }
                })
                break
            }
            case 0: {
                let outmsg = { code: 'end' }
                MyRoom.links.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(outmsg))
                    }
                })
                break
            }
        }
        if(MyRoom.links.size===0){
            GamingRooms.delete(MyRoom.RoomNo)
            console.log(`${new Date()}[SERVER]游戏房间数-1 
            [SERVER]当前等待房间数：${WaitingRooms.size}  游戏房间数：${GamingRooms.size}`)
        }
    })
});