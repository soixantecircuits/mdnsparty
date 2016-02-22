'use strict'

var status = require('./data/data.js').status
var setting = require('./data/data.js').setting

const mdns = require('mdns')
const request = require('request')
const express = require('express')
const ip = require('ip')
const ipAddress = ip.address()
let txt_record = {
  name: 'snap-xx'
}
let total_snap = 5
let max_snap = total_snap
let services = []
let apps = []
let portNumber = 4321

function createAdvertisement(name, index) {
  console.log(`creating horde:${index}/${max_snap}`)
  try {
    txt_record.name = name
    txt_record.number = index
    services.push(mdns.createAdvertisement(mdns.tcp('snap'), portNumber, { txtRecord: txt_record, name: require('os').hostname() + '-' + index }))
    services[services.length - 1].on('error', handleError)
    services[services.length - 1].start()
  } catch (ex) {
    handleError(ex, name)
  }
}

function handleError(error, name) {
  switch (error.errorCode) {
    case mdns.kDNSServiceErr_Unknown:
      console.warn(error);
      setTimeout(function retryAdvertisment() {
        createAdvertisement(name)
      }, 5000);
      break;
    default:
      throw error;
  }
}

function createServer(port) {
  apps.push(express())
  let app = apps[apps.length - 1]
  /*==========================*/
  /* Mock DSLR number
  /*==========================*/
  app.get('/api/settings', (req, res) => res.send(200, setting))
  app.get('/api/stream/start', (req, res) => res.send(200, 'Stream started'))
  app.get('/api/stream/stop', (req, res) => res.send(200, 'Stream stopped'))
  app.get('/api/preview/:format', (req, res) => {
    res.header('Content-Type', 'image/' + req.params.format);
    if (req.params.format === 'jpg') {
      request.get('https://goo.gl/NHYwjZ').pipe(res)
    } else {
      request.get('http://goo.gl/m9ffDw').pipe(res)
    }
  })
  app.get('/api/status', (req, res) => res.send(200, status))
  app.get('/api/shoot/:format', (req, res) => res.send(200, `/api/lastpicture/${req.params.format}`))
  app.get('/api/lastpicture', (req, res) => {
    res.header('Content-Type', 'image/png');
    request.get('http://goo.gl/m9ffDw').pipe(res)
  })
  app.get('/api/lastpicture/:format', (req, res) => {
    res.header('Content-Type', 'image/' + req.params.format);
    if (req.params.format === 'jpg') {
      request.get('https://goo.gl/NHYwjZ').pipe(res)
    } else {
      request.get('http://goo.gl/m9ffDw').pipe(res)
    }
  })
  app.get('/api/preview', (req, res) => {
    res.header('Content-Type', 'image/png');
    request.get('http://goo.gl/m9ffDw').pipe(res)
  })
  app.listen(port, ipAddress, function () {
    console.log(`Spawn snap listening on: http://${ipAddress}:${port}`)
  })
}
total_snap++
while (total_snap-- > 1) {
  createServer(portNumber)
  createAdvertisement(`snap-${total_snap}`, total_snap)
  portNumber++
}

function mockFailure() {
  setInterval(function deleteService() {
    let index = Math.floor(Math.random() * services.length)
    let mdnsService = services[index]
    console.log(`killing: ${index+1}`)
    if (mdnsService._watcherStarted) {
      mdnsService.stop()
    }
    setTimeout(function () {
      txt_record.name = `snap-${index + 1}`
      txt_record.number = index + 1
      services[index] = mdns.createAdvertisement(mdns.tcp('snap'), portNumber - (max_snap - index), { txtRecord: txt_record, name: require('os').hostname() + '-' + (index+1) })
      services[index].on('error', handleError)
      console.log(`starting: ${index + 1}`)
      services[index].start()
    }, 14000)
  }, 10 * 1000)
}

mockFailure()
