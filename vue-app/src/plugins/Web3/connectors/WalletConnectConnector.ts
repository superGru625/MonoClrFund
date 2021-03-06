import WalletConnectProvider from '@walletconnect/web3-provider'

export default {
  // TODO: add better return type
  connect: async (): Promise<any | undefined> => {
    const provider = new WalletConnectProvider({
      infuraId: process.env.VUE_APP_INFURA_ID,
      rpc: {
        [process.env.VUE_APP_ETHEREUM_API_CHAINID!]:
          process.env.VUE_APP_ETHEREUM_API_URL!,
      },
    })

    let accounts, chainId
    try {
      accounts = await provider.enable()
      chainId = await provider.request({ method: 'eth_chainId' })
    } catch (err) {
      if (err.code === 4001) {
        // EIP-1193 userRejectedRequest error
        // If this happens, the user rejected the connection request.
        /* eslint-disable-next-line no-console */
        console.log('Please connect to WalletConnect.')
      } else {
        /* eslint-disable-next-line no-console */
        console.error(err)
        return
      }
    }

    return {
      provider,
      accounts,
      chainId: Number(chainId),
    }
  },
}
