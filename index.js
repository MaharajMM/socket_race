//-------------------------------------------------------------------------------------------------------------------
const db = require("./database");

const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
//app.use(cors());

const server = require("http").createServer(app);
const io = require("socket.io")(server);

// Create a map of rooms
const rooms = new Map();
const players = {};

io.on("connection", (socket) => {
  console.log(`A user ${socket.id} connected.`);

  let roomId;
  let userCount;
  // let user;
  let user1;
  let user2;

  // socket.on("score", (data) => {
  //   console.log(data["user1"]);
  //   if (data["user1"]) {
  //     user1++;
  //   } else {
  //     user2++;
  //   }
  //   socket.emit("score", { user1, user2 });
  // });

  // socket.emit("message", "Hello from server!");

  // socket.on("very", () => {
  //   console.log("2nd page loaded");
  //   socket.emit("okmessage", "Hello!");
  // });

  //io.socket.in(roomId).emit("question", questions[currentIndex]);

  // Handle the "join room" request
  socket.on("join-room", (data) => {
    // Find an available room with space for the user
    db.get(
      "SELECT id, uuid, member_count FROM rooms WHERE member_count < max_members LIMIT 1",
      (err, row) => {
        if (err) {
          console.error(err);
          return;
        }
        // If there's an available room, join the user to that room
        if (row) {
          roomId = row.id;
          const roomUuid = row.uuid;
          userCount = row.member_count + 1;
          socket.join(roomUuid);
          user = false;

          // Increment the member count of the room
          db.run(
            "UPDATE rooms SET member_count = member_count + 1 WHERE id = ?",
            [roomId],
            (err) => {
              if (err) {
                console.error(err);
                return;
              }
            }
          );
          user2 = socket.id;
          console.log(`User2 ${user2} joined room ${roomUuid}`);
          socket.emit("room-joined", { roomId, roomUuid });
          console.log(`User count: ${userCount}`);
          socket.emit("userCount", userCount);
          socket.on("answered", (data) => {
            console.log(`Client ${socket.id} answered the question`);
            //console.log(`Data ${data["userAnswer"]} answered the question`);
            data.socketId = socket.id;
            data.user = "user2";

            //data["user"] = false;

            io.to(roomUuid).emit("answered", data);
          });
          //socket.emit("user", user);

          // If the room is now full, start the quiz and set a timeout to delete the room if the quiz doesn't start
          if (userCount === 2) {
            io.to(roomUuid).emit("navigateToNextScreen");

            setTimeout(() => {
              db.run("DELETE FROM rooms WHERE uuid = ?", [roomUuid], (err) => {
                if (err) {
                  console.error(err);
                  return;
                }
                rooms.delete(roomUuid);
                console.log(`Room ${roomUuid} deleted due to timeout`);
              });
            }, 100000);
          }
        } else {
          // If there are no available rooms, create a new room with a new UUID
          const newUuid = uuidv4(); // You need to implement the `generateUuid` function
          db.run(
            "INSERT INTO rooms (uuid) VALUES (?)",
            [newUuid],
            function (err) {
              if (err) {
                console.error(err);
                return;
              }

              roomId = this.lastID;
              const roomUuid = newUuid;
              userCount = 1;
              socket.join(roomUuid);
              user = true;
              db.run(
                "UPDATE rooms SET member_count = member_count + 1 WHERE id = ?",
                [roomId],
                (err) => {
                  if (err) {
                    console.error(err);
                    return;
                  }
                  rooms.set(roomUuid, [socket]);
                  user1 = socket.id;
                  console.log(
                    `User1 ${user1} created and joined room ${roomUuid}`
                  );
                  console.log(`User count: ${userCount}`);
                  socket.emit("room-joined", { roomId, roomUuid });
                  socket.emit("userCount", userCount);
                  //socket.emit("user", user);
                }
              );
            }
          );
          socket.on("answered", (data) => {
            console.log(`Client ${socket.id} answered the question`);
            //console.log(`Data ${data["userAnswer"]} answered the question`);

            data.socketId = socket.id;
            data.user = "user1";
            //data["user"] = true;
            // Broadcast the "answered" event to all connected clients except the sender
            io.to(newUuid).emit("answered", data);
          });
        }
      }
    );
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected.");
    //delete players[socket.id];
  });
});

server.listen(process.env.PORT || 3000, () =>
  console.log(`Server has started.`)
);

//--------------------------------------------------------------------------------------------------------------------------
