const { task } = require("hardhat/config");
const config = require('./../config.json');

require("@nomiclabs/hardhat-waffle");
require('@openzeppelin/hardhat-upgrades');



const network = process.env.network || config.defaultNetwork
const settings = config.networks[network]


async function getSampleStaking(hre) {

  const SampleStaking = await hre.ethers.getContractFactory("SampleStaking");
  const sampleStaking = await SampleStaking.attach(settings.contract);
  return sampleStaking;
}

async function getToken(address) {
    return await hre.ethers.getContractAt('IERC20', address)
}

async function getRewardToken() {
    return await getToken(settings.rewardToken)
}

async function getStakingToken() {
    return await getToken(settings.stakingToken)
}

async function getUser(addess) {
    return addess || (await hre.ethers.getSigners())[0].address
}


task("stake", "stake").addParam("amount", "amount").setAction(
    async({amount}, hre) => {
        const token = await getStakingToken()
        await token.approve(settings.contract, amount);
        response = await (await getSampleStaking(hre)).stake(amount)
        console.log(response)

    }
)

task("unstake", "unstake").addParam("amount", "amount").setAction(
    async({amount}, hre) => {
        response = await (await getSampleStaking(hre)).unstake(amount)
        console.log(response)

    }
)

task("claim", "claim").addParam("address", "address").addParam("amount", "amount").setAction(
    async({address, amount}, hre) => {

        response = await (await getSampleStaking(hre)).claim(address, amount)
        console.log(response)

    }
)

task("account", "account").addOptionalParam("address", "address").setAction(
    async({address}, hre) => {

        response = await (await getSampleStaking(hre)).accountInfo(await getUser(address))
        console.log(response)

    }
)



// task("mint", "mint")
//   .addOptionalParam("contract", "Contract addess")
//   .addOptionalParam("to", "receiver of minted")
//   .addParam("value", "amount of tokens")
//   .setAction(async ({ contract, to, value }, hre) => {
//     const sampleToken = await getSampleToken(contract, hre);
//     to = to || (await hre.ethers.getSigners())[0].address;

//     console.log(await sampleToken.mint(to, value));
//   });

// task("burn", "burn")
//   .addOptionalParam("contract", "Contract addess")
//   .addOptionalParam("from", "victim of burning")
//   .addParam("value", "amount of tokens")
//   .setAction(async ({ contract, from, value }, hre) => {
//     const sampleToken = await getSampleToken(contract, hre);
//     from = from || (await hre.ethers.getSigners())[0];
//     console.log(await sampleToken.burn(from.address, value));
//   });

// task("transfer", "transfer")
//   .addOptionalParam("contract", "Contract addess")
//   .addParam("to", "receiver")
//   .addParam("value", "amount")
//   .setAction(async ({ contract, to, value }, hre) => {
//     const sampleToken = await getSampleToken(contract, hre);
//     console.log(await sampleToken.transfer(to, value));
//   });

// task("approve", "approve")
//   .addOptionalParam("contract", "Contract addess")
//   .addParam("spender", "spender")
//   .addParam("value", "amount")
//   .setAction(async ({ contract, spender, value }, hre) => {
//     const sampleToken = await getSampleToken(contract, hre);
//     console.log(await sampleToken.approve(spender, value));
//   });

// task("allowance", "allowance")
//   .addOptionalParam("contract", "Contract addess")
//   .addParam("owner", "owner")
//   .addParam("spender", "spender")
//   .setAction(async ({ contract, owner, spender }, hre) => {
//     const sampleToken = await getSampleToken(contract, hre);
//     console.log(await sampleToken.allowance(owner, spender));
//   });

// task("transferFrom", "transferFrom")
//   .addOptionalParam("contract", "Contract addess")
//   .addParam("from", "from")
//   .addParam("to", "to")
//   .addParam("value", "value")
//   .setAction(async ({ contract, from, to, value }, hre) => {
//     const sampleToken = await getSampleToken(contract, hre);
//     console.log(await sampleToken.transferFrom(from, to, value));
//   });


module.exports = {};
