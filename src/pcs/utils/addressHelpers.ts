import { Address } from "../config/constants/types"
import addresses from "../config/constants/contracts";
import tokens from "../config/constants/tokens";

export const getAddress = (address: Address): string => {
  const mainNetChainId = 56
  // const chainId = process.env.REACT_APP_CHAIN_ID
  // return address[chainId] ? address[chainId] : address[mainNetChainId]
	return address[mainNetChainId];
}

export const getMulticallAddress = () => {
  return getAddress(addresses.multiCall)
}

export const getWbnbAddress = () => {
  return getAddress(tokens.wbnb.address)
}

export const getMasterChefAddress = () => {
  return getAddress(addresses.masterChef)
}