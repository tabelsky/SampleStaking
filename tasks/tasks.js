const { task } = require("hardhat/config");
const config = require("./../config.json");

require("@nomiclabs/hardhat-waffle");
require('@openzeppelin/hardhat-upgrades');


const network = process.env.network || config.defaultNetwork;
const settings = config.networks[network];


async function getSampleStaking(hre) {

  const SampleStaking = await hre.ethers.getContractFactory("SampleStaking");
  const sampleStaking = await SampleStaking.attach(settings.contract);
  return sampleStaking
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
        const token = await getStakingToken();
        await token.approve(settings.contract, amount);;
        const response = await (await getSampleStaking(hre)).stake(amount);
        console.log(response);
    }
)

task("unstake", "unstake").addParam("amount", "amount").setAction(
    async({amount}, hre) => {
        const response = await (await getSampleStaking(hre)).unstake(amount);
        console.log(response);
    }
)

task("claim", "claim").addParam("address", "address").addParam("amount", "amount").setAction(
    async({address, amount}, hre) => {
        const response = await (await getSampleStaking(hre)).claim(address, amount);
        console.log(response);
    }
)

task("account", "account").addOptionalParam("address", "address").setAction(
    async({address}, hre) => {
        const response = await (await getSampleStaking(hre)).accountInfo(await getUser(address));
        console.log(response);
    }
)


module.exports = {};
