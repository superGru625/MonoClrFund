import { waffle, artifacts } from 'hardhat'
import { Contract } from 'ethers'
import { use, expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { deployMockContract } from '@ethereum-waffle/mock-contract'
import { Keypair } from 'maci-domainobjs'

import { getGasUsage } from '../utils/contracts'
import { deployMaciFactory } from '../utils/deployment'
import { MaciParameters } from '../utils/maci'

use(solidity)

describe('MACI factory', () => {
  const provider = waffle.provider
  const [, deployer, coordinator] = provider.getWallets()

  let maciFactory: Contract
  let signUpGatekeeper: Contract
  let initialVoiceCreditProxy: Contract
  let maciParameters: MaciParameters
  const coordinatorPubKey = new Keypair().pubKey.asContractParam()

  beforeEach(async () => {
    maciFactory = await deployMaciFactory(deployer)
    expect(await getGasUsage(maciFactory.deployTransaction)).lessThan(5600000)
    maciParameters = await MaciParameters.read(maciFactory)

    const SignUpGatekeeperArtifact = await artifacts.readArtifact(
      'SignUpGatekeeper'
    )
    signUpGatekeeper = await deployMockContract(
      deployer,
      SignUpGatekeeperArtifact.abi
    )
    const InitialVoiceCreditProxyArtifact = await artifacts.readArtifact(
      'InitialVoiceCreditProxy'
    )
    initialVoiceCreditProxy = await deployMockContract(
      deployer,
      InitialVoiceCreditProxyArtifact.abi
    )
  })

  it('sets default MACI parameters', async () => {
    const { maxUsers, maxMessages, maxVoteOptions } =
      await maciFactory.maxValues()
    expect(maxUsers).to.equal(4294967295)
    expect(maxMessages).to.equal(4294967295)
    expect(maxVoteOptions).to.equal(124)
    expect(await maciFactory.signUpDuration()).to.equal(604800)
    expect(await maciFactory.votingDuration()).to.equal(604800)
  })

  it('sets MACI parameters', async () => {
    maciParameters.update({
      stateTreeDepth: 32,
      messageTreeDepth: 32,
      voteOptionTreeDepth: 3,
      signUpDuration: 86400,
      votingDuration: 86400,
    })
    await expect(
      maciFactory.setMaciParameters(...maciParameters.values())
    ).to.emit(maciFactory, 'MaciParametersChanged')

    const { maxUsers, maxMessages, maxVoteOptions } =
      await maciFactory.maxValues()
    expect(maxUsers).to.equal(2 ** maciParameters.stateTreeDepth - 1)
    expect(maxMessages).to.equal(2 ** maciParameters.messageTreeDepth - 1)
    expect(maxVoteOptions).to.equal(5 ** maciParameters.voteOptionTreeDepth - 1)
    expect(await maciFactory.signUpDuration()).to.equal(
      maciParameters.signUpDuration
    )
    expect(await maciFactory.votingDuration()).to.equal(
      maciParameters.votingDuration
    )
  })

  it('does not allow to decrease the vote option tree depth', async () => {
    maciParameters.voteOptionTreeDepth = 1
    await expect(
      maciFactory.setMaciParameters(...maciParameters.values())
    ).to.be.revertedWith(
      'MACIFactory: Vote option tree depth can not be decreased'
    )
  })

  it('allows only owner to set MACI parameters', async () => {
    const coordinatorMaciFactory = maciFactory.connect(coordinator)
    await expect(
      coordinatorMaciFactory.setMaciParameters(...maciParameters.values())
    ).to.be.revertedWith('Ownable: caller is not the owner')
  })

  it('deploys MACI', async () => {
    const maciDeployed = maciFactory.deployMaci(
      signUpGatekeeper.address,
      initialVoiceCreditProxy.address,
      coordinator.address,
      coordinatorPubKey
    )
    await expect(maciDeployed).to.emit(maciFactory, 'MaciDeployed')

    const deployTx = await maciDeployed
    expect(await getGasUsage(deployTx)).lessThan(9020000)
  })

  it('allows only owner to deploy MACI', async () => {
    const coordinatorMaciFactory = maciFactory.connect(coordinator)
    await expect(
      coordinatorMaciFactory.deployMaci(
        signUpGatekeeper.address,
        initialVoiceCreditProxy.address,
        coordinator.address,
        coordinatorPubKey
      )
    ).to.be.revertedWith('Ownable: caller is not the owner')
  })
})
