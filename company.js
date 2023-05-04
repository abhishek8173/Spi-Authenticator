import mongoose from "mongoose";

const companySchema = mongoose.Schema({
  user: String,
  orgName: String,
  position: String,
  email: String,
  password: String,
  verified: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.model("companyAuth", companySchema);
