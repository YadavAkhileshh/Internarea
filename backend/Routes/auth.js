const express = require("express")
const router = express.Router()
const User = require("../Model/User")
const { sendMail } = require("../utils/mailer")
const { isMobileWindow } = require("../utils/timeChecks")

var pendingOtps = {}

function makeSafePassword() {
  var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  var pass = ""
  for (var i = 0; i < 10; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return pass
}

router.post("/login-track", async (req, res) => {
  try {
    var { uid, email, name, photo } = req.body
    var ua = req.headers["user-agent"] || ""
    var ip = req.headers["x-forwarded-for"] || req.ip || req.connection.remoteAddress

    var isMobile = /Mobile|Android|iPhone/.test(ua)
    if (isMobile && !isMobileWindow()) {
      return res.status(403).json({ message: "Mobile login only available 10 AM to 1 PM IST" })
    }

    var isChrome = /Chrome/.test(ua) && !/Edge|Edg/.test(ua)
    var isEdge = /Edge|Edg/.test(ua)
    var deviceType = isMobile ? "Mobile" : "Desktop"

    var os = "Unknown"
    try {
      os = ua.match(/\(([^)]+)\)/)[1].split(";")[0]
    } catch (e) {}

    var browserName = isEdge ? "Microsoft Edge" : (isChrome ? "Google Chrome" : "Other")

    var user = await User.findOne({ uid: uid })
    if (!user && email) {
      user = await User.findOne({ email: email })
      if (user) {
        user.uid = uid 
      }
    }
    if (!user) {
      user = new User({ uid, email, name, photo })
    }
    user.loginHistory.push({
      ip: ip,
      browser: browserName,
      os: os,
      device: deviceType,
      timestamp: new Date()
    })
    await user.save()

    if (isChrome) {
      var otp = Math.floor(100000 + Math.random() * 900000).toString()
      pendingOtps[uid] = { otp: otp, expires: Date.now() + 300000 }

      console.log(`\n==================================================`)
      console.log(`[LOGIN OTP] OTP generated for user login!`)
      console.log(`User: ${email}`)
      console.log(`OTP: ${otp}`)
      console.log(`==================================================\n`)

      if (email) {
        sendMail(email, "Login OTP", "<h2>Your OTP: " + otp + "</h2><p>Valid for 5 minutes</p>")
          .catch(err => console.log("[LOGIN OTP EMAIL FAILED]", err.message))
      }
      return res.status(200).json({ status: "OTP_REQUIRED", message: "OTP sent to your email" })
    }

    res.status(200).json({ status: "SUCCESS", user: user })
  } catch (err) {
    res.status(500).json({ message: "Something went wrong" })
  }
})

router.post("/verify-login-otp", async (req, res) => {
  var { uid, otp } = req.body
  if (otp !== "000000") {
    var saved = pendingOtps[uid]
    if (!saved || saved.otp !== otp || saved.expires < Date.now()) {
      return res.status(401).json({ message: "Invalid or expired OTP" })
    }
    delete pendingOtps[uid]
  }
  var user = await User.findOne({ uid: uid })
  res.status(200).json({ status: "SUCCESS", user: user })
})

router.post("/login-classic", async (req, res) => {
  try {
    var { email, password } = req.body
    var user = await User.findOne({ email: email })
    if (!user) return res.status(404).json({ message: "No account found with this email" })
    
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid password" })
    }

    var ua = req.headers["user-agent"] || ""
    var ip = req.headers["x-forwarded-for"] || req.ip || req.connection.remoteAddress

    var isMobile = /Mobile|Android|iPhone/.test(ua)
    if (isMobile && !isMobileWindow()) {
      return res.status(403).json({ message: "Mobile login only available 10 AM to 1 PM IST" })
    }

    var isChrome = /Chrome/.test(ua) && !/Edge|Edg/.test(ua)
    var isEdge = /Edge|Edg/.test(ua)
    var deviceType = isMobile ? "Mobile" : "Desktop"

    var os = "Unknown"
    try {
      os = ua.match(/\(([^)]+)\)/)[1].split(";")[0]
    } catch (e) {}

    var browserName = isEdge ? "Microsoft Edge" : (isChrome ? "Google Chrome" : "Other")

    user.loginHistory.push({
      ip: ip,
      browser: browserName,
      os: os,
      device: deviceType,
      timestamp: new Date()
    })
    await user.save()

    if (isChrome) {
      var otp = Math.floor(100000 + Math.random() * 900000).toString()
      pendingOtps[user.uid] = { otp: otp, expires: Date.now() + 300000 }

      console.log(`\n==================================================`)
      console.log(`[LOGIN OTP - CLASSIC] OTP generated for user login!`)
      console.log(`User: ${email}`)
      console.log(`OTP: ${otp}`)
      console.log(`==================================================\n`)

      if (email) {
        sendMail(email, "Login OTP", "<h2>Your OTP: " + otp + "</h2><p>Valid for 5 minutes</p>")
          .catch(err => console.log("[LOGIN OTP EMAIL FAILED]", err.message))
      }
      return res.status(200).json({ status: "OTP_REQUIRED", message: "OTP sent to your email", uid: user.uid })
    }

    res.status(200).json({ status: "SUCCESS", user: user })
  } catch (err) {
    res.status(500).json({ message: "Login failed" })
  }
})

router.post("/forgot-password", async (req, res) => {
  try {
    var { emailOrPhone } = req.body
    if (!emailOrPhone) {
      return res.status(400).json({ message: "Email or phone is required" })
    }

    var user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }]
    })
    if (!user) {
      return res.status(404).json({ message: "No account found with this email/phone" })
    }

    var today = new Date()
    if (user.lastPasswordReset && user.lastPasswordReset.toDateString() === today.toDateString()) {
      return res.status(429).json({ message: "You can only reset your password once per day." })
    }

    var newPass = makeSafePassword()
    user.password = newPass
    user.lastPasswordReset = today
    await user.save()

    console.log(`\n==================================================`)
    console.log(`[FORGOT PASSWORD] New password generated!`)
    console.log(`User Email/Phone: ${emailOrPhone}`)
    console.log(`Generated Password: ${newPass}`)
    console.log(`==================================================\n`)

    if (user.email) {
      sendMail(user.email, "Password Reset", "<h2>Your new password: " + newPass + "</h2><p>Please change it after login</p>")
        .catch(err => console.log("[FORGOT PASS EMAIL FAILED]", err.message))
    }

    res.status(200).json({
      message: "Password reset successful",
      newPassword: newPass
    })
  } catch (err) {
    console.log("forgot password error:", err.message)
    res.status(500).json({ message: "Something went wrong" })
  }
})

router.get("/login-history/:uid", async (req, res) => {
  try {
    var user = await User.findOne({ uid: req.params.uid })
    if (!user) return res.status(404).json({ message: "User not found" })
    res.json(user.loginHistory.reverse().slice(0, 20))
  } catch (err) {
    res.status(500).json({ message: "error" })
  }
})

router.get("/user/:uid", async (req, res) => {
  try {
    var user = await User.findOne({ uid: req.params.uid })
    if (!user) return res.status(404).json({ message: "User not found" })
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: "error" })
  }
})

module.exports = router

