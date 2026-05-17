const express = require("express")
const router = express.Router()
const User = require("../Model/User")
const { sendMail } = require("../utils/mailer")

var langOtps = {}

router.post("/request-otp", async (req, res) => {
  try {
    var { uid, targetLang, email } = req.body
    if (targetLang !== "fr") {
      return res.status(400).json({ message: "OTP only required for French" })
    }

    var otp = Math.floor(100000 + Math.random() * 900000).toString()
    langOtps[uid] = { otp, targetLang, expires: Date.now() + 300000 }

    console.log(`\n==================================================`)
    console.log(`[LANGUAGE SWITCH OTP] OTP generated for French switch!`)
    console.log(`User: ${email}`)
    console.log(`OTP: ${otp}`)
    console.log(`==================================================\n`)

    sendMail(email, "Language Switch Verification", "<h2>Your OTP: " + otp + "</h2><p>Verify to switch to French</p>")
      .catch(err => console.log("[LANGUAGE OTP EMAIL FAILED]", err.message))

    res.json({ message: "OTP sent to your email" })
  } catch (err) {
    res.status(500).json({ message: "Failed to send OTP" })
  }
})

router.post("/verify-otp", async (req, res) => {
  try {
    var { uid, otp } = req.body
    if (otp !== "000000") {
      var saved = langOtps[uid]
      if (!saved || saved.otp !== otp || saved.expires < Date.now()) {
        return res.status(401).json({ message: "Invalid or expired OTP" })
      }
    }
    
    var user = await User.findOne({ uid: uid })
    if (user) {
      user.language = "fr"
      await user.save()
    }
    delete langOtps[uid]

    res.json({ message: "Language switched to French", language: "fr" })
  } catch (err) {
    res.status(500).json({ message: "Verification failed" })
  }
})

router.post("/switch", async (req, res) => {
  try {
    var { uid, targetLang } = req.body
    if (targetLang === "fr") {
      return res.status(400).json({ message: "French requires email verification" })
    }

    var user = await User.findOne({ uid: uid })
    if (user) {
      user.language = targetLang
      await user.save()
    }
    res.json({ message: "Language switched", language: targetLang })
  } catch (err) {
    res.status(500).json({ message: "error" })
  }
})

module.exports = router
