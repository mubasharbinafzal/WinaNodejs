const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const dotenv = require("dotenv").config();
const passport = require("passport");
const MongoStore = require("connect-mongo")(session);
const cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");
const async = require("async");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const socketio = require("socket.io");
const http = require("http");
var cors = require("cors");
const app = express();
const server = http.createServer(app);

const notificationService = require("./socket.io/notifications");
app.use(cors());

//// Body Parser Middleware ////
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//// Cookie Parser ////

app.use(cookieParser());

//// PUBLIC Folrders Configuartion ////

app.use("/assets", express.static("assets"));
app.use("/views", express.static("views"));

// socket io connection
const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

//// Sessions Middleware ////

app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
  })
);

//// DataBase Connection ////

mongoose
  .connect(process.env.Database_URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("Database has connected successfully");
  })
  .catch((err) => {
    console.log(err);
  });

// Initializing Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

//// Routes ////
const auth = require("./routes/auth");
const student = require("./routes/student");
const company = require("./routes/company");
const studentConsultant = require("./routes/studentConsultant");
const companyConsultant = require("./routes/companyConsultant");
const profile = require("./routes/profile");
const admin = require("./routes/admin");
const job = require("./routes/job");
const FileUpload = require("./routes/FileUpload");

//// Mount Routers ////

app.use("/api/v1/auth", auth);
app.use("/api/v1/student", student);
app.use("/api/v1/company", company);
app.use("/api/v1/student-consultant", studentConsultant);
app.use("/api/v1/company-consultant", companyConsultant);
app.use("/api/v1/profile", profile);
app.use("/api/v1/admin", admin);
app.use("/api/v1/job", job);
app.use("/api/v1", FileUpload);

// app.use("/api/v1/admin", admin);

//// Error Handler
app.use((error, req, res, next) => {
  console.log("Main Error =>", error);
  const message = error.message;
  const status = error.status || 500;
  res.status(status).json({ message: message, error: error });
});
//// Setting Port for Server ////

//// Setting Port for Server ////
const PORT = 9190 || process.env.PORT;
server.listen(PORT, () => {
  console.log(`Server listening to port ${PORT}`);
});

// Socket configuration //
io.on("connection", (socket) => {
  console.log("Connected");

  socket.on("sendnotification", (data) => {
    //console.log(data, "data dash");
    socket.broadcast.emit("sendnotification", data);
  });
  // logInfo.info(
  //   "Connection Established ",
  //   socket.id,
  //   " accepted at ",
  //   new Date().toJSON()
  // );
  exports.socket = { socket, io };
  var useris = socket.handshake.query.userConnectionId;
  socket.join(useris);
  //Leave the room if the user closes the socket
  socket.on("disconnect", () => {
    socket.leave(useris);
  });

  // for dynamic notifications
  var recieverId = socket.handshake.query.recieverId;
  socket.on(`sendNotification`, (data) => {
    // logic to save notifications in our db
    notificationService
      .addNotifcation({
        id: data.id,
        title: data.title,
        message: data.message,
      })
      .then((message) => {
        socket.broadcast.emit(`recieveNotification${data.id}`, {
          title: data.title,
          message: data.message,
        });
      })
      .catch((e) => console.log(e));
  });
});
