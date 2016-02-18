'use strict'

let mdns = require('mdns')
let txt_record = {
  name: 'snap-xx'
}
let total_snap = 100
let max_snap = total_snap
let services = []

function createAdvertisement (name, index) {
  console.log(`creating horde:${index}/${max_snap}`)
  try {
    txt_record.name = name
    txt_record.number = index
    services.push(mdns.createAdvertisement(mdns.tcp('snap'), 4321+index, { txtRecord: txt_record, name: require('os').hostname()+'-'+index }))
    services[services.length - 1].on('error', handleError)
    services[services.length - 1].start()
  } catch (ex) {
    handleError(ex, name)
  }
}

function handleError (error, name) {
  switch (error.errorCode) {
    case mdns.kDNSServiceErr_Unknown:
      console.warn(error);
      setTimeout(function retryAdvertisment () {
        createAdvertisement(name)
      }, 5000);
      break;
    default:
      throw error;
  }
}

while (total_snap--) { 
  createAdvertisement(`snap-${total_snap}`, total_snap)
}
