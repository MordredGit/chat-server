import http from "http";
import mongoose from "mongoose";
import path from "path";
import { Server } from "socket.io";

import app from "./src/app";
import FriendRequest from "./src/models/FriendRequest";
import OneToOneMessage from "./src/models/OneToOneMessage";
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
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", async (socket) => {
  // console.log(socket.handshake.query);

  const userId = socket.handshake.query["userId"];
  console.log(`User ${userId} Connected: ${socket.id}`);
  if (userId) {
    await User.findByIdAndUpdate(userId, {
      socketId: socket.id,
      status: true,
    });
  }
  socket.on("friend-request", async (data: { to: string; from: string }) => {
    const to = await User.findById(data.to).select("socketId");
    const from = await User.findById(data.from).select("socketId");
    // const from = socket.id; <- TODO: Check if possible
    console.log("to: ", to, " and from: ", from);

    const friendRequest = await FriendRequest.create({
      sender: from,
      recipient: to,
    });
    await friendRequest.save();

    io.to(to.socketId).emit("new-friend-request", {
      status: "success",
      message: "New Friend Request received!",
    });
    io.to(from.socketId).emit("request-sent", {
      message: "Request sent successfully!",
    });
  });

  socket.on("accept-request", async (data: { requestId: string }) => {
    console.log(data);
    const request = await FriendRequest.findById(data.requestId);
    console.log(request);

    const sender = await User.findById(request.sender);
    const recipient = await User.findById(request.recipient);

    sender.friends.push(request.recipient);
    recipient.friends.push(request.sender);

    await sender.save({ validateModifiedOnly: true });
    await recipient.save({ validateModifiedOnly: true });

    await FriendRequest.findByIdAndDelete(data.requestId);

    io.to(sender.socketId).emit("request-accepted", {
      status: "success",
      message: "You and " + recipient.firstName + " are now friends",
    });

    io.to(recipient.socketId).emit("request-accepted", {
      status: "success",
      message: "You and " + sender.firstName + " are now friends",
    });
  });

  // For text and link messages
  socket.on("text-message", (data: {}) => {
    console.log("Received message: ", data);
  });
  // For image and document messages
  socket.on("file-message", (data: { file: File }) => {
    console.log("Received message: ", data);

    const fileExt = path.extname(data.file.name);

    const uniqFileName = `${Date.now()}_${Math.floor(
      Math.random() * 100000
    )}${fileExt}`;

    // Upload data to s3
  });

  socket.on(
    "get-indiv-conv",
    async (
      { userId }: { userId: mongoose.Types.ObjectId },
      callback: Function
    ) => {
      const existingConversations = await OneToOneMessage.find({
        participants: { $all: [userId] },
      }).populate("participants", "_id firstName lastName email status avatar");
      callback(existingConversations);
    }
  );

  socket.on(
    "start-conversation",
    async ({
      to,
      from,
    }: {
      to: mongoose.Types.ObjectId;
      from: mongoose.Types.ObjectId;
    }) =>
      // callback: Function
      {
        const existingConversations = await OneToOneMessage.find({
          participants: { $all: [to, from], $size: 2 },
        }).populate(
          "participants",
          "_id firstName lastName email status avatar"
        );

        if (existingConversations.length === 0) {
          let newConversation = OneToOneMessage.create({
            participants: [to, from],
          });
          newConversation = (await newConversation).populate(
            "participants",
            "_id firstName lastName email status avatar"
          );
          console.log("New Conversation: ", await newConversation);
          socket.emit("new-conversation", await newConversation);
        } else {
          console.log("Existing Conversation: ", existingConversations[0]);
          socket.emit("new-conversation", existingConversations[0]);
        }
        // callback(existingConversations);
      }
  );

  socket.on("end", async (data: { userId: string }) => {
    if (data.userId) {
      await User.findByIdAndUpdate(userId, {
        status: false,
      });
    }
    console.log("Closing connection");
    socket.disconnect();
  });
});

process.on("unhandledRejection", (err) => {
  console.log(err);
  server.close(() => process.exit(1));
});
