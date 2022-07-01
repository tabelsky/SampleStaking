//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.15;

import "hardhat/console.sol";

contract SampleStaking {
    address private stakingToken;
    address private revardToken;

    constructor(address stakingToken_, address rewardToken_) {
        stakingToken = stakingToken_;
        revardToken = rewardToken_;
    }

}
