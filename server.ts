import app from "./src/app";
import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import User from "./src/models/User";

const port = process.env.PORT || 8000;
const DB = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_CLUSTERNAME}.mongodb.net/?retryWrites=true&w=majority`;
mongoose
  .connect(DB)
  .then(() => console.log("DB connection is successful"))
  .catch((err) => console.log(err));

process.on("uncaughtException", (err) => {
  console.log(err);
  process.exit(1);
});

const server = http.createServer(app);
server.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}!`);
});

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000/",
    methods: ["GET", "POST"],
  },
});

io.on("connection", async (socket) => {
  const userId = socket.handshake.query["user-id"];
  console.log(`User Connected: ${socket.id}`);
  if (userId) {
    await User.findByIdAndUpdate(userId, {
      socketId: socket.id,
    });
  }
  socket.on("friend-request", async (data: { to: string }) => {
    const to = await User.findById(data.to);
    // TODO: Create friend request
    io.to(to.socketId).emit("new-friend-request", {});
  });
});

process.on("unhandledRejection", (err) => {
  console.log(err);
  server.close(() => process.exit(1));
});
