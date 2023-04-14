
//-------------------------------------------------------------------------------------------------------------------
const db = require('./database');

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors())

const server = require('http').createServer(app);
const io = require('socket.io')(server);

// Create a map of rooms
const rooms = new Map();
const players = {};

io.on('connection', (socket) => {
  console.log(`A user ${socket.id} connected.`);

//   socket.on('room-created', () => {
//     const roomId = uuidv4(); // Generate a unique room ID using the uuid package
//     rooms.set(roomId, new Set([socket.id])); // Add the room ID to the map of rooms and add the first player to the set of players in the room
//     socket.emit('room-created', { roomId });
//   });

  // Handle the "join room" request
    socket.on('join-room', (data) => {
    // Find an available room with space for the user
    db.get('SELECT id, uuid, member_count FROM rooms WHERE member_count < max_members LIMIT 1', (err, row) => {
      if (err) {
        console.error(err);
        return;
      }
  
      // If there's an available room, join the user to that room
      if (row) {
        const roomId = row.id;
        const roomUuid = row.uuid;
        const member_count = row.member_count;
        
  
        // Increment the member count of the room
        db.run('UPDATE rooms SET member_count = member_count + 1 WHERE id = ?', [roomId], (err) => {
          if (err) {
            console.error(err);
            return;
          }
  
          // Join the user to the room
          socket.join(roomUuid);
          //member_count++ ;

          // If the room is now full, start the quiz and set a timeout to delete the room if the quiz doesn't start
        if (member_count + 1 === 2) {
            io.to(roomUuid).emit('start-quiz');
            setTimeout(() => {
                db.run('DELETE FROM rooms WHERE uuid = ?', [roomUuid], (err) => {
                  if (err) {
                    console.error(err);
                    return;
                  }
                  rooms.delete(roomUuid);
                  console.log(`Room ${roomUuid} deleted due to timeout`);
                });
              }, 60000);
            //timeouts.set(roomUuid, timeoutId);
          }
          
          socket.emit('room-joined', { roomId, roomUuid });
        });
      } else {
        // If there are no available rooms, create a new room with a new UUID


        const newUuid = uuidv4(); // You need to implement the `generateUuid` function
        db.run('INSERT INTO rooms (uuid) VALUES (?)', [newUuid], function(err) {
          if (err) {
            console.error(err);
            return;
          }
          
  
          const roomId = this.lastID;
          const roomUuid = newUuid;
          //const member =
          db.run('UPDATE rooms SET member_count = member_count + 1 WHERE id = ?', [roomId], (err) => {
            socket.join(roomUuid);
         // member_count++;
          socket.emit('room-joined', { roomId, roomUuid });
          });
          // Join the user to the new room
          
        });
        
      }
    });
    // db.all('SELECT * FROM questions ORDER BY RANDOM() LIMIT 10', (err, rows) => {
    //     if (err) {
    //       console.error(err.message);
    //       return;
    //     }
  
    //     socket.emit('startQuiz', rows);
    //   });
  });

  socket.emit('message', 'Hello from server!');

  // Handle the "end quiz" request
// socket.on('end-quiz', (data) => {
//     const roomUuid = data.roomUuid;
  
//     // Delete the room from the database
//     db.run('DELETE FROM rooms WHERE uuid = ?', [roomUuid], (err) => {
//       if (err) {
//         console.error(err);
//         return;
//       }
//       console.log(`Room ${roomUuid} deleted after quiz ended`);
//     });
//   });

//   socket.on('disconnecting', () => {
//     // Remove the socket from any rooms it was in
//     for (const roomId of socket.rooms) {
//       if (rooms.has(roomId)) {
//         const room = rooms.get(roomId);
//         room.delete(socket.id);
//         if (room.size === 0) { // Remove the room if there are no players in it
//           rooms.delete(roomId);
//         } else { // Send a player-disconnected event to the other socket in the room
//           socket.to(roomId).emit('player-disconnected', { playerId: socket.id });
//         }
//       }
//     }
//   });

  socket.on('disconnect', () => {
    console.log('A user disconnected.');
    delete players[socket.id];
  });
});

// server.listen(PORT, () => {
//   console.log(`Listening on port ${PORT}.`);
// });
server.listen(process.env.PORT || 3000,
	() => console.log(`Server has started.`));

//--------------------------------------------------------------------------------------------------------------------------

