const { ethers } = require("hardhat");
const chai = require("chai");
const { solidity } = require("ethereum-waffle");
chai.use(solidity);
const { expect } = chai;


function toToken(uintString) {
  return ethers.utils.parseUnits(uintString, 18);
}

const baseSupply = toToken("1");
const stakingTokenStartBallance = toToken("1000000000000000");
const baseHoldIntreval = 1800;
const basePercent = 20;


async function increaseBlockchainTime(time=baseHoldIntreval) {
  await ethers.provider.send("evm_increaseTime", [time]);
  await ethers.provider.send("evm_mine");
}


async function approve(contract, account, to, amount) {
  const entry = await contract.connect(account)
  await entry.approve(to.address, amount)

}

async function extractEvents(response) {
  return (await response.wait()).events
}

async function stake(stakeContract, account, amount) {
  const entry = await stakeContract.connect(account)
  response = await entry.stake(amount)
  return (await extractEvents(response))[1].args
}

function getNow() {
  return parseInt(Date.now() / 1000)
}


describe("SampleStaking", function () {
  let rewardToken, stakingToken, sampleStaking, owner, account_1, account_2;

  beforeEach(async function () {
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
  

    await rewardToken.deployed()
    await stakingToken.deployed();
    await rewardToken.mint(account_1.address, baseSupply)
    await rewardToken.mint(account_2.address, baseSupply)
    await stakingToken.mint(account_1.address, baseSupply)
    await stakingToken.mint(account_2.address, baseSupply)

    const SampleStaking = await ethers.getContractFactory("SampleStaking", owner);
    sampleStaking = await SampleStaking.deploy(
      stakingToken.address,
      rewardToken.address,
      baseHoldIntreval,
      basePercent
    );
    await stakingToken.mint(sampleStaking.address, stakingTokenStartBallance)

    


  });

  it ("check compount interest", async function() {
    expect(await sampleStaking.compound(100, 10, 1)).to.equal(10)
    expect(await sampleStaking.compound(100, 10, 2)).to.equal(21)
    expect(await sampleStaking.compound(1000, 10, 3)).to.equal(331)
    expect(await sampleStaking.compound(100, 10, 0)).to.equal(0)
  }) 

  it("check stake", async function () {
    await approve(stakingToken, account_1, sampleStaking, baseSupply.div(2))
    let now = getNow();
    const eventData = await stake(sampleStaking, account_1, baseSupply.div(2))
    expect(eventData.account).to.equal(account_1.address)
    expect(eventData.amount).to.equal(baseSupply.div(2))
    expect(await stakingToken.balanceOf(sampleStaking.address)).to.equal(stakingTokenStartBallance.add(baseSupply.div(2)))
    let accountInfo = await sampleStaking.accountInfo(account_1.address)
    expect(accountInfo[0]).to.equal(baseSupply.div(2))
    expect(accountInfo[1]).to.be.at.least(now)
    expect(accountInfo[2]).to.equal(toToken('0'))
    await increaseBlockchainTime()
    await stake(sampleStaking, account_1, 0)
    accountInfo = await sampleStaking.accountInfo(account_1.address)
    expect(accountInfo[2]).to.equal(baseSupply.div(2).mul(20).div(100))
    // await increaseBlockchainTime(baseHoldIntreval * 2)
    // await stake(sampleStaking, account_1, 0)
    // accountInfo = await sampleStaking.accountInfo(account_1.address)
    // console.log(accountInfo)

  })
it('check stacke compount', async function () {
  await approve(stakingToken, account_1, sampleStaking, baseSupply.div(2))
  await stake(sampleStaking, account_1, baseSupply.div(2))
  await increaseBlockchainTime(baseHoldIntreval * 3)
  accountInfo = await sampleStaking.accountInfo(account_1.address)
  expect(accountInfo[2]).to.equal(ethers.BigNumber.from('364000000000000000'))
}
)


});
