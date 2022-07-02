//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.15;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract SampleStaking is Ownable {
    address private _stakingToken;
    address private _revardToken;
    uint256 private holdIntreval;
    uint256 private percent;

    struct Account {
        uint256 deposit;
        uint256 updateTime;
        uint256 reward;
    }

    mapping(address=>Account) public accounts;

    event Stake(address indexed account, uint256 amount);

    constructor(address stakingToken_, address rewardToken_, uint256 holdInterval_, uint256 percent_) {
        _stakingToken = stakingToken_;
        _revardToken = rewardToken_;
        holdIntreval = holdInterval_;
        percent = percent_;

    }


    function compound (uint256 deposit, uint256 percent_, uint periods) public pure returns (uint256) {

        // нужно придумать что то то оптимальней
        
        uint256 updatedDeposit = deposit;
        while (periods > 0) {
            updatedDeposit += (updatedDeposit * percent_) / 100;
            periods -= 1;
        }
        return updatedDeposit - deposit;
}

    function accountReward(address account) public view returns (uint256) {

 
        return (accounts[account].updateTime > 0  ? this.compound(accounts[account].deposit, percent, (block.timestamp - accounts[account].updateTime) / holdIntreval) : 0) + accounts[account].reward; 
    }


    function _updateReward(address account) private {
        accounts[account].reward = this.accountReward(account);
        accounts[account].updateTime = block.timestamp;
    }
    
    function  stake(uint256 amount) public {
        IERC20 stakingToken = IERC20(_stakingToken);
        stakingToken.transferFrom(msg.sender, address(this), amount);
        _updateReward(msg.sender);
        accounts[msg.sender].deposit += amount;
        emit Stake(msg.sender, amount);   
        
    }

    function accountInfo(address account) public view returns(uint, uint, uint) {
        return (accounts[account].deposit, accounts[account].updateTime, this.accountReward(account));
    }


}

// Написать смарт-контракт стейкинга, создать пул ликвидности на uniswap в тестовой сети. Контракт стейкинга принимает ЛП токены, после определенного времени (например 10 минут) пользователю начисляются награды в виде ревард токенов написанных на первой неделе. Количество токенов зависит от суммы застейканных ЛП токенов (например 20 процентов). Вывести застейканные ЛП токены также можно после определенного времени (например 20 минут).

// - Создать пул ликвидности
// - Реализовать функционал стейкинга в смарт контракте
// - Написать полноценные тесты к контракту
// - Написать скрипт деплоя
// - Задеплоить в тестовую сеть
// - Написать таски на stake, unstake, claim
// - Верифицировать контракт

// Требования
// - Функция stake(uint256 amount) - списывает с пользователя на контракт стейкинга ЛП токены в количестве amount, обновляет в контракте баланс пользователя
// - Функция claim() - списывает с контракта стейкинга ревард токены доступные в качестве наград
// - Функция unstake() - списывает с контракта стейкинга ЛП токены доступные для вывода
// - Функции админа для изменения параметров стейкинга (время заморозки, процент)