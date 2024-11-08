const express = require("express");
const mongoose = require("mongoose");
const baseRouter = require("./routes/base-router");
const baseMiddleware = require("./middlewares/base-middleware");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(
  cors({
    credentials: true,
    origin: "https://request.notreal003.xyz",
    allowedHeaders: ["Authorization", "Content-Type"],
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(baseMiddleware);
app.use("/", baseRouter);
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
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
