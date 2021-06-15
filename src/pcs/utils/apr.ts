import BigNumber from "bignumber.js";
import { BLOCKS_PER_YEAR } from "../config";

export const getPoolApr = (
	stakingTokenPrice: number,
	rewardTokenPrice: number,
	totalStaked: number,
	tokenPerBlock: number
): number | null => {
	const totalRewardPricePerYear = new BigNumber(rewardTokenPrice).times(tokenPerBlock).times(BLOCKS_PER_YEAR);
	const totalStakingTokenInPool = new BigNumber(stakingTokenPrice).times(totalStaked);
	const apr = totalRewardPricePerYear.div(totalStakingTokenInPool).times(100);
	return apr.isNaN() || !apr.isFinite() ? null : apr.toNumber();
};
