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

    
    function  stake(uint256 amount) public {

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