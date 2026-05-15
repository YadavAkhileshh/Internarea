const mongoose = require("mongoose");
const User = require("./Model/User");
require("dotenv").config();

mongoose.connect(process.env.DATABASE_URL).then(async () => {
  const users = await User.find({}, { uid: 1, name: 1, friends: 1 });
  console.log("Users in DB:", JSON.stringify(users, null, 2));
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
