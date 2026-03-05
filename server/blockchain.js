const { Web3 } = require('web3')
const path = require('path')
const fs = require('fs')

const providerUrl = process.env.GANACHE_URL || 'http://127.0.0.1:7545'
const contractAddress = process.env.CONTRACT_ADDRESS

const web3 = new Web3(providerUrl)
const abiPath = path.resolve(__dirname, 'blockchain', 'TouristSafety.abi.json')
const abi = JSON.parse(fs.readFileSync(abiPath, 'utf-8'))
const contract = new web3.eth.Contract(abi, contractAddress)

async function accounts() {
  return await web3.eth.getAccounts()
}

async function registerTourist(name, identityHash, from) {
  const accs = await accounts()
  const sender = from || accs[0]
  return await contract.methods.registerTourist(name, identityHash).send({ from: sender })
}

async function reportIncident(location, details, from) {
  const accs = await accounts()
  const sender = from || accs[0]
  return await contract.methods.reportIncident(location, details).send({ from: sender })
}

async function verifyIncident(incidentId) {
  const accs = await accounts()
  return await contract.methods.verifyIncident(incidentId).send({ from: accs[0] })
}

module.exports = { registerTourist, reportIncident, verifyIncident }
