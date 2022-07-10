import { task } from "hardhat/config";
import * as config_ from "../config.json";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import "@nomiclabs/hardhat-waffle";
import "@openzeppelin/hardhat-upgrades";


const config = (config_ as any);
const network = process.env.network || config.defaultNetwork;
const settings = config.networks[network];


async function getSampleStaking(hre: HardhatRuntimeEnvironment) {

  const SampleStaking = await hre.ethers.getContractFactory("SampleStaking");
  const sampleStaking = await SampleStaking.attach(settings.contract);
  return sampleStaking;
}

async function getPairFactory(hre: HardhatRuntimeEnvironment) {

    return await hre.ethers.getContractAt('IUniswapV2Factory', settings.uniswap.factory);

}

async function getRouter(hre: HardhatRuntimeEnvironment) {

    return await hre.ethers.getContractAt('IUniswapV2Router02', settings.uniswap.router);

}

async function getToken(address: string, hre: HardhatRuntimeEnvironment) {
    return await hre.ethers.getContractAt('IERC20', address);
}


async function getRewardToken(hre: HardhatRuntimeEnvironment) {
    return await getToken(settings.rewardToken, hre);
}

async function getStakingToken(hre: HardhatRuntimeEnvironment) {
    return await getToken(settings.stakingToken, hre);
}


async function getUser(addess: string, hre: HardhatRuntimeEnvironment) {
    return addess || (await hre.ethers.getSigners())[0].address;
}


task("stake", "stake").addParam("amount", "amount").setAction(
    async({amount}, hre) => {
        const token = await getStakingToken(hre);
        await token.approve(settings.contract, amount);
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

task("createPair", "create  pair").addOptionalParam('addressA', 'tokenA address').addOptionalParam('addressB', 'tokenB address').setAction(
    async({addressA, addressB}, hre) => {
        addressA = addressA ? addressA : settings.rewardToken;
        addressB = addressB ? addressB : settings.rewardTokenPair;
        const paitFactory = await getPairFactory(hre);
        let response;
        try {
            response = (await (await paitFactory.createPair(addressA, addressB)).wait());
        }

        catch(er) {

            response = await paitFactory.getPair(addressA, addressB);
            
        }

        console.log(response);
        
    }
)

task("addLiquidity", "add liquidity").addOptionalParam('addressA', 'tokenA address').addOptionalParam('addressB', 'tokenB address').addParam(
    'amountA').addParam('amountB').addParam('amountAmin').addParam('amountBmin').addOptionalParam('addressTo', 'Recipient of the liquidity tokens').addOptionalParam(
        'deadLineInterval', 'ttl of transaction in seconds'
    ).setAction(
        async({addressA, addressB, amountA, amountB, amountAmin, amountBmin, addressTo, deadLineInterval}, hre) => {
            addressA = addressA ? addressA : settings.rewardToken;
            addressB = addressB ? addressB : settings.rewardTokenPair;
            amountA = parseInt(amountA)
            amountB = parseInt(amountB)
            amountAmin = parseInt(amountAmin)
            amountBmin = parseInt(amountBmin)
            deadLineInterval = parseInt(deadLineInterval)
            addressTo = await getUser(addressTo, hre)
            const deadline = ((Date.now() / 1000) | 0) + deadLineInterval
                
            const router = await getRouter(hre)
            const tokenA = await getToken(addressA, hre)
            const tokenB = await getToken(addressB, hre)
        
            await tokenA.approve(router.address, amountA)
            await tokenB.approve(router.address, amountB)
                     
            const response = await router.addLiquidity(addressA, addressB, amountA, amountB, amountAmin, amountBmin, addressTo, deadline)
            console.log(response)
        }

        
    )



module.exports = {};
