const mongoose = require("mongoose");

const mongoURI =
  "mongodb+srv://nexsolvesolutions:34598345790237598714327534@cluster0.ecnexqv.mongodb.net?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(mongoURI);

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB successfully!");
});

module.exports = db;
