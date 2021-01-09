require('dotenv').config()
const HDWalletProvider = require('@truffle/hdwallet-provider')

module.exports = {
  networks: {
    goerli: {
      provider: () => new HDWalletProvider({
        privateKeys: [process.env.GOERLI_PK],
        providerOrUrl: process.env.GOERLI_PROVIDER
      }),
      network_id: '5'
    },
  },
  compilers: {
    solc: {
      version: "0.6.12",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
}
