import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    name: String,
    role: { type: String, enum: ["admin", "analyst", "viewer"], default: "viewer" },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
