import app from "./src/app";
import http from "http";
import mongoose from "mongoose";

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

process.on("unhandledRejection", (err) => {
  console.log(err);
  server.close(() => process.exit(1));
});
