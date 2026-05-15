const express = require("express");
const router = express.Router();
const admin = require("./admin");
const intern = require("./internship");
const job = require("./job");
const application = require("./application");
const auth = require("./auth");
const community = require("./community");
const subscription = require("./subscription");
const resume = require("./resume");
const language = require("./language");

router.use("/admin", admin);
router.use("/internship", intern);
router.use("/job", job);
router.use("/application", application);
router.use("/auth", auth);
router.use("/community", community);
router.use("/subscription", subscription);
router.use("/resume", resume);
router.use("/lang", language);

module.exports = router;
