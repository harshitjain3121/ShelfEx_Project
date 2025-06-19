const { Schema, model } = require("mongoose");

const userSchema = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  profilePhoto: {
    type: String,
    default: "https://res.cloudinary.com/dojycmppc/image/upload/v1746956414/Sample_User_Icon_dsqjia.png"
  },
  bio: { type: String, default: "No bio yet" },
  role: { type: String, enum: ["Celebrity", "Public"], default: "Public" },
  followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: Schema.Types.ObjectId, ref: "User" }],
  posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
  notifications: [{
    type: {
      type: String,
      enum: ["new_post", "follow", "like"],
      required: true
    },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    post: { type: Schema.Types.ObjectId, ref: "Post" },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = model("User", userSchema);
