import mongoose from "mongoose";

const candidateSchema = mongoose.Schema({
  name: String,
  email: String,
  password: String,
  linkedin: String,
});

export default mongoose.model("candidateAuth", candidateSchema);
