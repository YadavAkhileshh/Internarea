const bodyparser = require("body-parser");
const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { connect } = require("./db");
const router = require("./Routes/index");
const port = 5000;

var server = http.createServer(app);
var io = new Server(server, { cors: { origin: "*" } });
app.set("io", io);

app.use(cors());
app.use(bodyparser.json({ limit: "50mb" }));
app.use(bodyparser.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("hello this is internshala backend");
});
app.use("/api", router);
connect();
app.use((req, res, next) => {
  req.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

io.on("connection", (socket) => {
  socket.on("disconnect", () => {});
});

server.listen(port, () => {
  console.log(`Server is running on the port ${port}`);
});
