const mongoose = require("mongoose");

const resultschema = new mongoose.Schema(
  {
    categoryname: { type: String, required: true },
    date: { type: String, required: true },
    result: { type: Array, required: true },
    number: { type: Number, required: true },
    next_result: { type: String, required: true },
    mode: { type: String },
    key: { type: String },
  },
  {
    timestamps: true, // adds createdAt and updatedAt fields automatically
  }
);

const ResultsModel = mongoose.model("Result", resultschema);

module.exports = ResultsModel;
