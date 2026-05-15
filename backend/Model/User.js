const mongoose = require("mongoose")
const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  name: String,
  email: String,
  phone: String,
  photo: String,
  password: String,
  friends: { type: [String], default: [] },
  subscription: {
    plan: { type: String, enum: ["free", "bronze", "silver", "gold"], default: "free" },
    expiresAt: Date,
    tweetLimit: { type: Number, default: 1 }
  },
  loginHistory: [{
    ip: String,
    browser: String,
    os: String,
    device: String,
    timestamp: { type: Date, default: Date.now }
  }],
  lastPasswordReset: Date,
  language: { type: String, default: "en" },
  resume: {
    name: String,
    qualification: String,
    experience: String,
    personalDetails: String,
    photo: String,
    createdAt: Date
  },
  createdAt: { type: Date, default: Date.now }
})
module.exports = mongoose.model("User", UserSchema)
