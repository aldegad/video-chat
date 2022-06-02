"use strict";

var _http = _interopRequireDefault(require("http"));

var _socket = require("socket.io");

var _express = _interopRequireDefault(require("express"));

var _livereload = _interopRequireDefault(require("livereload"));

var _connectLivereload = _interopRequireDefault(require("connect-livereload"));

var _adminUi = require("@socket.io/admin-ui");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/** set express */
var app = (0, _express["default"])();
/** live reload */

var liveReloadServer = _livereload["default"].createServer();

liveReloadServer.server.once("connection", function () {
  return setTimeout(function () {
    return liveReloadServer.refresh("/");
  }, 100);
});
app.use((0, _connectLivereload["default"])());
/** pug view engine */

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", _express["default"]["static"](__dirname + "/public"));
/** router */

app.get("/", function (req, res) {
  return res.render("home");
});
app.get("/*", function (req, res) {
  console.log('hello');
  res.redirect("/");
});
/** create http server */

var httpServer = _http["default"].createServer(app);
/** create io server */


var wsServer = new _socket.Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true
  }
});
(0, _adminUi.instrument)(wsServer, {
  auth: false
});
wsServer.on("connection", function (socket) {
  socket.on("join_room", function (room, id) {
    socket.join(room);
    console.log(wsServer.adapter);
    socket.to(room).emit("welcome", id);
  });
  socket.on("offer", function (offer, room, newbieID, offersId) {
    socket.to(newbieID).emit("offer", offer, offersId);
  });
  socket.on("answer", function (offer, offersId, newbieId) {
    socket.to(offersId).emit("answer", offer, newbieId);
  });
  socket.on("ice", function (ice, room, othersId, myId) {
    socket.to(othersId).emit("ice", ice, myId);
  });
});
/** open server */

var port = 3000;
httpServer.listen(port, function () {
  console.log("http://localhost:".concat(port));
});