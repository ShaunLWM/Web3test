import BigNumber from "bignumber.js";
import fs from "fs-extra";
import Web3 from "web3";
import { AbiItem } from "web3-utils";
import { getBscPrices, loadBscChefContract } from "./helper";

const web3 = new Web3("https://bsc-dataseed1.binance.org:443");
// bunny - 0xc9849e6fdb743d08faee3e34dd2d1bc69ea11a51
const PANCAKE_CHEF_ABI = [
	{
		inputs: [
			{ internalType: "contract CakeToken", name: "_cake", type: "address" },
			{ internalType: "contract SyrupBar", name: "_syrup", type: "address" },
			{ internalType: "address", name: "_devaddr", type: "address" },
			{ internalType: "uint256", name: "_cakePerBlock", type: "uint256" },
			{ internalType: "uint256", name: "_startBlock", type: "uint256" },
		],
		stateMutability: "nonpayable",
		type: "constructor",
	},
	{
		anonymous: false,
		inputs: [
			{ indexed: true, internalType: "address", name: "user", type: "address" },
			{ indexed: true, internalType: "uint256", name: "pid", type: "uint256" },
			{ indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
		],
		name: "Deposit",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{ indexed: true, internalType: "address", name: "user", type: "address" },
			{ indexed: true, internalType: "uint256", name: "pid", type: "uint256" },
			{ indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
		],
		name: "EmergencyWithdraw",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{ indexed: true, internalType: "address", name: "previousOwner", type: "address" },
			{ indexed: true, internalType: "address", name: "newOwner", type: "address" },
		],
		name: "OwnershipTransferred",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{ indexed: true, internalType: "address", name: "user", type: "address" },
			{ indexed: true, internalType: "uint256", name: "pid", type: "uint256" },
			{ indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
		],
		name: "Withdraw",
		type: "event",
	},
	{
		inputs: [],
		name: "BONUS_MULTIPLIER",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "uint256", name: "_allocPoint", type: "uint256" },
			{ internalType: "contract IBEP20", name: "_lpToken", type: "address" },
			{ internalType: "bool", name: "_withUpdate", type: "bool" },
		],
		name: "add",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [],
		name: "cake",
		outputs: [{ internalType: "contract CakeToken", name: "", type: "address" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "cakePerBlock",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "uint256", name: "_pid", type: "uint256" },
			{ internalType: "uint256", name: "_amount", type: "uint256" },
		],
		name: "deposit",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [{ internalType: "address", name: "_devaddr", type: "address" }],
		name: "dev",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [],
		name: "devaddr",
		outputs: [{ internalType: "address", name: "", type: "address" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [{ internalType: "uint256", name: "_pid", type: "uint256" }],
		name: "emergencyWithdraw",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [{ internalType: "uint256", name: "_amount", type: "uint256" }],
		name: "enterStaking",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "uint256", name: "_from", type: "uint256" },
			{ internalType: "uint256", name: "_to", type: "uint256" },
		],
		name: "getMultiplier",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [{ internalType: "uint256", name: "_amount", type: "uint256" }],
		name: "leaveStaking",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{ inputs: [], name: "massUpdatePools", outputs: [], stateMutability: "nonpayable", type: "function" },
	{
		inputs: [{ internalType: "uint256", name: "_pid", type: "uint256" }],
		name: "migrate",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [],
		name: "migrator",
		outputs: [{ internalType: "contract IMigratorChef", name: "", type: "address" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "owner",
		outputs: [{ internalType: "address", name: "", type: "address" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "uint256", name: "_pid", type: "uint256" },
			{ internalType: "address", name: "_user", type: "address" },
		],
		name: "pendingCake",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		name: "poolInfo",
		outputs: [
			{ internalType: "contract IBEP20", name: "lpToken", type: "address" },
			{ internalType: "uint256", name: "allocPoint", type: "uint256" },
			{ internalType: "uint256", name: "lastRewardBlock", type: "uint256" },
			{ internalType: "uint256", name: "accCakePerShare", type: "uint256" },
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "poolLength",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{ inputs: [], name: "renounceOwnership", outputs: [], stateMutability: "nonpayable", type: "function" },
	{
		inputs: [
			{ internalType: "uint256", name: "_pid", type: "uint256" },
			{ internalType: "uint256", name: "_allocPoint", type: "uint256" },
			{ internalType: "bool", name: "_withUpdate", type: "bool" },
		],
		name: "set",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [{ internalType: "contract IMigratorChef", name: "_migrator", type: "address" }],
		name: "setMigrator",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [],
		name: "startBlock",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "syrup",
		outputs: [{ internalType: "contract SyrupBar", name: "", type: "address" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "totalAllocPoint",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
		name: "transferOwnership",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [{ internalType: "uint256", name: "multiplierNumber", type: "uint256" }],
		name: "updateMultiplier",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [{ internalType: "uint256", name: "_pid", type: "uint256" }],
		name: "updatePool",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "uint256", name: "", type: "uint256" },
			{ internalType: "address", name: "", type: "address" },
		],
		name: "userInfo",
		outputs: [
			{ internalType: "uint256", name: "amount", type: "uint256" },
			{ internalType: "uint256", name: "rewardDebt", type: "uint256" },
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "uint256", name: "_pid", type: "uint256" },
			{ internalType: "uint256", name: "_amount", type: "uint256" },
		],
		name: "withdraw",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
];

const PANCAKE_CHEF_ADDR = "0x73feaa1eE314F8c655E354234017bE2193C9E24E"
const rewardTokenTicker = "cake";

const abi = fs.readJsonSync("./src/bunny.json");
(async () => {
	// Contract(ERC20 ABI, "TOKEN ADDRESS THAT YOU ARE CHECKING. EG. CAKE");
	// const contract = new web3.eth.Contract(abi, "0xCADc8CB26c8C7cB46500E61171b5F27e9bd7889D");
	// const balance = await contract.methods.balanceOf("0xfc6de95c9b05e88fc1c645cd5f567e789dcfb614").call();
	// console.log(balance);
	// console.log(new BigNumber(balance).shiftedBy(-18).toFixed(5));

	const PANCAKE_CHEF = new web3.eth.Contract(
		PANCAKE_CHEF_ABI as unknown as AbiItem[],
		"0x73feaa1eE314F8c655E354234017bE2193C9E24E"
	);

	const rewardsPerWeek = (((await PANCAKE_CHEF.methods.cakePerBlock().call()) / 1e18) * 604800) / 3;

	const tokens = {};
	const prices = await getBscPrices();
	// console.log(
	// 	tokens,
	// 	prices,
	// 	PANCAKE_CHEF,
	// 	PANCAKE_CHEF_ADDR,
	// 	PANCAKE_CHEF_ABI,
	// 	rewardTokenTicker,
	// 	"cake",
	// 	null,
	// 	rewardsPerWeek,
	// 	"pendingCake"
	// );

	
	await loadBscChefContract(
		tokens,
		prices,
		PANCAKE_CHEF,
		PANCAKE_CHEF_ADDR,
		PANCAKE_CHEF_ABI,
		rewardTokenTicker,
		"cake",
		null,
		rewardsPerWeek,
		"pendingCake"
	);

	// --------------------------------------------
	/*const provider = new Web3.providers.HttpProvider("https://bsc-dataseed3.ninicoin.io/", {
		timeout: 120000,
	});
	const web3 = new Web3(provider);
	const autoContract = new web3.eth.Contract(
		[
			{
				anonymous: false,
				inputs: [
					{ indexed: true, internalType: "address", name: "owner", type: "address" },
					{ indexed: true, internalType: "address", name: "spender", type: "address" },
					{ indexed: false, internalType: "uint256", name: "value", type: "uint256" },
				],
				name: "Approval",
				type: "event",
			},
			{
				anonymous: false,
				inputs: [
					{ indexed: true, internalType: "address", name: "delegator", type: "address" },
					{ indexed: true, internalType: "address", name: "fromDelegate", type: "address" },
					{ indexed: true, internalType: "address", name: "toDelegate", type: "address" },
				],
				name: "DelegateChanged",
				type: "event",
			},
			{
				anonymous: false,
				inputs: [
					{ indexed: true, internalType: "address", name: "delegate", type: "address" },
					{ indexed: false, internalType: "uint256", name: "previousBalance", type: "uint256" },
					{ indexed: false, internalType: "uint256", name: "newBalance", type: "uint256" },
				],
				name: "DelegateVotesChanged",
				type: "event",
			},
			{
				anonymous: false,
				inputs: [
					{ indexed: true, internalType: "address", name: "previousOwner", type: "address" },
					{ indexed: true, internalType: "address", name: "newOwner", type: "address" },
				],
				name: "OwnershipTransferred",
				type: "event",
			},
			{
				anonymous: false,
				inputs: [
					{ indexed: true, internalType: "address", name: "from", type: "address" },
					{ indexed: true, internalType: "address", name: "to", type: "address" },
					{ indexed: false, internalType: "uint256", name: "value", type: "uint256" },
				],
				name: "Transfer",
				type: "event",
			},
			{
				inputs: [],
				name: "DELEGATION_TYPEHASH",
				outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
				stateMutability: "view",
				type: "function",
			},
			{
				inputs: [],
				name: "DOMAIN_TYPEHASH",
				outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
				stateMutability: "view",
				type: "function",
			},
			{
				inputs: [
					{ internalType: "address", name: "owner", type: "address" },
					{ internalType: "address", name: "spender", type: "address" },
				],
				name: "allowance",
				outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
				stateMutability: "view",
				type: "function",
			},
			{
				inputs: [
					{ internalType: "address", name: "spender", type: "address" },
					{ internalType: "uint256", name: "amount", type: "uint256" },
				],
				name: "approve",
				outputs: [{ internalType: "bool", name: "", type: "bool" }],
				stateMutability: "nonpayable",
				type: "function",
			},
			{
				inputs: [{ internalType: "address", name: "account", type: "address" }],
				name: "balanceOf",
				outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
				stateMutability: "view",
				type: "function",
			},
			{
				inputs: [
					{ internalType: "address", name: "", type: "address" },
					{ internalType: "uint32", name: "", type: "uint32" },
				],
				name: "checkpoints",
				outputs: [
					{ internalType: "uint32", name: "fromBlock", type: "uint32" },
					{ internalType: "uint256", name: "votes", type: "uint256" },
				],
				stateMutability: "view",
				type: "function",
			},
			{
				inputs: [],
				name: "decimals",
				outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
				stateMutability: "view",
				type: "function",
			},
			{
				inputs: [
					{ internalType: "address", name: "spender", type: "address" },
					{ internalType: "uint256", name: "subtractedValue", type: "uint256" },
				],
				name: "decreaseAllowance",
				outputs: [{ internalType: "bool", name: "", type: "bool" }],
				stateMutability: "nonpayable",
				type: "function",
			},
			{
				inputs: [{ internalType: "address", name: "delegatee", type: "address" }],
				name: "delegate",
				outputs: [],
				stateMutability: "nonpayable",
				type: "function",
			},
			{
				inputs: [
					{ internalType: "address", name: "delegatee", type: "address" },
					{ internalType: "uint256", name: "nonce", type: "uint256" },
					{ internalType: "uint256", name: "expiry", type: "uint256" },
					{ internalType: "uint8", name: "v", type: "uint8" },
					{ internalType: "bytes32", name: "r", type: "bytes32" },
					{ internalType: "bytes32", name: "s", type: "bytes32" },
				],
				name: "delegateBySig",
				outputs: [],
				stateMutability: "nonpayable",
				type: "function",
			},
			{
				inputs: [{ internalType: "address", name: "delegator", type: "address" }],
				name: "delegates",
				outputs: [{ internalType: "address", name: "", type: "address" }],
				stateMutability: "view",
				type: "function",
			},
			{
				inputs: [{ internalType: "address", name: "account", type: "address" }],
				name: "getCurrentVotes",
				outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
				stateMutability: "view",
				type: "function",
			},
			{
				inputs: [],
				name: "getOwner",
				outputs: [{ internalType: "address", name: "", type: "address" }],
				stateMutability: "view",
				type: "function",
			},
			{
				inputs: [
					{ internalType: "address", name: "account", type: "address" },
					{ internalType: "uint256", name: "blockNumber", type: "uint256" },
				],
				name: "getPriorVotes",
				outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
				stateMutability: "view",
				type: "function",
			},
			{
				inputs: [
					{ internalType: "address", name: "spender", type: "address" },
					{ internalType: "uint256", name: "addedValue", type: "uint256" },
				],
				name: "increaseAllowance",
				outputs: [{ internalType: "bool", name: "", type: "bool" }],
				stateMutability: "nonpayable",
				type: "function",
			},
			{
				inputs: [
					{ internalType: "address", name: "_to", type: "address" },
					{ internalType: "uint256", name: "_amount", type: "uint256" },
				],
				name: "mint",
				outputs: [],
				stateMutability: "nonpayable",
				type: "function",
			},
			{
				inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
				name: "mint",
				outputs: [{ internalType: "bool", name: "", type: "bool" }],
				stateMutability: "nonpayable",
				type: "function",
			},
			{
				inputs: [],
				name: "name",
				outputs: [{ internalType: "string", name: "", type: "string" }],
				stateMutability: "view",
				type: "function",
			},
			{
				inputs: [{ internalType: "address", name: "", type: "address" }],
				name: "nonces",
				outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
				stateMutability: "view",
				type: "function",
			},
			{
				inputs: [{ internalType: "address", name: "", type: "address" }],
				name: "numCheckpoints",
				outputs: [{ internalType: "uint32", name: "", type: "uint32" }],
				stateMutability: "view",
				type: "function",
			},
			{
				inputs: [],
				name: "owner",
				outputs: [{ internalType: "address", name: "", type: "address" }],
				stateMutability: "view",
				type: "function",
			},
			{ inputs: [], name: "renounceOwnership", outputs: [], stateMutability: "nonpayable", type: "function" },
			{
				inputs: [],
				name: "symbol",
				outputs: [{ internalType: "string", name: "", type: "string" }],
				stateMutability: "view",
				type: "function",
			},
			{
				inputs: [],
				name: "totalSupply",
				outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
				stateMutability: "view",
				type: "function",
			},
			{
				inputs: [
					{ internalType: "address", name: "recipient", type: "address" },
					{ internalType: "uint256", name: "amount", type: "uint256" },
				],
				name: "transfer",
				outputs: [{ internalType: "bool", name: "", type: "bool" }],
				stateMutability: "nonpayable",
				type: "function",
			},
			{
				inputs: [
					{ internalType: "address", name: "sender", type: "address" },
					{ internalType: "address", name: "recipient", type: "address" },
					{ internalType: "uint256", name: "amount", type: "uint256" },
				],
				name: "transferFrom",
				outputs: [{ internalType: "bool", name: "", type: "bool" }],
				stateMutability: "nonpayable",
				type: "function",
			},
			{
				inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
				name: "transferOwnership",
				outputs: [],
				stateMutability: "nonpayable",
				type: "function",
			},
		],
		"0xEDfcB78e73f7bA6aD2D829bf5D462a0924da28eD"
	);
	const _poolLength = await contract.methods.poolLength().call();

	const _userInfoResults = await Promise.all(
		[...Array(parseInt(_poolLength))].map((item, poolId) =>
					autoContract.methods.stakedWantTokens(poolId, account).call()
		)
	);

	const _balances = _userInfoResults
		.map((result, poolId) => {
			const balance = contractAddress === AUTO ? result : result["0"];
			return { pool: poolId, balance };
		})
		.filter((b) => b.balance !== "0");

	const _balancesLP = await Promise.all(
		_balances.map(async (b) => {
			const { "0": lpAddress } = await contract.methods.poolInfo(b.pool).call();

			return { ...b, lpAddress };
		})
	);

	const _balanceLPPair = _balancesLP.map(async (lp) => {
		return calculate(web3, lp, routerContractAddress);
	});

	const completeBalance = await Promise.all(_balanceLPPair);*/
})();
