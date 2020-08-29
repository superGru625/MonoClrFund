import fs from 'fs'
import { ethers } from '@nomiclabs/buidler';
import { Keypair } from 'maci-domainobjs'

import { UNIT } from '../utils/constants'
import { MaciParameters } from '../utils/maci'

async function main() {
  // We're hardcoding factory address due to a buidler limitation:
  // https://github.com/nomiclabs/buidler/issues/651
  const factoryAddress = '0x3619DbE27d7c1e7E91aA738697Ae7Bc5FC3eACA5';
  const [
    deployer,
    coordinator,
    poolContributor,
    recipient1,
    recipient2,
    contributor1,
    contributor2,
  ] = await ethers.getSigners()

  // Deploy ERC20 token contract
  const Token = await ethers.getContractFactory(
    'AnyOldERC20Token',
    deployer,
  );
  const tokenInitialSupply = UNIT.mul(1000)
  const token = await Token.deploy(tokenInitialSupply)
  console.log(`Token deployed: ${token.address}`)
  await token.transfer(poolContributor.getAddress(), UNIT.mul(100))
  await token.transfer(contributor1.getAddress(), UNIT.mul(100))
  await token.transfer(contributor2.getAddress(), UNIT.mul(100))

  // Configure factory
  const factory = await ethers.getContractAt(
    'FundingRoundFactory',
    factoryAddress,
  );
  await factory.setToken(token.address);
  const coordinatorKeyPair = new Keypair()
  await factory.setCoordinator(
    coordinator.getAddress(),
    coordinatorKeyPair.pubKey.asContractParam(),
  )
  const maciParameters = new MaciParameters({
    signUpDuration: 300,  // 5 minutes
    votingDuration: 300,
  })
  await factory.setMaciParameters(...maciParameters.values())

  // Add to matching pool
  const poolContributionAmount = UNIT.mul(10)
  const poolContributorToken = token.connect(poolContributor);
  await poolContributorToken.approve(factory.address, poolContributionAmount);
  const poolContributorFactory = factory.connect(poolContributor);
  await poolContributorFactory.contribute(poolContributionAmount);

  // Add contributors
  await factory.addUser(contributor1.getAddress())
  await factory.addUser(contributor2.getAddress())

  // Add dummy recipients
  const metadataRecipient1 = {
    name: 'Commons Simulator: Modeling Sustainable Funding for Public Good',
    description: 'Funding open-source projects & other public goods is the killer app of blockchain tech. Giveth & BlockScience are joining forces to build the Commons Stack: a modular library of well engineered components that can be used to create economic models for projects that are creating value, yet have trouble finding sustainable business models.',
    imageHash: 'QmbMP2fMiy6ek5uQZaxG3bzT9gSqMWxpdCUcQg1iSeEFMU',
  }
  const metadataRecipient2 = {
    name: 'Synthereum: synthetic assets with liquidity pools to bridge traditional and digital finance',
    description: 'The aim of our synthetic assets is to help creating fiat-based wallet and applications on any local currencies, and help to create stock, commodities portfolio in order to bring more traditional users within the DeFi ecosystem.',
    imageHash: 'QmaDy75RkRVtZcbYeqMDLcCK8dDvahfik68zP7FbpxvD2F',
  }
  await factory.addRecipient(recipient1.getAddress(), JSON.stringify(metadataRecipient1));
  await factory.addRecipient(recipient2.getAddress(), JSON.stringify(metadataRecipient2));

  // Deploy new funding round and MACI
  await factory.deployNewRound();
  const fundingRoundAddress = await factory.getCurrentRound()
  console.log(`Funding round deployed: ${fundingRoundAddress}`)
  const fundingRound = await ethers.getContractAt(
    'FundingRound',
    fundingRoundAddress,
  )
  await factory.deployMaci();
  const maciAddress = await fundingRound.maci()
  console.log(`MACI deployed: ${maciAddress}`)

  // Save the current state of the round
  fs.writeFileSync('state.json', JSON.stringify({
    factory: factory.address,
    fundingRound: fundingRoundAddress,
    coordinator: {
      privKey: coordinatorKeyPair.privKey.serialize(),
      pubKey: coordinatorKeyPair.pubKey.serialize(),
    },
  }))
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
