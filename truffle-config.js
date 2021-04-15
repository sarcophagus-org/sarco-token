require('dotenv').config()
const HDWalletProvider = require('@truffle/hdwallet-provider')

module.exports = {
  networks: {
    mainnet: {
      provider: () => new HDWalletProvider({
        privateKeys: [process.env.MAINNET_PK],
        providerOrUrl: process.env.MAINNET_PROVIDER
      }),
      network_id: '1',
    },
    rinkeby: {
      provider: () => new HDWalletProvider({
        privateKeys: [process.env.RINKEBY_PK],
        providerOrUrl: process.env.RINKEBY_PROVIDER
      }),
      network_id: '4'
    },
    goerli: {
      provider: () => new HDWalletProvider({
        privateKeys: [process.env.GOERLI_PK],
        providerOrUrl: process.env.GOERLI_PROVIDER
      }),
      network_id: '5'
    },
    ropsten: {
      provider: () => new HDWalletProvider({
        privateKeys: [process.env.ROPSTEN_PK],
        providerOrUrl: process.env.ROPSTEN_PROVIDER
      }),
      network_id: '3',
      gas: 4000000
    },

    ganache: {
        host: "127.0.0.1",
        port: 7545,
        network_id: "*" // Match any network id
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
