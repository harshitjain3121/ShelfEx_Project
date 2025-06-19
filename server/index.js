const express = require("express");
const { connect } = require("mongoose");
require("dotenv").config();
const cors = require("cors");
const upload = require("express-fileupload");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const routes = require("./routes/routes");
const { app, server } = require("./socket/socket");

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ extended: true }));
app.use(cors({ credentials: true, origin: ["http://localhost:4175","https://shelf-ex-project.vercel.app"] }));
app.use(upload({ limits: { fileSize: 5 * 1024 * 1024 }, abortOnLimit: true, responseOnLimit: "File too large" }));
app.use("/uploads", express.static("uploads"));
app.use("/api", routes);

// Add a friendly root route
app.get('/', (req, res) => {
  res.send('ShelfEx Social Media API is running!');
});

app.use(notFound);
app.use(errorHandler);

connect(process.env.MONGO_URL)
  .then(() => {
    server.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
