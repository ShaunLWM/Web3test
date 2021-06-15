import Web3 from "web3";
import { fetchPoolsBlockLimits, fetchPoolsTotalStaking } from "./utils/fetchPools";
import poolsConfig from "./config/constants/pools";
import { getAddress } from "./utils/addressHelpers";
import { getPoolApr } from "./utils/apr";
import BigNumber from "bignumber.js";
import { getBalanceNumber } from "./utils/formatBalance";
import { getTokenPricesFromFarm } from "./state/pools/helpers";
import { Farm, PoolsState } from "./state/types";
import farmsConfig from "./config/constants/farms";
import priceHelperLpsConfig from "./config/constants/priceHelperLps";
import fetchFarms from "./state/farms/fetchFarms";
import fetchFarmsPrices from "./utils/fetchFarmsPrices";

let noAccountFarmConfig = farmsConfig.map((farm) => ({
	...farm,
	userData: {
		allowance: "0",
		tokenBalance: "0",
		stakedBalance: "0",
		earnings: "0",
	},
}));

const initialState: PoolsState = {
	data: [...poolsConfig],
	userDataLoaded: false,
	cakeVault: {
		totalShares: null,
		pricePerFullShare: null,
		totalCakeInVault: null,
		estimatedCakeBountyReward: null,
		totalPendingCakeHarvest: null,
		fees: {
			performanceFee: null,
			callFee: null,
			withdrawalFee: null,
			withdrawalFeePeriod: null,
		},
		userData: {
			isLoading: true,
			userShares: null,
			cakeAtLastUserAction: null,
			lastDepositedTime: null,
			lastUserActionTime: null,
		},
	},
};

(async () => {
	const web3 = new Web3("https://bsc-dataseed1.binance.org:443");

	const farmsToFetch = farmsConfig.filter((farmConfig) => [251, 252].includes(farmConfig.pid));

	// Add price helper farms
	const farmsWithPriceHelpers = farmsToFetch.concat(priceHelperLpsConfig);

	const farms = await fetchFarms(farmsWithPriceHelpers);
	const farmsWithPrices = await fetchFarmsPrices(farms);

	// Filter out price helper LP config farms
	const farmsWithoutHelperLps = farmsWithPrices.filter((farm: Farm) => {
		return farm.pid || farm.pid === 0;
	});

	noAccountFarmConfig = noAccountFarmConfig.map((farm) => {
		const liveFarmData = farmsWithoutHelperLps.find((farmData) => farmData.pid === farm.pid);
		return { ...farm, ...liveFarmData };
	});

	const currentBlock = await web3.eth.getBlockNumber();
	console.log(`CurrentBlock: ${currentBlock}`);
	const blockLimits = await fetchPoolsBlockLimits();
	console.log(blockLimits);
	const totalStakings = await fetchPoolsTotalStaking();
	console.log(totalStakings);
	const prices = getTokenPricesFromFarm(noAccountFarmConfig);

	const liveData = poolsConfig.map((pool) => {
		const blockLimit = blockLimits.find((entry) => entry.sousId === pool.sousId);
		const totalStaking = totalStakings.find((entry) => entry.sousId === pool.sousId);
		const isPoolEndBlockExceeded = currentBlock > 0 && blockLimit ? currentBlock > Number(blockLimit.endBlock) : false;
		const isPoolFinished = pool.isFinished || isPoolEndBlockExceeded;

		const stakingTokenAddress = pool.stakingToken.address ? getAddress(pool.stakingToken.address).toLowerCase() : null;
		const stakingTokenPrice = stakingTokenAddress ? prices[stakingTokenAddress] : 0;

		const earningTokenAddress = pool.earningToken.address ? getAddress(pool.earningToken.address).toLowerCase() : null;
		const earningTokenPrice = earningTokenAddress ? prices[earningTokenAddress] : 0;
		const apr = !isPoolFinished
			? getPoolApr(
					stakingTokenPrice,
					earningTokenPrice,
					getBalanceNumber(new BigNumber(totalStaking.totalStaked), pool.stakingToken.decimals),
					parseFloat(pool.tokenPerBlock)
			  )
			: 0;

		if (!isPoolFinished)
			console.log({
				...blockLimit,
				...totalStaking,
				stakingTokenPrice,
				earningTokenPrice,
				apr,
				isFinished: isPoolFinished,
			});
	});
})();
