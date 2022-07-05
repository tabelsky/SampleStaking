//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract SampleStaking is Ownable {
    address private _stakingToken;
    address private _rewardToken;
    uint32 private _holdInterval;
    uint16 private _percent;

    struct Account {
        uint256 deposit;
        uint64 updateTime;
        uint256 reward;
        uint256 claimed;
    }

    mapping(address=>Account) public accounts;

    event Stake(address indexed account, uint256 amount);
    event UnStake(address indexed account, uint256 amount);
    event Winthdraw(address indexed account, uint256 amount);
    event Claim(address indexed account);
    event SetPercent(uint16 percent_);
    event SetHoldInterval(uint32 holdIntreval_);


    constructor(address stakingToken_, address rewardToken_, uint32 holdInterval_, uint16 percent_) {
        _stakingToken = stakingToken_;
        _rewardToken = rewardToken_;
        _holdInterval = holdInterval_;
        _percent = percent_;

    }

    function _updateReward(address account) private {
        accounts[account].reward = (accounts[account].updateTime > 0  ? ((accounts[account].deposit * _percent) / 100) * ((block.timestamp - accounts[account].updateTime) / _holdInterval) : 0) + accounts[account].reward;
        accounts[account].updateTime = uint64(block.timestamp);
    }
    
    function  stake(uint256 amount) public {
        IERC20 stakingTokenI = IERC20(_stakingToken);
        stakingTokenI.transferFrom(msg.sender, address(this), amount);
        _updateReward(msg.sender);
        accounts[msg.sender].deposit += amount;
        emit Stake(msg.sender, amount);   
        
    }

    function unstake(uint256 amount) public {
        require((block.timestamp - accounts[msg.sender].updateTime) >= _holdInterval, "hold interval isn't up");
        require(accounts[msg.sender].deposit >= amount, "not enough balance");
        _updateReward(msg.sender);
        IERC20 stakingTokenI = IERC20(_stakingToken);
        accounts[msg.sender].deposit -= amount;
        stakingTokenI.transfer(msg.sender, amount);
        emit UnStake(msg.sender, amount);   

    }

    function winthdraw() public {
        IERC20 rewardTokenI = IERC20(_rewardToken);
        _updateReward(msg.sender);
        uint256 reward = accounts[msg.sender].reward;
        accounts[msg.sender].reward = 0;
        rewardTokenI.transfer(msg.sender, reward);
        emit Winthdraw(msg.sender, reward);
        
    }

    function claim(address account) public onlyOwner {
        _updateReward(account);
        accounts[account].reward = 0;
        emit Claim(account);
    }

    function setPercent(uint16 percent_) public onlyOwner{ 
        _percent = percent_;
        emit SetPercent(percent_);
    }

    function setHoldInterval(uint32 holdInterval_) public onlyOwner {
        _holdInterval = holdInterval_;
        emit SetHoldInterval(holdInterval_);
    }

    function percent() public view returns (uint16) {
        return _percent;
    }

    function holdInterval() public view returns (uint32) {
        return _holdInterval;
    }

    function rewardToken() public view returns (address) {
        return _rewardToken;
    }

    function stakingToken() public view returns (address) {
        return _stakingToken;
    }

}
