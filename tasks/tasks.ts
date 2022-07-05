import { task } from "hardhat/config";
import config from "../config.json";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import "@nomiclabs/hardhat-waffle";
import "@openzeppelin/hardhat-upgrades";


const network = process.env.network || config.defaultNetwork;
const settings = config.networks[network];


async function getSampleStaking(hre: HardhatRuntimeEnvironment) {

  const SampleStaking = await hre.ethers.getContractFactory("SampleStaking");
  const sampleStaking = await SampleStaking.attach(settings.contract);
  return sampleStaking
}

async function getToken(address: string, hre: HardhatRuntimeEnvironment) {
    return await hre.ethers.getContractAt('IERC20', address)
}

async function getRewardToken(hre: HardhatRuntimeEnvironment) {
    return await getToken(settings.rewardToken, hre)
}

async function getStakingToken(hre: HardhatRuntimeEnvironment) {
    return await getToken(settings.stakingToken, hre)
}

async function getUser(addess: string, hre: HardhatRuntimeEnvironment) {
    return addess || (await hre.ethers.getSigners())[0].address
}


task("stake", "stake").addParam("amount", "amount").setAction(
    async({amount}, hre) => {
        const token = await getStakingToken(hre);
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
        const response = await (await getSampleStaking(hre)).accountInfo(await getUser(address, hre));
        console.log(response);
    }
)


module.exports = {};
