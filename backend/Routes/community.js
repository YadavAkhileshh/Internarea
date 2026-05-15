const express = require("express")
const router = express.Router()
const Post = require("../Model/Post")
const User = require("../Model/User")

router.post("/", async (req, res) => {
  try {
    var { authorUid, authorName, authorPhoto, text, mediaUrl, mediaType } = req.body
    if (!authorUid) return res.status(400).json({ message: "Login required" })

    var user = await User.findOne({ uid: authorUid })
    if (!user) return res.status(404).json({ message: "User not found" })

    var friendCount = user.friends ? user.friends.length : 0
    var maxPosts = 1
    if (friendCount >= 10) {
      maxPosts = 999
    } else if (friendCount >= 2) {
      maxPosts = 2
    }

    var todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    var todayPosts = await Post.countDocuments({
      authorUid: authorUid,
      createdAt: { $gte: todayStart }
    })

    if (todayPosts >= maxPosts) {
      var msg = "You can only post " + maxPosts + " time(s) per day."
      if (friendCount < 2) {
        msg += " Add more friends to post more!"
      }
      return res.status(429).json({ message: msg })
    }

    var post = new Post({
      authorUid, authorName, authorPhoto,
      text: text || "",
      mediaUrl: mediaUrl || "",
      mediaType: mediaType || null
    })
    await post.save()

    var io = req.app.get("io")
    if (io) io.emit("new-post", post)

    res.status(201).json(post)
  } catch (err) {
    res.status(500).json({ message: "Failed to create post" })
  }
})

router.get("/", async (req, res) => {
  try {
    var posts = await Post.find().sort({ createdAt: -1 }).limit(50)
    res.json(posts)
  } catch (err) {
    res.status(500).json({ message: "error" })
  }
})

router.post("/:id/like", async (req, res) => {
  try {
    var { uid } = req.body
    var post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: "Post not found" })

    var idx = post.likes.indexOf(uid)
    if (idx > -1) {
      post.likes.splice(idx, 1)
    } else {
      post.likes.push(uid)
    }
    await post.save()
    res.json(post)
  } catch (err) {
    res.status(500).json({ message: "error" })
  }
})

router.post("/:id/comment", async (req, res) => {
  try {
    var { uid, name, photo, text } = req.body
    var post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: "Post not found" })

    post.comments.push({ uid, name, photo, text })
    await post.save()
    res.json(post)
  } catch (err) {
    res.status(500).json({ message: "error" })
  }
})

router.post("/:id/share", async (req, res) => {
  try {
    var post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: "Post not found" })
    post.shares = (post.shares || 0) + 1
    await post.save()
    res.json(post)
  } catch (err) {
    res.status(500).json({ message: "error" })
  }
})

router.get("/users", async (req, res) => {
  try {
    var users = await User.find({}, { uid: 1, name: 1, photo: 1, friends: 1 }).limit(50)
    res.json(users)
  } catch (err) {
    res.status(500).json({ message: "error" })
  }
})

router.post("/add-friend", async (req, res) => {
  try {
    var { uid, friendUid } = req.body
    if (!uid || !friendUid) return res.status(400).json({ message: "Missing uid or friendUid" })

    var user = await User.findOne({ uid: uid })
    var friend = await User.findOne({ uid: friendUid })

    if (!user || !friend) return res.status(404).json({ message: "User or friend not found" })

    if (!user.friends) user.friends = []
    if (!friend.friends) friend.friends = []

    if (user.friends.indexOf(friendUid) === -1) {
      user.friends.push(friendUid)
      await user.save()
    }
    if (friend.friends.indexOf(uid) === -1) {
      friend.friends.push(uid)
      await friend.save()
    }
    res.json({ message: "Friend added", friendCount: user.friends.length })
  } catch (err) {
    res.status(500).json({ message: "error" })
  }
})

module.exports = router
