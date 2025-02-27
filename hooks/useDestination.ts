import { splitDomainTld, TldParser } from '@onsol/tldparser'
import { Connection, PublicKey } from '@solana/web3.js'
import { tryParseDomain, tryParseKey } from '@tools/validators/pubkey'
import { debounce } from '@utils/debounce'
import {
  TokenAccount,
  TokenProgramAccount,
  tryGetTokenAccount,
} from '@utils/tokens'
import { useEffect, useState } from 'react'

const getDestination = async (connection: Connection, address: string) => {
  let pubKey: PublicKey | null = null
  let account: TokenProgramAccount<TokenAccount> | undefined = undefined

  if (address.length >= 4 && address.split('.').length === 2) {
    const [tld] = splitDomainTld(address)
    if (tld === '.sol') {
      pubKey = await tryParseDomain(address)
    } else {
      const parser = new TldParser(connection)
      try {
        const owner = await parser.getOwnerFromDomainTld(address)
        pubKey = owner ?? null
      } catch (error) {
        console.warn('Error resolving domain:', error)
        pubKey = null
      }
    }
  } else {
    pubKey = tryParseKey(address)
  }
  console.log(pubKey?.toString())
  if (pubKey) {
    account = await tryGetTokenAccount(connection, pubKey)
  }

  return { pubKey, account }
}

export const useDestination = (connection: Connection, address: string) => {
  const [destinationAddress, setDestinationAddress] = useState<PublicKey>()
  const [destinationAccount, setDestinationAccount] =
    useState<TokenProgramAccount<TokenAccount>>()

  useEffect(() => {
    if (address) {
      debounce.debounceFcn(async () => {
        const { pubKey, account } = await getDestination(connection, address)

        if (pubKey) {
          setDestinationAddress(pubKey)
        } else {
          setDestinationAddress(undefined)
        }

        if (account) {
          setDestinationAccount(account)
        } else {
          setDestinationAccount(undefined)
        }
      })
    }
  }, [connection, address])

  return { destinationAccount, destinationAddress, setDestinationAddress }
}
