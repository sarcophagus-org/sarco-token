const Distributor = artifacts.require("Distributor")
const Sarco = artifacts.require("Sarco")

module.exports = function (deployer) {
  const data = [
    { recipient: "0x3547ED2fb580Dc5657B0d04396F92F6a746B54b6", amount: 60000000, vest: false },
    { recipient: "0x0b84cF44954a37f9abbE024f945A1d0F3f7467BF", amount: 15000000, vest: false },
    { recipient: "0x244265a76901b8030B140A2996e6Dd4703cbF20f", amount:  3199996, vest: true },
    { recipient: "0x4A0A927043B01a7fB175BCa4F4837e3b817C5e6b", amount:  2720000, vest: true },
    { recipient: "0x9354209b880aC0aBb02821Cb3915a6EEB9A9336C", amount:  2720000, vest: true },
    { recipient: "0xA4da1678bf2885A048Bec18a8aAEE48c20bf3d1C", amount:  2000000, vest: false },
    { recipient: "0x77e879A426a9f49349E2BBAb4E8b91dD3F23084E", amount:  2000000, vest: false },
    { recipient: "0xFeB9BDCf0b5eeC884777222D58583b1569400585", amount:  2000000, vest: true },
    { recipient: "0xB6420c6EAe0325EdbA74845462c6760C6D706766", amount:  2000000, vest: true },
    { recipient: "0x43ce086a7769Adc7921090CFF6fB1C8Efd62fB26", amount:  2000000, vest: true },
    { recipient: "0x15160128D2152ddB01365b60Fd1cEc1876845e63", amount:  1000000, vest: false },
    { recipient: "0x61e2f3465A187c87Bf8988e864764b338745Fa60", amount:  1000000, vest: true },
    { recipient: "0xAB0EEcC2026906072a8F9f0b4e9Ef22314EBF1FE", amount:  1000000, vest: true },
    { recipient: "0x940C3F972C6eebf21D30e8FC86dcaF95f4dD5E28", amount:  1000000, vest: true },
    { recipient: "0xd1bBbc228a4753b9763A111E396a4a3083762A39", amount:   560000, vest: true },
    { recipient: "0xCd635Df513EbbBbB618FC6c63173Adf8659a520D", amount:   500000, vest: true },
    { recipient: "0x19Fd3927Ffe5f49c19e0C722290aDBA674Bf52a3", amount:   500000, vest: true },
    { recipient: "0xf05c863D877DA228caA9B046df1d104b170364ce", amount:    66667, vest: true },
    { recipient: "0x3453f2fF2eD689A31D0d5392638C3aB2aD71a752", amount:    66667, vest: true },
    { recipient: "0x605ACc13c07CB2dE5261dc64D315857fDE7d5C5c", amount:    66667, vest: true },
    { recipient: "0xd48aB93dFFAc50a0AA51Dd7C488d52D6472a7444", amount:    66667, vest: true },
    { recipient: "0x6a5868ca8187B5190B9238fC14E1C160E94DF601", amount:    66667, vest: true },
    { recipient: "0x548d20c41FdE459D8036650821432E5A3249693d", amount:    66667, vest: true },
    { recipient: "0xf9Db5fE8d4025F58180e77148BffFB79fD0d8072", amount:    66667, vest: true },
    { recipient: "0x13C210e4a2035446CF02e5b8AC42b6b9A12f8675", amount:    66667, vest: true },
    { recipient: "0xcd0093e2945b28f3b5ba3654e5a24946f7a538ed", amount:    66667, vest: true },
    { recipient: "0xB1B7586656116D546033e3bAFF69BFcD6592225E", amount:    66667, vest: true },
    { recipient: "0xE1A47414922159fB2d3F614eE9F0340C9c539B01", amount:    66667, vest: true },
    { recipient: "0x7FcAE73Cec08fAF89f318A55fcDa1706eEE8407F", amount:    66667, vest: true },
  ]

  const recipients = data.map(d => d.recipient)
  const amounts = data.map(d => d.amount)
  const vests = data.map(d => d.vest)

  deployer
    .deploy(Distributor, recipients, amounts, vests)
    .then(() => deployer.deploy(Sarco, Distributor.address))
    .then(() => Distributor.deployed())
    .then(d => d.distribute(Sarco.address))
}