import BigNumber from "bignumber.js";
import { Address, PoolConfig, Token } from "../config/constants/types";

export interface Pool extends PoolConfig {
	totalStaked?: BigNumber;
	stakingLimit?: BigNumber;
	startBlock?: number;
	endBlock?: number;
	apr?: number;
	stakingTokenPrice?: number;
	earningTokenPrice?: number;
	isAutoVault?: boolean;
	userData?: {
		allowance: BigNumber;
		stakingTokenBalance: BigNumber;
		stakedBalance: BigNumber;
		pendingReward: BigNumber;
	};
}

export interface PoolsState {
	data: Pool[];
	cakeVault: CakeVault;
	userDataLoaded: boolean;
}

export interface CakeVault {
	totalShares?: string;
	pricePerFullShare?: string;
	totalCakeInVault?: string;
	estimatedCakeBountyReward?: string;
	totalPendingCakeHarvest?: string;
	fees?: VaultFees;
	userData?: VaultUser;
}

export interface VaultFees {
	performanceFee: number;
	callFee: number;
	withdrawalFee: number;
	withdrawalFeePeriod: number;
}

export interface VaultUser {
	isLoading: boolean;
	userShares: string;
	cakeAtLastUserAction: string;
	lastDepositedTime: string;
	lastUserActionTime: string;
}

export type SerializedBigNumber = string;

export interface FarmConfig {
	pid: number;
	lpSymbol: string;
	lpAddresses: Address;
	token: Token;
	quoteToken: Token;
	multiplier?: string;
	isCommunity?: boolean;
	dual?: {
		rewardPerBlock: number;
		earnLabel: string;
		endBlock: number;
	};
}

export interface Farm extends FarmConfig {
	tokenAmountMc?: SerializedBigNumber;
	quoteTokenAmountMc?: SerializedBigNumber;
	tokenAmountTotal?: SerializedBigNumber;
	quoteTokenAmountTotal?: SerializedBigNumber;
	lpTotalInQuoteToken?: SerializedBigNumber;
	lpTotalSupply?: SerializedBigNumber;
	tokenPriceVsQuote?: SerializedBigNumber;
	poolWeight?: SerializedBigNumber;
	userData?: {
		allowance: string;
		tokenBalance: string;
		stakedBalance: string;
		earnings: string;
	};
}
