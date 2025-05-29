import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "User Name is required"],
      trim: true,
      minLength: 2,
      maxLength: 50,
    },
    lastname: {
      type: String,
      required: [true, "User Surname is required"],
      trim: true,
      minLength: 2,
      maxLength: 50,
    },
    username: {
      type: String,
      required: [true, "User Name is required"],
      unique: true,
      trim: true,
      minLength: 2,
      maxLength: 75,
    },
    email: {
      type: String,
      required: [true, "User Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Please fill a valid email address"],
    },
    password: {
      type: String,
      required: [true, "User Password is required"],
      minLength: 6,
    },
    role: {
      type: String,
      required: [true, "User role is required"],
      enum: ["ADMIN", "USER"],
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
