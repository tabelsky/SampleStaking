
import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan"
import "hardhat-gas-reporter"
import "solidity-coverage"
import "hardhat-contract-sizer"

import "./tasks/tasks"
import {config} from "dotenv"


config()



// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.15",
  networks: {
    ropsten: {
      url: process.env.ROPSTER_INFURA_URL || "",
      blockGasLimit: 124500000,
      accounts:
        process.env.ROPSTEN_INFURA_PRIVAT_KEY !== undefined
          ? [process.env.ROPSTEN_INFURA_PRIVAT_KEY]
          : [],
    },
  },

  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true
  },

  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },


};
