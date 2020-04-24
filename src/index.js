const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const chalk = require('chalk');

const {
  generateMessage,
  generateLocationMessage,
} = require('./utils/messages');
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require('./utils/users');

const app = express();
const Server = http.createServer(app);
const io = socketio(Server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');
app.use(express.static(publicDirectoryPath));

// server (emit) -> client (receive) - countUpdated
// client (emit) -> server (receive) - increment

io.on('connection', (socket) => {
  console.log('New WebSocket connection');

  socket.on('join', (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options }); // options -> { username, room }

    if (error) {
      return callback(error);
    }

    socket.join(user.room); // socket.join allows us to join a given chat room and we pass to the name of the room we're trying to join.

    // I used socket.emit to emit it to that particular connection.
    socket.emit('message', generateMessage('Admin', 'Welcome!'));

    // When a user join
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        generateMessage('Admin', `${user.username} has joined!`)
      ); // I used socket.broadcast.emit to emit it to everybody but that particular connection

    // For send something to everyone in that room including the new user
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room),
    }); // This is going to make sure that the client gets all of the necessary data and also adding users.

    callback(); // calling the callback function just for letting the client know that they were able to join here. And calling the function without any arguments which means without an error. ✌

    /** So far I've sent event's from a server to client using three method's 👇
     * socket.emit -> that's send's an event to a specific client.
     * io.emit -> which send's an event to every connected client.
     * socket.broadcast.emit -> which send's an event to every connected client except for this socket.
     *
     * */

    // Now with the introduction of room's I'm going to have two new setup's I'll be using for emitting messages. One is a variation of 'io.emit' and the other is a variation of 'socket.broadcast.emit'. 👇

    // 1. io.to.emit -> it's emit's an event to everybody in a specific room. So that's going to allow us to send a message to everyone in a room without sending it to people in other room's.

    // 2. socket.broadcast.to.emit -> this is sending an event to everyone except for the specific client but it's limiting it to a specific chat room.

    /* So these two 👆 approaches are how we're going to communicate with member's of a specific room. */
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);

    const filter = new Filter(); // for filtering profan languages

    if (filter.isProfane(message)) {
      return callback('Profanity is not allowed!');
    }

    io.to(user.room).emit('message', generateMessage(user.username, message)); // this is going to emit the event every single connection that's currently available.

    callback(); // 'Delivered!'
  });

  socket.on('sendLocation', (coords, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      'locationMessage',
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
      )
    );

    callback(); // 'Shared!'
  });

  // When a user left
  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    // if there is a user then and only then going to send a message 👇
    if (user) {
      io.to(user.room).emit(
        'message',
        generateMessage('Admin', `${user.username} has left!`)
      );

      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room),
      }); // when user's left the client's will notified.
    }
  });
});

Server.listen(port, () => {
  console.log(`Server is up on port: ${chalk.greenBright(port)}!`);
});
