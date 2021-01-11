const Distributor = artifacts.require("Distributor")
const Sarco = artifacts.require("Sarco")

module.exports = function (deployer, network) {
  let immediate, vest, start, duration

  if (['mainnet', 'mainnet-fork'].includes(network)) {
    immediate = [
      { recipient: "0x3547ED2fb580Dc5657B0d04396F92F6a746B54b6", amount: 60000000 },
      { recipient: "0x0b84cF44954a37f9abbE024f945A1d0F3f7467BF", amount: 15000000 },
      { recipient: "0xA4da1678bf2885A048Bec18a8aAEE48c20bf3d1C", amount: 2000000 },
      { recipient: "0x77e879A426a9f49349E2BBAb4E8b91dD3F23084E", amount: 2000000 },
      { recipient: "0x15160128D2152ddB01365b60Fd1cEc1876845e63", amount: 1000000 },
    ]
  
    vest = [
      { recipient: "0x244265a76901b8030B140A2996e6Dd4703cbF20f", amount: 3199996 },
      { recipient: "0x4A0A927043B01a7fB175BCa4F4837e3b817C5e6b", amount: 2720000 },
      { recipient: "0x9354209b880aC0aBb02821Cb3915a6EEB9A9336C", amount: 2720000 },
      { recipient: "0xFeB9BDCf0b5eeC884777222D58583b1569400585", amount: 2000000 },
      { recipient: "0xB6420c6EAe0325EdbA74845462c6760C6D706766", amount: 2000000 },
      { recipient: "0x43ce086a7769Adc7921090CFF6fB1C8Efd62fB26", amount: 2000000 },
      { recipient: "0x61e2f3465A187c87Bf8988e864764b338745Fa60", amount: 1000000 },
      { recipient: "0xAB0EEcC2026906072a8F9f0b4e9Ef22314EBF1FE", amount: 1000000 },
      { recipient: "0x940C3F972C6eebf21D30e8FC86dcaF95f4dD5E28", amount: 1000000 },
      { recipient: "0xd1bBbc228a4753b9763A111E396a4a3083762A39", amount: 560000 },
      { recipient: "0xCd635Df513EbbBbB618FC6c63173Adf8659a520D", amount: 500000 },
      { recipient: "0x19Fd3927Ffe5f49c19e0C722290aDBA674Bf52a3", amount: 500000 },
      { recipient: "0xf05c863D877DA228caA9B046df1d104b170364ce", amount: 66667 },
      { recipient: "0x3453f2fF2eD689A31D0d5392638C3aB2aD71a752", amount: 66667 },
      { recipient: "0x605ACc13c07CB2dE5261dc64D315857fDE7d5C5c", amount: 66667 },
      { recipient: "0xd48aB93dFFAc50a0AA51Dd7C488d52D6472a7444", amount: 66667 },
      { recipient: "0x6a5868ca8187B5190B9238fC14E1C160E94DF601", amount: 66667 },
      { recipient: "0x548d20c41FdE459D8036650821432E5A3249693d", amount: 66667 },
      { recipient: "0xf9Db5fE8d4025F58180e77148BffFB79fD0d8072", amount: 66667 },
      { recipient: "0x13C210e4a2035446CF02e5b8AC42b6b9A12f8675", amount: 66667 },
      { recipient: "0xcd0093e2945b28f3b5ba3654e5a24946f7a538ed", amount: 66667 },
      { recipient: "0xB1B7586656116D546033e3bAFF69BFcD6592225E", amount: 66667 },
      { recipient: "0xE1A47414922159fB2d3F614eE9F0340C9c539B01", amount: 66667 },
      { recipient: "0x7FcAE73Cec08fAF89f318A55fcDa1706eEE8407F", amount: 66667 },
    ]

    start = 1610632800
    duration = 60 * 60 * 24 * 365 * 2 // 2 years
  } else {
    immediate = [
      { recipient: "0xa59f129e85fbb545f274055c286eb6dfc77e1230", amount: 60000000 },
      { recipient: "0x009d8c85fc9e5648fcd65eb1d73b5f2074cf46a3", amount: 15000000 },
      { recipient: "0x5c849d98d061c5f9008343faf0393ecf0298bc39", amount: 2000000 },
      { recipient: "0xe7857d88dc9d79ab115a1df40ab7956b13b388cb", amount: 2000000 },
      { recipient: "0xfbc1482ba2f4d425d740a721618125c27dce21d7", amount: 1000000 },
    ]
  
    vest = [
      { recipient: "0xc00a12ab8ab6d110d6f0d6c7218daaee08ba3e2a", amount: 3199996 },
      { recipient: "0xdb78b030455da9f95dd4aa39b69170c231f5d639", amount: 2720000 },
      { recipient: "0x8d443e20a7d2bc9cc0b4e2e4822ebc7fcbaf39d3", amount: 2720000 },
      { recipient: "0x2000c75e1fd9edcca05a630d46acb99ef0bb702e", amount: 2000000 },
      { recipient: "0x5614a28e142a57b123ccc5617df50eeb5850e88f", amount: 2000000 },
      { recipient: "0xab947609e7617e8e5bf0beb53b4f96108134cd21", amount: 2000000 },
      { recipient: "0x8594edf93eae400e4ca2caa601e7b37ddca3d6f6", amount: 1000000 },
      { recipient: "0xa282a0d75cd9f70d51f8d988d1e14999097b356f", amount: 1000000 },
      { recipient: "0x49008f9370871b847a8122a06ebe2de42011c15c", amount: 1000000 },
      { recipient: "0x6ae7bf1c37998e18df8d649cfd2386c0f1321e19", amount: 560000 },
      { recipient: "0x1465732af4f6ba4d41756118993ac071d3304e4f", amount: 500000 },
      { recipient: "0x1dd6f951f759c1ce69fe304863f596fad6f2fa83", amount: 500000 },
      { recipient: "0xd11ad5c489ea65bf98be4d6a0544ac61aa61b3c0", amount: 66667 },
      { recipient: "0xb5e5b1fba7cb9220ee76070a03941ea4b67cc8a7", amount: 66667 },
      { recipient: "0x569b168d7d23edb094e9439b7ec8470c7ee8dbc0", amount: 66667 },
      { recipient: "0x9f76817a7fbec64ca9540f10012a42a3330f33eb", amount: 66667 },
      { recipient: "0x87547354aff29621ffcd02c05c4c7aca879a02ef", amount: 66667 },
      { recipient: "0x9473c6d67d1421c2cfdc5f96158b26cc3c0af0b7", amount: 66667 },
      { recipient: "0x546a53b9cfb5663218f20939f80baa3ddd121735", amount: 66667 },
      { recipient: "0x142ff4d111d75012e62dd436b0f5107559e20c2e", amount: 66667 },
      { recipient: "0xc759952a27f15864bc591359651dd35d2f75b7ef", amount: 66667 },
      { recipient: "0xf41b7f191692f0157ef7ca1eab77d2747ee9f9aa", amount: 66667 },
      { recipient: "0xe1afa20e465e98c2069fb38604ef433c0b92855c", amount: 66667 },
      { recipient: "0x288c57908cb8a7b03fa9873993dc57389b5ff8af", amount: 66667 },
    ]

    start = Math.floor(Date.now() / 1000) + 300
    duration = 60 * 10 // 10 minutes
  }

  const scale = number => {
    const BN = web3.utils.BN
    const powerEighteen = (new BN(10)).pow(new BN(18))
    return (new BN(number)).mul(powerEighteen)
  }

  const immediateRecipients = immediate.map(d => d.recipient)
  const immediateAmounts = immediate.map(d => scale(d.amount))
  
  const vestRecipients = vest.map(d => d.recipient)
  const vestAmounts = vest.map(d => scale(d.amount))

  deployer
    .deploy(Distributor, immediateRecipients, immediateAmounts, vestRecipients, vestAmounts)
    .then(() => deployer.deploy(Sarco, Distributor.address))
    .then(() => Distributor.deployed())
    .then(d => d.distribute(Sarco.address, start, duration))
}
