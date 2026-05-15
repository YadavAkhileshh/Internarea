const mongoose = require("mongoose")
const PostSchema = new mongoose.Schema({
  authorUid: { type: String, required: true },
  authorName: String,
  authorPhoto: String,
  text: String,
  mediaUrl: String,
  mediaType: { type: String, enum: ["image", "video", null], default: null },
  likes: [{ type: String }],
  comments: [{
    uid: String,
    name: String,
    photo: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  shares: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
})
module.exports = mongoose.model("Post", PostSchema)
