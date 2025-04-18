const express = require("express");
const mongoose = require("mongoose");
const mainRouter = require("./routes/main-router");
const { authMiddleware, notFoundHandler } = require("./middlewares/middleware");
const errorHandler = require("./middlewares/errorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();
require('./config/passport');
const passport = require('passport');

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true); // Allow all origins
    },
    credentials: true,
  })
);

app.use(cookieParser(process.env.SESSION_SECRET));
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);
app.use("/", mainRouter);
app.use(notFoundHandler);
app.use(errorHandler);
app.use(passport.initialize());
app.use(passport.session());

const PORT = process.env.PORT || 3001;

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI required in .env");
}

mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log("Connected to database.");

  // Ensure indexes made
  mongoose.connection.db
    .collection("users")
    .createIndex({ id: 1 }, { unique: true })
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Listening on port ${PORT}`);
      });
    });
});
