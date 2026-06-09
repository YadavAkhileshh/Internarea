const { sendMail } = require("./utils/mailer");
require("dotenv").config();

console.log("Testing email configuration...");
console.log("EMAIL_USER:", process.env.EMAIL_USER);

sendMail("ifelsemadness@gmail.com", "Test Subject", "<h1>Test</h1>")
  .then(() => {
    console.log("sendMail function called successfully");
    // Wait for the setImmediate mailer task to run
    setTimeout(() => {
      console.log("Done waiting, check output above");
      process.exit(0);
    }, 5000);
  })
  .catch(err => {
    console.error("sendMail error:", err);
    process.exit(1);
  });
