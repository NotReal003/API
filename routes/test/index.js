const express = require("express");
const router = express.Router();

// Test route to trigger an error
router.get("/error", (req, res, next) => {
  const error = new Error("This is a test error!");
  error.status = 500; // Optional: Set an HTTP status code for the error
  next(error); // Pass the error to the error handler
});

module.exports = router;
