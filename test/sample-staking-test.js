const { ethers } = require("hardhat");
const chai = require("chai");
const { solidity } = require("ethereum-waffle");
chai.use(solidity);
const { expect } = chai;


function toToken(uintString) {
  return ethers.utils.parseUnits(uintString, 18);
}

const baseSupply = toToken("1");
const rewardTokenStartBallance = toToken("1000000000000000");
const baseHoldIntreval = 1800;
const basePercent = 20;



async function approve(contract, account, to, amount) {
  const entry = await contract.connect(account);
  await entry.approve(to.address, amount);

}

async function extractEvents(response) {
  return (await response.wait()).events;
}

async function stake(stakeContract, account, amount) {
  const entry = await stakeContract.connect(account);
  response = await entry.stake(amount);
  return (await extractEvents(response))[1].args;
}

async function unstake(stakeContract, account, amount) {
  const entry = await stakeContract.connect(account);
  response = await entry.unstake(amount);
  return (await extractEvents(response))[1].args;
}

async function winthdraw(stakeContract, account) {
  const entry = await stakeContract.connect(account);
  response = await entry.winthdraw();
  return (await extractEvents(response))[1].args;

}

function getNow() {
  return parseInt(Date.now() / 1000);
}


async function increaseBlockchainTime(time=baseHoldIntreval) {
  await ethers.provider.send("evm_increaseTime", [time]);
  await ethers.provider.send("evm_mine");
}


function countReward(deposit, percent, periods) {
  return deposit.mul(percent).div(100).mul(periods);
}


describe("SampleStaking", function () {
  let rewardToken, stakingToken, sampleStaking, owner, account_1, account_2;

  beforeEach(async function () {
    // await hre.network.provider.send("hardhat_reset");
    [owner, account_1, account_2] = await ethers.getSigners();
    const RewardToken = await ethers.getContractFactory("MockToken", owner);
    rewardToken = await RewardToken.deploy(
      "Defenetrly Not Scum Token",
      "DNST",
      18,
      baseSupply
    );
    const StakingToken = await ethers.getContractFactory("MockToken", owner);
    stakingToken = await StakingToken.deploy(
      "Uniswap V2",
      "UNI-V2",
      18,
      baseSupply
    );
  

    await rewardToken.deployed();
    await stakingToken.deployed();
    

    await stakingToken.mint(account_1.address, baseSupply);
    await stakingToken.mint(account_2.address, baseSupply);

    const SampleStaking = await ethers.getContractFactory("SampleStaking", owner);
    sampleStaking = await SampleStaking.deploy(
      stakingToken.address,
      rewardToken.address,
      baseHoldIntreval,
      basePercent
    );
    await rewardToken.mint(sampleStaking.address, rewardTokenStartBallance);
    await approve(stakingToken, account_2, sampleStaking, baseSupply);
    


  });

  it("check constructor", async function() {
    expect(await sampleStaking.percent()).to.equals(basePercent);
    expect(await sampleStaking.holdInterval()).to.equals(baseHoldIntreval);
    expect(await sampleStaking.rewardToken()).to.equals(rewardToken.address);
    expect(await sampleStaking.stakingToken()).to.equals(stakingToken.address);
  })
 
  it ("check count reward", async function() {
    expect(await sampleStaking.countReward(100, 10, 1)).to.equal(10);
    expect(await sampleStaking.countReward(100, 10, 2)).to.equal(20);
    expect(await sampleStaking.countReward(1000, 10, 3)).to.equal(300);
    expect(await sampleStaking.countReward(100, 10, 0)).to.equal(0);
  }) 

  it("check stake", async function () {
    await approve(stakingToken, account_1, sampleStaking, baseSupply.div(2));
    let now = getNow();
    const eventData = await stake(sampleStaking, account_1, baseSupply.div(2));
    expect(eventData.account).to.equal(account_1.address);
    expect(eventData.amount).to.equal(baseSupply.div(2));
    expect(await stakingToken.balanceOf(sampleStaking.address)).to.equal(baseSupply.div(2));
    let accountInfo = await sampleStaking.accountInfo(account_1.address);
    expect(accountInfo[0]).to.equal(baseSupply.div(2));
    expect(accountInfo[1]).to.be.at.least(now);
    expect(accountInfo[2]).to.equal(toToken('0'));
    await increaseBlockchainTime();
    accountInfo = await sampleStaking.accountInfo(account_1.address);
    expect(accountInfo[2]).to.equal(countReward(baseSupply.div(2), basePercent, 1));

    await stake(sampleStaking, account_1, 0);
    accountInfo = await sampleStaking.accountInfo(account_1.address);
    expect(accountInfo[2]).to.equal(countReward(baseSupply.div(2), basePercent, 1));

    await approve(stakingToken, account_1, sampleStaking, baseSupply.div(2));
    await stake(sampleStaking, account_1, baseSupply.div(2));
    await increaseBlockchainTime();
    accountInfo = await sampleStaking.accountInfo(account_1.address);
    expect(accountInfo[2], countReward(baseSupply.div(2), basePercent, 1).add(countReward(baseSupply, basePercent, 1)));

  })

  it('check unstake hold interval', async function () {
    await approve(stakingToken, account_1, sampleStaking, baseSupply);
    await stake(sampleStaking, account_1, baseSupply);
    const entry = await sampleStaking.connect(account_1);
    expect(entry.unstake(baseSupply)).to.be.revertedWith("hold interval isn't up");

  })

  it('check unstake balance', async function () {

    await approve(stakingToken, account_1, sampleStaking, baseSupply);
    await stake(sampleStaking, account_1, baseSupply);
    await increaseBlockchainTime();
    const entry = await sampleStaking.connect(account_1);
    expect(entry.unstake(baseSupply.mul(2))).to.be.revertedWith("not enough balance");

  })

  it('check unstake', async function() {
    await approve(stakingToken, account_1, sampleStaking, baseSupply);
    await stake(sampleStaking, account_1, baseSupply);
    await increaseBlockchainTime();
    await unstake(sampleStaking, account_1, baseSupply.div(2));
    let accountInfo = await sampleStaking.accountInfo(account_1.address);
    expect(accountInfo[0]).to.equal(baseSupply.div(2));
    expect(accountInfo[2]).to.equal(countReward(baseSupply, basePercent, 1));
    await increaseBlockchainTime();
    accountInfo = await sampleStaking.accountInfo(account_1.address);
    expect(accountInfo[2]).to.equal(countReward(baseSupply, basePercent, 1).add(countReward(baseSupply.div(2), basePercent, 1)));

  }) 

  it('check winthdraw', async function() {
    await approve(stakingToken, account_1, sampleStaking, baseSupply);
    await stake(sampleStaking, account_1, baseSupply);
    await increaseBlockchainTime();
    let eventData = await winthdraw(sampleStaking, account_1);
    let reward = countReward(baseSupply, basePercent, 1);
    expect(eventData[1]).to.equal(reward);
    expect(await rewardToken.balanceOf(account_1.address)).to.equal(reward);
    expect(await rewardToken.balanceOf(sampleStaking.address)).to.equal(rewardTokenStartBallance.sub(reward));

  })

  it('check set percent not owner', async function() {
    const entry = await sampleStaking.connect(account_1)
    expect(entry.setPercent(basePercent*2)).to.be.revertedWith("Ownable: caller is not the owner");

  })

  it('check set percent', async function() {
    await sampleStaking.setPercent(basePercent * 2)
    expect(await sampleStaking.percent()).to.equal(basePercent * 2)
  
  })

  it('check set percent not owner', async function() {
    const entry = await sampleStaking.connect(account_1)
    expect(entry.setPercent(basePercent * 2)).to.be.revertedWith("Ownable: caller is not the owner");

  })

  it('check set intreval not owner', async function() {
    const entry = await sampleStaking.connect(account_1)
    expect(entry.setHoldInterval(baseHoldIntreval * 2)).to.be.revertedWith("Ownable: caller is not the owner");

  })

  it('check set hold intreval', async function() {
    await sampleStaking.setHoldInterval(baseHoldIntreval * 2)
    expect(await sampleStaking.holdInterval()).to.equal(baseHoldIntreval * 2)
  
  })


  it('test claim not owner', async function() {
    const entry = await sampleStaking.connect(account_1)
    expect(entry.claim(account_1.address, 1)).to.be.revertedWith("Ownable: caller is not the owner");
  
  })

  it('test claim not enough balance', async function() {
    expect(sampleStaking.claim(account_1.address, 1)).to.be.revertedWith("not enough balance");
  
  })

  it ('test claim', async function() {
    await approve(stakingToken, account_1, sampleStaking, baseSupply);
    await stake(sampleStaking, account_1, baseSupply);
    await increaseBlockchainTime()
    const reward = countReward(baseSupply, basePercent, 1)
    await sampleStaking.claim(account_1.address, reward)
    const eventData = await sampleStaking.accountInfo(account_1.address)
    expect(eventData[2]).to.equal(0)
    expect(eventData[3]).to.equal(reward)
  })


  it('test unclaim not owner', async function() {
    const entry = await sampleStaking.connect(account_1)
    expect(entry.unclaim(account_1.address, 1)).to.be.revertedWith("Ownable: caller is not the owner");
  
  })

  it('test unclaim not enough balance', async function() {
    expect(sampleStaking.unclaim(account_1.address, 1)).to.be.revertedWith("not enough claimed balance");
  
  })

  it ('test unclaim', async function() {
    await approve(stakingToken, account_1, sampleStaking, baseSupply);
    await stake(sampleStaking, account_1, baseSupply);
    await increaseBlockchainTime()
    const reward = countReward(baseSupply, basePercent, 1)
    await sampleStaking.claim(account_1.address, reward)
    await sampleStaking.unclaim(account_1.address, reward)
    const eventData = await sampleStaking.accountInfo(account_1.address)
    expect(eventData[2]).to.equal(reward)
    expect(eventData[3]).to.equal(0)
  })





});
