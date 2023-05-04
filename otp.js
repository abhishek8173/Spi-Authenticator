import mongooose from "mongoose";

const otpSchema = mongooose.Schema(
  {
    email: String,
    otp: String,
  },
  { timestamps: true }
);

otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

export default mongooose.model("otps", otpSchema);
