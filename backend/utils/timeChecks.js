function getISTHour() {
  var now = new Date()
  var istOffset = 5.5 * 60 * 60 * 1000
  var istTime = new Date(now.getTime() + istOffset)
  return istTime.getUTCHours()
}

function isPaymentWindow() {
  var h = getISTHour()
  return h >= 10 && h < 11
}

function isMobileWindow() {
  var h = getISTHour()
  return h >= 10 && h < 13
}

module.exports = { getISTHour, isPaymentWindow, isMobileWindow }
