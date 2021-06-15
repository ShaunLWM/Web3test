import BigNumber from "bignumber.js";
import { getAddress } from "../../utils/addressHelpers";
import { Farm } from "../types";

export const getTokenPricesFromFarm = (farms: Farm[]) => {
	return farms.reduce((prices, farm) => {
		const quoteTokenAddress = getAddress(farm.quoteToken.address).toLocaleLowerCase();
		const tokenAddress = getAddress(farm.token.address).toLocaleLowerCase();
		console.log(quoteTokenAddress, tokenAddress)
		/* eslint-disable no-param-reassign */
		if (!prices[quoteTokenAddress]) {
			prices[quoteTokenAddress] = new BigNumber(farm.quoteToken.busdPrice).toNumber();
		}
		if (!prices[tokenAddress]) {
			prices[tokenAddress] = new BigNumber(farm.token.busdPrice).toNumber();
		}
		/* eslint-enable no-param-reassign */
		return prices;
	}, {});
};
