'use strict'

let mdns = require('mdns')
let counter = 0
// watch all http servers
var browser = mdns.createBrowser(mdns.tcp('snap'))

browser.on('serviceUp', function(service) {
  console.log("service up: ", service)
  counter++
  console.log(`total count = ${counter}`)
})
browser.on('serviceDown', function(service) {
  console.log("service down: ", service)
  counter--
  console.log(`total count = ${counter}`)
})
browser.start()
