const mongoose = require("mongoose");
const ResultSchema = new mongoose.Schema({
  categoryname: String,
  date: String,
  result: [
    {
      time: String,
      date: String,
      number: String,
    },
  ],
  number: String || Number,
  next_result: String,
  mode: String,
});

// Create a Model
const Result2 = mongoose.model("ResultScrapper", ResultSchema);

module.exports = Result2;
