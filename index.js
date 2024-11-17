const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const path= require('path');
const { Server } = require("socket.io");
const io = new Server(server);


app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.set("view engine" , "ejs" );
app.use(express.static(path.join(__dirname,"public")));

app.get('/',(req,res)=>{
    res.render("start");
});

app.post("/home",(req,res)=>{
    const usrnm = req.body.name;
    res.render("home",{usrnm});
});



io.on('connection',(socket)=>{

    console.log('user connected');

    socket.on('chat message',(msg)=>{
        io.emit('chat message', msg);
        // console.log('message: ' + msg);
    });


    socket.on('user-joined',(name)=>{

        io.emit('user-connected',`${usrnm} has joined`);
    })
    

    socket.on('disconnect',()=>{
        // console.log('user disconnected');
    console.log('user disconnected');

        io.emit('user-disconnected',`${usrnm} has left`);
    })
});





server.listen(3000,()=>{
    console.log('listening on *:3000');
})

