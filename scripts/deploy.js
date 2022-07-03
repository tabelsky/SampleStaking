const { ethers } = require("hardhat");
const config = require('./../config.json');

async function main() {
  const network = process.env.network || config.defaultNetwork
  const settings = config.networks[network]

  SampleStaking = await ethers.getContractFactory("SampleStaking");
  sampleStaking = await SampleStaking.deploy(
    settings.stakingToken, settings.rewardToken, settings.holdInterval, settings.percent
  )
  await sampleStaking.deployed();

  console.log("SampleToken deployed to:", sampleStaking.address);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
