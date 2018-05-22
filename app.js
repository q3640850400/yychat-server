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

/*
 *文件输入输出
 */
const fs = require('fs');

/*
 *数据库连接
 */
const mysql = require('mysql');
var connection = mysql.createConnection({
    host: '172.21.0.7',
    port: '12315',
    // host: 'localhost',
    // port: '3306',
    user: 'root',
    password: 'Yggzs@2018',
    database: 'yychat'
});
connection.connect();
// connection.query("insert into user_information(name,password,create_time) values ('gg','44',now())", function(error, results, fields) {
// connection.query('delete from chat_logs', function(error, results, fields) {});
// connection.query("select * from user_information", function(error, results, fields) {
//每分钟把记录写入数据库
setInterval(function() {
    try {

        var d = new Date();
        var fulldate = d.getFullYear() + '_' + (d.getMonth() + 1) + '_' + d.getDate();
        fs.readFile('chatlogs/' + fulldate + '.txt', function(err, data) {
            connection.query("select * from chat_logs where date=?", [
                    [fulldate]
                ], function(error, results, fields) {
                    if (results.length == 0) {
                        connection.query("insert into chat_logs(date,logs,tag) values (?)", [

                            [fulldate, data, 'test']
                        ], function(error, results, fields) {

                            if (error) { throw error; }
                            //console.log('The results is: ', results);
                        })
                    } else {
                        connection.query("update chat_logs set logs=? where date=?", [
                            [data],
                            [fulldate]
                        ], function(error, results, fields) {})
                    }
                })
                // connection.query("insert into chat_logs(date,logs,tag) values (?)", [

            //     [fulldate, data, 'test']
            // ], function(error, results, fields) {

            //     if (error) { throw error; }
            //     //console.log('The results is: ', results);
            // })
        });

    } catch (err) {
        console.log(err);
    }

}, 60000);



/*
 *服务器代码
 */
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

                        // 写入临时文件
                        var d = new Date();
                        var fulldate = d.getFullYear() + '_' + (d.getMonth() + 1) + '_' + d.getDate();
                        fs.appendFile('chatlogs/' + fulldate + '.txt', inmsg.data, function(err, fd) {
                            if (err) {
                                return console.error(err);
                            }
                        });
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