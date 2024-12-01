const express = require("express");
const mongoose = require("mongoose");
const baseRouter = require("./routes/base-router");
const { authMiddleware, notFoundHandler } = require("./middlewares/base-middleware");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(
  cors({
    credentials: true,
    origin: "https://request.notreal003.xyz",
  }),
);
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);
app.use("/", baseRouter);
app.use(notFoundHandler);

app.get("/code", (req, res) => {
  res.redirect('https://github.com/NotReal003/API');
});

const PORT = process.env.PORT || 3001;

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI required in .env");
}

mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log("Connected to database.");

  // Ensure indexes are created
  mongoose.connection.db
    .collection("users")
    .createIndex({ id: 1 }, { unique: true })
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Listening on port ${PORT}`);
      });
    });
});
