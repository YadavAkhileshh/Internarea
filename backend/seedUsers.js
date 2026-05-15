const mongoose = require("mongoose");
const User = require("./Model/User");
require("dotenv").config();

mongoose.connect(process.env.DATABASE_URL).then(async () => {
  await User.deleteMany({}); // Clean up old data for clean test
  const user1 = new User({
    uid: "user123",
    name: "John Doe",
    email: "john@example.com",
    photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    friends: []
  });
  const user2 = new User({
    uid: "user456",
    name: "Jane Smith",
    email: "jane@example.com",
    photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
    friends: []
  });
  await user1.save();
  await user2.save();
  console.log("Seeded 2 users with uids.");
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
