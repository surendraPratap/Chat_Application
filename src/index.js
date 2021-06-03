const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words');
const app = express()
const server = http.createServer(app)
const io = socketio(server)
const { generateMessage, generateLocationMessage } = require('./utils.js/messages')
const {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
} = require('./utils.js/user')
const port = process.env.PORT || 4000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

// let count = 0;

io.on('connection', (socket) => {
    console.log('New Web Socket connection Stablish')

    socket.on('join', ({ username, room }, callback) => {

        //adding the user
        const { error, user } = addUser({ id: socket.id, username, room })
        if (error) {
            return callback(error);
        }

        socket.join(room);

        // console.log(user);
        socket.emit('Welcome', generateMessage('Admin', `Welcome ${user.username}`));
        socket.broadcast.to(user.room).emit('Welcome', generateMessage('Admin', `${user.username} has joined the room`));
        // io.to.emit() =>msg to other in current room except current person
        // socket.emit =>taking to server
        // io.emit =>mesg to all except current user
        //socket.broadcast.emit => msg to other for joining of new user
        // socket.broadcast.to.emit=> msg to other for joining new user in current room
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback();
    })

    //message received from client
    socket.on('message', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter();
        if (filter.isProfane(message)) {
            return callback('No allowed');
        }

        io.to(user.room).emit('Welcome', generateMessage(user.username, message)) //message send back to client log
        callback(message)
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('Welcome', generateMessage('Admin', `${user.username} has left!`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

    })
    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, 'https://google.com/maps?q=${location.latitude},${location.longitude}'))
        callback();
    })

    // socket.on('increment', () => {
    //     count++
    //     // socket.emit('countUpdated', count);
    //     io.emit('countUpdated', count)
    // })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})