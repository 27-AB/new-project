const mongoose = require("mongoose");

const collegeSchema = new mongoose.Schema({
  name:       { type: String, required: true, unique: true },
  shortName:  { type: String },
  dean:       { type: String },
  established:{ type: Number },
  departments:[String],
  description:{ type: String },
  color:      { type: String, default: "#3b82f6" },
}, { timestamps: true });

const researcherSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  title:      { type: String, default: "Dr." },
  college:    { type: String, required: true },
  department: { type: String },
  email:      { type: String },
  specialization: [String],
  publications: { type: Number, default: 0 },
  activeProjects:{ type: Number, default: 0 },
  bio:        { type: String },
}, { timestamps: true });

module.exports = {
  College:    mongoose.model("College",    collegeSchema),
  Researcher: mongoose.model("Researcher", researcherSchema),
};
