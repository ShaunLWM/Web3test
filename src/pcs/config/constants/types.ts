export interface FarmConfig {
  pid: number
  lpSymbol: string
  lpAddresses: Address
  token: Token
  quoteToken: Token
  multiplier?: string
  isCommunity?: boolean
  dual?: {
    rewardPerBlock: number
    earnLabel: string
    endBlock: number
  }
}

export interface Address {
	97?: string;
	56: string;
}

export interface Token {
	symbol: string;
	address?: Address;
	decimals?: number;
	projectLink?: string;
	busdPrice?: string;
}

export interface PoolConfig {
	sousId: number;
	earningToken: Token;
	stakingToken: Token;
	contractAddress: Address;
	poolCategory: PoolCategory;
	tokenPerBlock: string;
	sortOrder?: number;
	harvest?: boolean;
	isFinished?: boolean;
	enableEmergencyWithdraw?: boolean;
}

export enum PoolCategory {
	"COMMUNITY" = "Community",
	"CORE" = "Core",
	"BINANCE" = "Binance", // Pools using native BNB behave differently than pools using a token
	"AUTO" = "Auto",
}
