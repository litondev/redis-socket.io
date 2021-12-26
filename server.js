const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

const io = new Server(server,{pingTimeout: 300000, pingInterval: 300000});

const pubClient = createClient({ host: "localhost", port: 6378 });
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get("/abc",(req,res) => {
    res.sendFile(__dirname + '/id-abc.html');
});

app.get("/abcd",(req,res) => {
    res.sendFile(__dirname + '/id-abcd.html');
});

io.use(async (socket, next) => {    
    if(!(socket.handshake.headers.id != "abc" || socket.handshake.headers.id != "abcd")){
        next(new Error("unauthorized"));
    }else{        
        // console.log("Next")
        next()
    }

    // try {
        // const user = await fetchUser(socket);
        // socket.user = user;
    // } catch (e) {
        // next(new Error("unauthorized"));
    // }
});

io.on('connection', (socket) => {    
    // console.log('a user connected');
    socket.on("server.message",(data) => {
        // message from client =>
        // console.log(data);

        // send message to all client connect in socket 
        io.emit("client.message",data);
    });

    // console.log(socket.id);

    socket.join("client-"+socket.handshake.headers.id);   

    socket.on("server.chat",(data) => {
        // rooms of user =>
        // console.log(socket.rooms);

        // will be send data to all user in the room exlude the sender
        // socket.to("client-"+socket.handshake.headers.id)emit("client.chat",data);

        // will be send data to all user in the room include the sender
        io.to("client-"+socket.handshake.headers.id).emit("client.chat",data);
    })

    // socket.on('disconnect', () => {    
    //     console.log('user disconnected');  
    // });
});

// check all rooms avaliable =>
setInterval(() => {
    console.log(io.sockets.adapter.rooms)
},1000);

// server.listen(3000, () => {
//     console.log('listening on *:3000');
// });

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {  
    server.listen(3000);
    console.log("Listening on *:3000")
}).catch(err => {
    console.log("Something Wrong")
})