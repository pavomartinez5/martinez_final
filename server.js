//---------Import packages and modules------------------
require("dotenv").config(); //Import .env file
const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");

//---------Import custom packages and modules-----------
const corsOptions = require("./config/corsOptions");
const mongoose = require("mongoose");
const connectDB = require("./config/dbConn");

//---------Define port for webserver--------------------
const PORT = process.env.PORT || 3500;

//-------------Connect to MongoDB-----------------------
connectDB();

//---------Middleware------------------------------------
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use("/", express.static(path.join(__dirname, "/public")));

//---------Import Routes------------------------------------
app.use("/", require("./routes/root"));
app.use("/states", require("./routes/api/states")); //API

//-----------Redirect all incorrect traffic--------------
app.all(/.*/, (req, res) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html"));
  } else if (req.accepts("json")) {
    res.json({ error: "404 Not Found" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});

//---------Listening sever-------------------------------
mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
