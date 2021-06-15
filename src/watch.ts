import BigNumber from "bignumber.js";
import fs from "fs-extra";
import Web3 from "web3";
import { AbiItem } from "web3-utils";
import { getBscPrices, loadBscChefContract } from "./helper";

const web3 = new Web3("wss://bsc-ws-node.nariox.org:443");

const abi = fs.readJsonSync("./src/abi/erc20.json");
const transactions: string[] = [];
const blocks = [];

(async () => {
	const processTxs = (tx: string) => {
		console.log(`processing ${tx}`);
		const info = setInterval(async () => {
			const p = await web3.eth.getTransactionReceipt(tx);
			console.log(p);
			if (!p) {
				console.log("Pending");
			} else {
				console.log(p.transactionHash);
				console.log(`done`);
				process.exit(0);
			}
		}, 1000);
		web3.eth.clearSubscriptions(() => {});
	};

	web3.eth
		.subscribe("newBlockHeaders", async (error, result) => {})
		.on("connected", function (subscriptionId) {
			console.log(subscriptionId);
		})
		.on("data", async (blockHeader) => {
			console.log(`New block found ${blockHeader.number}`);
			const txs = await web3.eth.getBlock(blockHeader.number);
			let i = 0;
			processTxs(txs.transactions[0]);
			// console.log(txs);
			// for (const tx of txs.transactions) {
			// 	const index = transactions.findIndex((p) => p === tx);
			// 	if (index >= 0) {
			// 		transactions.splice(index, 1);
			// 		i += 1;
			// 	}
			// }

			// console.log(`${i} transactions removed. ${transactions.length} left`);
		})
		.on("error", console.error);

	web3.eth
		.subscribe("pendingTransactions", function (error, result) {
			if (!error) {
				transactions.push(result);
			}
		})
		.on("data", function (transaction) {
			//	transactions.push(transaction);
			// console.log(`${transactions.length} total transactions`)
		});
})();
