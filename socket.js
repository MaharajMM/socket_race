const server = require('http').createServer(app);
const io = require('socket.io')(server);

// Create a map of rooms
const rooms = new Map();
const players = {};

io.on('connection', (socket) => {
  console.log('A user connected.');

  socket.on('login', ({ username, password }) => {
    const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.get(sql, [username, password], (err, row) => {
      if (err) {
        console.error(err.message);
        socket.emit('error', 'Internal server error');
      } else if (row) {
        players[socket.id] = row.id;
        socket.emit('login-success', { id: row.id, username: row.username });
      } else {
        socket.emit('login-error', 'Invalid username or password');
      }
    });
  });

  socket.on('signup', ({ username, password }) => {
    const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
    db.run(sql, [username, password], function(err) {
      if (err) {
        console.error(err.message);
        socket.emit('error', 'Internal server error');
      } else {
        players[socket.id] = this.lastID;
        socket.emit('signup-success', { id: this.lastID, username });
      }
    });
  });

  socket.on('create-room', () => {
    const roomId = uuidv4(); // Generate a unique room ID using the uuid package
    rooms.set(roomId, new Set([socket.id])); // Add the room ID to the map of rooms and add the first player to the set of players in the room
    socket.emit('room-created', { roomId });
  });

  socket.on('join-room', ({ roomId }) => {
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      if (room.size < 2) { // Check if there is only one player in the room
        room.add(socket.id); // Add the second player to the set of players in the room
        socket.join(roomId); // Join the socket to the room
        socket.emit('join-success', Array.from(room)); // Send the list of player IDs in the room to the client
        io.to(roomId).emit('start-game'); // Send a start-game event to all sockets in the room
      } else {
        socket.emit('room-full');
      }
    } else {
      socket.emit('room-not-found');
    }
  });

  socket.on('answer', ({ roomId, questionId, choice }) => {
    // Check if the socket is in the correct room before processing the answer
    if (socket.rooms.has(roomId)) {
      const sql = 'SELECT answer FROM questions WHERE id = ?';
      db.get(sql, [questionId], (err, row) => {
        if (err) {
          console.error(err.message);
          socket.emit('error', 'Internal server error');
        } else if (row && row.answer === choice) {
          socket.emit('answer-result', { correct: true });
        } else {
          socket.emit('answer-result', { correct: false });
        }
      });
    }
  });

  socket.on('disconnecting', () => {
    // Remove the socket from any rooms it was in
    for (const roomId of socket.rooms) {
      if (rooms.has(roomId)) {
        const room = rooms.get(roomId);
        room.delete(socket.id);
        if (room.size === 0) { // Remove the room if there are no players in it
          rooms.delete(roomId);
        } else { // Send a player-disconnected event to the other socket in the room
          socket.to(roomId).emit('player-disconnected', { playerId: socket.id });
        }
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected.');
    delete players[socket.id];
  });
});

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}.`);
});
