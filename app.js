"use strict"

const maxmember = 2;
var WaitingRooms = new Map();
var GamingRooms = new Map();
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;
const wss = new WebSocketServer({
    port: 3005
})
console.log(`[SERVER]waiting for connections...... || ${new Date()}`)
wss.on('connection', function (ws, req) {
    console.log(`[SERVER] [${req.headers.flueid}]已连接 || ${new Date()}`);
    var MyRoom;
    var MyflueID = req.headers.flueid;
    if (WaitingRooms.size === 0) {//如果等候室没有房间，就创建一个新房间
        MyRoom = {
            gamers: req.headers.gamers,
            tetris_20: new Array(),
            RoomNo: MyflueID,
            gametime: 0,
            gamestate: 0,
            playerstate: new Map(),
            links: new Set()
        }
        var i = 0; while (i < 20) { MyRoom.tetris_20.push(parseInt(Math.random() * 8)); i++; } i = null;
        WaitingRooms.set(MyflueID, MyRoom)//把房间放进等候室
        console.log(`[SERVER]房间[${MyflueID}]已创建 || ${new Date()}`)
        
    }
    WaitingRooms.forEach((val, key) => {
        if (val.links.size < val.gamers) {//如果等候室有房间，就加入一个房间
            val.links.add(ws);
            MyRoom = val;
            MyRoom.playerstate[MyflueID] = 0
            console.log(`[SERVER]房间[${MyRoom.RoomNo}]等待中，目前人数 ${val.links.size}/${val.gamers} || ${new Date()}`)
            let outmsg = { code: 'sys', data: `你的房间号: ${key}` }
            ws.send(JSON.stringify(outmsg))
            outmsg = { code: 'join', data: MyflueID }
            MyRoom.links.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(outmsg))
                }
            })
            // ws.send(`你的房间号: ${key}`, (err) => {
            //     if (err) { console.log(`[SERVER] error: ${err}`); }
            // });
            if (val.links.size >= maxmember) {//把满的房间从等候室放到游戏室
                GamingRooms.set(key, val)
                WaitingRooms.delete(key)
                console.log(`[SERVER]房间[${MyRoom.RoomNo}]准备开始 || ${new Date()}`)
            }
            return
        }
    })
    console.log(`[SERVER]当前等待房间数：${WaitingRooms.size}  游戏房间数：${GamingRooms.size} || ${new Date()}`)

    ws.on('message', function (message) {
        console.log(`[SERVER] Received [${MyflueID}]: ${message}  || ${new Date()}`);
        var inmsg = JSON.parse(message)
        switch (inmsg.code) {
            case 'ready0': {
                MyRoom.playerstate[MyflueID] = 0
                let outmsg = { code: 'pool', data: MyRoom.tetris_20 }
                ws.send(JSON.stringify(outmsg))
                break
            }
            case 'ready1': {
                MyRoom.playerstate[MyflueID] = 1
                if (MyRoom.links.size == MyRoom.gamers) {
                    let m = true;//满人时
                    MyRoom.playerstate.forEach((val, key) => {//如果所有人都准备好，就开始游戏
                        if (val !== 1) { m = false }
                    })
                    if (m) {
                        console.log('aka4')
                        let outmsg = { code: 'start' }
                        MyRoom.links.forEach((client) => {
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify(outmsg))
                            }
                        })
                    }
                }
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
        MyRoom.links.delete(ws)
        console.log(`[SERVER][${MyflueID}]失去连接 || ${new Date()}`)
        console.log(`[SERVER]房间[${MyRoom.RoomNo}]等待中，目前人数 ${MyRoom.links.size}/${MyRoom.gamers} || ${new Date()}`)
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
        if (MyRoom.links.size === 0) {
            WaitingRooms.delete(MyRoom.RoomNo)
            GamingRooms.delete(MyRoom.RoomNo)
            console.log(`[SERVER]当前等待房间数：${WaitingRooms.size}  游戏房间数：${GamingRooms.size} || ${new Date()}`)
        }
    })
});