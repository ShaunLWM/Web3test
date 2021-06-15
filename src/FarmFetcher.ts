const Utils = require("../utils");
const Web3EthContract = require("web3-eth-contract");

const TokenABI = require("./abi/abiToken.json");
const ErcAbi = require("./abi/abiErc.json");

const _ = require("lodash");

class FarmFetcher {
	constructor(contractAbiFetcher) {
		this.contractAbiFetcher = contractAbiFetcher;
	}

	extractFunctionsFromAbi(abi) {
		const poolInfoFunction = abi.find(
			(f) => f.name && f.type === "function" && f.name && f.name.toLowerCase().startsWith("poolinfo")
		);
		const poolInfoFunctionName = poolInfoFunction.name;

		let rewardTokenFunctionName = undefined;
		const pendingFunction = abi.find(
			(f) => f.name && f.type === "function" && f.name && f.name.toLowerCase().startsWith("pending")
		);
		if (pendingFunction.name) {
			const pendingFunctionName = pendingFunction.name;

			const func = abi.find(
				(f) =>
					f.name &&
					f.type === "function" &&
					f.name &&
					f.name.toLowerCase() === pendingFunctionName.replace("pending", "").toLowerCase()
			);

			if (func && func.name) {
				rewardTokenFunctionName = func.name;
			}
		}

		// multiplier
		let multiplierFunctionName = undefined;
		const multiplierFunction = abi.find(
			(f) =>
				f.name &&
				f.type === "function" &&
				f.name &&
				f.name.toLowerCase().includes("multiplier") &&
				f.inputs.length === 2
		);
		if (multiplierFunction && multiplierFunction.name) {
			multiplierFunctionName = multiplierFunction.name;
		}

		// tokenPerBlock
		let tokenPerBlockFunctionName = undefined;
		const tokenPerBlockFunction = abi.find(
			(f) =>
				f.name &&
				f.type === "function" &&
				f.name &&
				!f.name.includes("DevPerBlock") &&
				f.name.toLowerCase().includes("perblock") &&
				f.inputs.length === 0
		);
		if (tokenPerBlockFunction && tokenPerBlockFunction.name) {
			tokenPerBlockFunctionName = tokenPerBlockFunction.name;
		}

		// totalAllocPoint
		let totalAllocPointFunctionName = undefined;
		const totalAllocPointFunction = abi.find(
			(f) => f.name && f.type === "function" && f.name && f.name.toLowerCase().includes("totalallocpoint")
		);
		if (totalAllocPointFunction && totalAllocPointFunction.name) {
			totalAllocPointFunctionName = totalAllocPointFunction.name;
		}

		// poolLength
		let poolLengthFunctionName = undefined;
		const poolLengthFunction = abi.find(
			(f) => f.name && f.type === "function" && f.name && f.name.toLowerCase().startsWith("poollength")
		);
		if (poolLengthFunction && poolLengthFunction.name) {
			poolLengthFunctionName = poolLengthFunction.name;
		}

		return {
			poolInfoFunctionName: poolInfoFunctionName,
			rewardTokenFunctionName: rewardTokenFunctionName,
			multiplierFunctionName: multiplierFunctionName,
			tokenPerBlockFunctionName: tokenPerBlockFunctionName,
			totalAllocPointFunctionName: totalAllocPointFunctionName,
			poolLengthFunctionName: poolLengthFunctionName,
		};
	}

	async fetchForMasterChef(masterChef) {
		const abi = await this.contractAbiFetcher.getAbiForContractAddress(masterChef);

		const {
			poolInfoFunctionName,
			rewardTokenFunctionName,
			multiplierFunctionName,
			tokenPerBlockFunctionName,
			totalAllocPointFunctionName,
			poolLengthFunctionName,
		} = this.extractFunctionsFromAbi(abi);

		if (!rewardTokenFunctionName) {
			console.log(`no reward token contract method found for "${masterChef}"`);
		}

		let web3EthContract1 = new Web3EthContract(abi, masterChef);

		let masterInfoCall = {};

		if (rewardTokenFunctionName) {
			masterInfoCall.rewardToken = web3EthContract1.methods[rewardTokenFunctionName]();
		}

		let blockNumber = await Utils.getWeb3().eth.getBlockNumber();

		// multiplier
		if (multiplierFunctionName) {
			masterInfoCall.multiplier = web3EthContract1.methods[multiplierFunctionName](blockNumber, blockNumber + 1);
		}

		// tokenPerBlock
		if (tokenPerBlockFunctionName) {
			masterInfoCall.tokenPerBlock = web3EthContract1.methods[tokenPerBlockFunctionName]();
		}

		// tokenPerBlock
		if (totalAllocPointFunctionName) {
			masterInfoCall.totalAllocPoint = web3EthContract1.methods[totalAllocPointFunctionName]();
		}

		// poolLength
		if (poolLengthFunctionName) {
			masterInfoCall.poolLength = web3EthContract1.methods[poolLengthFunctionName]();
		}

		const masterInfo = await Utils.multiCall([masterInfoCall]);
		let poolLength = masterInfo[0].poolLength;

		if (!poolLength) {
			poolLength = await this.findPoolLengthViaPoolInfo(web3EthContract1, poolInfoFunctionName);
		}

		if (!poolLength) {
			console.log("found no poolLength");
			process.exit();
		}

		// error case when address === 0?
		// fetch all pools
		/*
    const pools2 = await Utils.multiCallRpc([...Array(parseInt(poolLengthCalls[0].poolLength)).keys()].map(id => {
      return {
        reference: id.toString(),
        contractAddress: masterChef,
        abi: abi,
        calls: [
          {
            reference: poolInfoFunctionName,
            method: poolInfoFunctionName,
            parameters: [id]
          }
        ]
      };
    }));
    */

		const pools = await Utils.multiCall(
			[...Array(parseInt(poolLength)).keys()].map((id) => {
				return {
					pid: id.toString(),
					poolInfo: new Web3EthContract(abi, masterChef).methods[poolInfoFunctionName](id),
				};
			})
		);

		// lpToken or single token
		const lpTokens = await Utils.multiCallIndexBy(
			"pid",
			pools
				.filter((p) => p.poolInfo && p.poolInfo[0] && p.poolInfo[0].startsWith("0x"))
				.map((p) => {
					const [lpToken, allocPoint, lastRewardBlock, accCakePerShare] = Object.values(p.poolInfo);

					const web3EthContract = new Web3EthContract(TokenABI, lpToken);

					return {
						pid: p.pid.toString(),
						lpToken: lpToken,
						symbol: web3EthContract.methods.symbol(),
						token0: web3EthContract.methods.token0(),
						token1: web3EthContract.methods.token1(),
					};
				})
		);

		// resolve token symbols
		const tokenAddresses = [];
		Object.values(lpTokens).forEach((result) => {
			if (!result.token0) {
				tokenAddresses.push(result.lpToken);
			} else if (result.token0 && result.token1) {
				tokenAddresses.push(result.token0);
				tokenAddresses.push(result.token1);
			}
		});

		if (masterInfo[0].rewardToken) {
			tokenAddresses.push(masterInfo[0].rewardToken);
		}

		const tokensRaw = await Utils.multiCallIndexBy(
			"token",
			_.uniq(tokenAddresses).map((token) => {
				const web3EthContract = new Web3EthContract(ErcAbi, token);

				return {
					token: token,
					symbol: web3EthContract.methods.symbol(),
					decimals: web3EthContract.methods.decimals(),
				};
			})
		);

		const tokens = {};
		for (const [key, value] of Object.entries(tokensRaw)) {
			if (value.decimals && value.symbol) {
				tokens[key.toLowerCase()] = value;
			}
		}

		// format items in pancakeswap format
		const all = [];
		pools.forEach((pool) => {
			const lpTokenInfo = lpTokens[pool.pid];
			if (!lpTokenInfo) {
				return;
			}

			const isLp = !!lpTokenInfo.token0;
			const [lpToken, allocPoint, lastRewardBlock, accCakePerShare] = Object.values(pool.poolInfo);

			const item = {
				pid: parseInt(pool.pid),
				lpAddress: pool.poolInfo[0],
				isTokenOnly: !isLp,
				raw: {
					masterChefAddress: masterChef,
					lpToken: lpToken,
					lpSymbol: lpTokenInfo.symbol,
					allocPoint: allocPoint,
					lastRewardBlock: lastRewardBlock,
					lastRewardSecondsAgo: (blockNumber - lastRewardBlock) * 3,
					accCakePerShare: accCakePerShare,
					poolInfo: pool.poolInfo,
				},
			};

			if (parseInt(allocPoint) === 0) {
				item.isFinished = true;
			}

			if (parseInt(allocPoint) > 0) {
				const masterInfoCall = masterInfo[0];

				if (masterInfoCall.totalAllocPoint && masterInfoCall.tokenPerBlock && masterInfoCall.multiplier) {
					const totalAllocPoint = masterInfoCall.totalAllocPoint;
					const poolBlockRewards =
						(masterInfoCall.tokenPerBlock * masterInfoCall.multiplier * allocPoint) / totalAllocPoint;

					const secondsPerBlock = 3;
					const secondsPerYear = 31536000;
					const yearlyRewards = (poolBlockRewards / secondsPerBlock) * secondsPerYear;

					item.raw.yearlyRewardsInToken = yearlyRewards / 1e18;
				}
			}

			if (!isLp) {
				let token = tokens[pool.poolInfo[0].toLowerCase()];

				if (!token) {
					return;
				}

				item.token = {
					symbol: token.symbol,
					address: pool.poolInfo[0],
					decimals: parseInt(token.decimals),
				};

				item.raw.tokens = [
					{
						address: pool.poolInfo[0],
						symbol: token.symbol,
						decimals: parseInt(token.decimals),
					},
				];
			} else {
				let token0 = tokens[lpTokenInfo.token0.toLowerCase()];
				let token1 = tokens[lpTokenInfo.token1.toLowerCase()];

				if (!token0 || !token1) {
					return;
				}

				item.quoteToken = {
					symbol: token1.symbol,
					address: lpTokenInfo.token1,
					decimals: parseInt(token1.decimals),
				};

				item.token = {
					symbol: token0.symbol,
					address: lpTokenInfo.token0,
					decimals: parseInt(token0.decimals),
				};

				item.raw.tokens = [
					{
						address: lpTokenInfo.token0,
						symbol: token0.symbol,
						decimals: parseInt(token0.decimals),
					},
					{
						address: lpTokenInfo.token1,
						symbol: token1.symbol,
						decimals: parseInt(token1.decimals),
					},
				];
			}

			item.lpSymbol = item.raw.tokens.map((t) => t.symbol.toUpperCase()).join("-");

			if (masterInfo[0].rewardToken && tokens[masterInfo[0].rewardToken.toLowerCase()]) {
				let earnToken = tokens[masterInfo[0].rewardToken.toLowerCase()];

				item.earns = item.raw.earns = [
					{
						address: masterInfo[0].rewardToken,
						symbol: earnToken.symbol,
						decimals: parseInt(earnToken.decimals),
					},
				];
			}

			all.push(item);
		});

		return all;
	}

	async findPoolLengthViaPoolInfo(web3EthContract, poolInfoFunctionName) {
		const calls = [];

		for (let id = 1; id < 1000; id += 10) {
			calls.push({
				pid: id.toString(),
				poolInfo: web3EthContract.methods[poolInfoFunctionName](id),
			});
		}

		const tokensRaw = await Utils.multiCall(calls);

		const results = tokensRaw.filter((p) => p.poolInfo).map((p) => parseInt(p.pid));
		if (results.length === 0) {
			return undefined;
		}

		return Math.max(...results);
	}
};
