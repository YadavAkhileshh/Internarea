const mongoose = require("mongoose");
const Post = require("./Model/Post");
require("dotenv").config();

mongoose.connect(process.env.DATABASE_URL).then(async () => {
  const posts = await Post.find().limit(5);
  console.log("Posts in DB:", JSON.stringify(posts, null, 2));
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
