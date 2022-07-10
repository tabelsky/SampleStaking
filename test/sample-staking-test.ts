import { ethers } from "hardhat";
import { Contract, Signer, BigNumber } from "ethers";
import { expect } from "chai";


function toToken(uintString: string) {
  return ethers.utils.parseUnits(uintString, 18);
}

const baseSupply = toToken("1");
const rewardTokenStartBallance = toToken("1000000000000000");
const baseHoldIntreval = 1800;
const basePercent = 20;



async function approve(contract: Contract, account: Signer, address: String, amount: BigNumber) {
  const entry = await contract.connect(account);
  await entry.approve(address, amount);
  
}


async function extractEvents(response: any) {
  return (await response.wait()).events;
}

async function stake(stakeContract: Contract, account: Signer, amount: BigNumber) {
  const entry = await stakeContract.connect(account);
  const response = await entry.stake(amount);
  return (await extractEvents(response))[1].args;
}

async function unstake(stakeContract: Contract, account: Signer, amount: BigNumber) {
  const entry = await stakeContract.connect(account);
  const response = await entry.unstake(amount);
  return (await extractEvents(response))[1].args;
}

async function winthdraw(stakeContract: Contract, account: Signer) {
  const entry = await stakeContract.connect(account);
  const response = await entry.winthdraw();
  return (await extractEvents(response))[1].args;

}


async function increaseBlockchainTime(time: number = baseHoldIntreval) {
  await ethers.provider.send("evm_increaseTime", [time]);
  await ethers.provider.send("evm_mine", []);
}


function countReward(deposit: BigNumber, percent: number, periods: number) {
  return deposit.mul(percent).div(100).mul(periods);
}


describe("SampleStaking", function () {
  let rewardToken : Contract, stakingToken: Contract, sampleStaking: Contract, owner: Signer, account_1: Signer, account_2: Signer;

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
  

    await rewardToken.deployed();
    await stakingToken.deployed();
    

    await stakingToken.mint(await account_1.getAddress(), baseSupply);
    await stakingToken.mint(await account_2.getAddress(), baseSupply);

    const SampleStaking = await ethers.getContractFactory("SampleStaking", owner);
    sampleStaking = await SampleStaking.deploy(
      stakingToken.address,
      rewardToken.address,
      baseHoldIntreval,
      basePercent
    );
    await rewardToken.mint(sampleStaking.address, rewardTokenStartBallance);
    await approve(stakingToken, account_2, sampleStaking.address, baseSupply);
    


  });

  it("check constructor", async function() {
    expect(await sampleStaking.percent()).to.equals(basePercent);
    expect(await sampleStaking.holdInterval()).to.equals(baseHoldIntreval);
    expect(await sampleStaking.rewardToken()).to.equals(rewardToken.address);
    expect(await sampleStaking.stakingToken()).to.equals(stakingToken.address);
  })
 

  it("check stake", async function () {
    await approve(stakingToken, account_1, sampleStaking.address, baseSupply.div(2));
    const eventData = await stake(sampleStaking, account_1, baseSupply.div(2));
    expect(eventData.account).to.equal(await account_1.getAddress());
    expect(eventData.amount).to.equal(baseSupply.div(2));
    expect(await stakingToken.balanceOf(sampleStaking.address)).to.equal(baseSupply.div(2));
    await increaseBlockchainTime();
    await stake(sampleStaking, account_1, toToken('0'));
    await approve(stakingToken, account_1, sampleStaking.address, baseSupply.div(2));
    await stake(sampleStaking, account_1, baseSupply.div(2));
    await increaseBlockchainTime();
    await winthdraw(sampleStaking, account_1);
    expect(await rewardToken.balanceOf(await account_1.getAddress())).to.equal(countReward(baseSupply.div(2), basePercent, 1).add(countReward(baseSupply, basePercent, 1)))

  })

  it('check unstake hold interval', async function () {
    await approve(stakingToken, account_1, sampleStaking.address, baseSupply);
    await stake(sampleStaking, account_1, baseSupply);
    const entry = await sampleStaking.connect(account_1);
    expect(entry.unstake(baseSupply)).to.be.revertedWith("hold interval isn't up");

  })

  it('check unstake', async function() {
    await approve(stakingToken, account_1, sampleStaking.address, baseSupply);
    await stake(sampleStaking, account_1, baseSupply);
    await increaseBlockchainTime();
    await unstake(sampleStaking, account_1, baseSupply.div(2));
    expect(await stakingToken.balanceOf(sampleStaking.address)).to.equal(baseSupply.div(2));
    expect(await stakingToken.balanceOf(await account_1.getAddress())).to.equal(baseSupply.div(2));

  }) 

  it('check winthdraw', async function() {
    await approve(stakingToken, account_1, sampleStaking.address, baseSupply);
    await stake(sampleStaking, account_1, baseSupply);
    await increaseBlockchainTime();
    let eventData = await winthdraw(sampleStaking, account_1);
    let reward = countReward(baseSupply, basePercent, 1);
    expect(eventData[1]).to.equal(reward);
    expect(await rewardToken.balanceOf(await account_1.getAddress())).to.equal(reward);
    expect(await rewardToken.balanceOf(sampleStaking.address)).to.equal(rewardTokenStartBallance.sub(reward));

  })

  it('check set percent not owner', async function() {
    const entry = await sampleStaking.connect(account_1)
    expect(entry.setPercent(basePercent*2)).to.be.revertedWith("Ownable: caller is not the owner");

  })

  it('check set percent', async function() {
    await sampleStaking.setPercent(basePercent * 2);
    expect(await sampleStaking.percent()).to.equal(basePercent * 2);
  
  })

  it('check set percent not owner', async function() {
    const entry = await sampleStaking.connect(account_1);
    expect(entry.setPercent(basePercent * 2)).to.be.revertedWith("Ownable: caller is not the owner");

  })

  it('check set intreval not owner', async function() {
    const entry = await sampleStaking.connect(account_1);
    expect(entry.setHoldInterval(baseHoldIntreval * 2)).to.be.revertedWith("Ownable: caller is not the owner");

  })

  it('check set hold intreval', async function() {
    await sampleStaking.setHoldInterval(baseHoldIntreval * 2);
    expect(await sampleStaking.holdInterval()).to.equal(baseHoldIntreval * 2);
  
  })


  it('test claim not owner', async function() {
    const entry = await sampleStaking.connect(account_1);
    expect(entry.claim(await account_1.getAddress())).to.be.revertedWith("Ownable: caller is not the owner");
  
  })


  it ('test claim', async function() {
    await approve(stakingToken, account_1, sampleStaking.address, baseSupply);
    await stake(sampleStaking, account_1, baseSupply);
    await increaseBlockchainTime();
    await sampleStaking.claim(await account_1.getAddress());
    await winthdraw(sampleStaking, account_1);
    expect(await rewardToken.balanceOf(await account_1.getAddress())).to.equal(0);

  })

});
