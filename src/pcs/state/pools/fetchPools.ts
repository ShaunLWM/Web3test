import BigNumber from "bignumber.js";
import sousChefABI from "../../config/abi/sousChef.json";
import poolsConfig from "../../config/constants/pools";
import { getAddress } from "../../utils/addressHelpers";
import { multicall } from "../../utils/multicall";

export const fetchPoolsBlockLimits = async () => {
	const poolsWithEnd = poolsConfig.filter((p) => p.sousId !== 0);
	const callsStartBlock = poolsWithEnd.map((poolConfig) => {
		return {
			address: getAddress(poolConfig.contractAddress),
			name: "startBlock",
		};
	});
	const callsEndBlock = poolsWithEnd.map((poolConfig) => {
		return {
			address: getAddress(poolConfig.contractAddress),
			name: "bonusEndBlock",
		};
	});

	const starts = await multicall(sousChefABI, callsStartBlock);
	const ends = await multicall(sousChefABI, callsEndBlock);

	return poolsWithEnd.map((cakePoolConfig, index) => {
		const startBlock = starts[index];
		const endBlock = ends[index];
		return {
			sousId: cakePoolConfig.sousId,
			startBlock: new BigNumber(startBlock).toJSON(),
			endBlock: new BigNumber(endBlock).toJSON(),
		};
	});
};
