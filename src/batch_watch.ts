import Web3 from "web3";
import { MultiCall } from "eth-multicall";
import fs from "fs-extra";

const web3 = new Web3("wss://bsc-ws-node.nariox.org:443");
const abi = fs.readJsonSync("./src/abi/erc20.json");

const multiCallContract = "0xB94858b0bB5437498F5453A16039337e5Fdc269C";
const multicall = new MultiCall(web3, multiCallContract);

const transactions = [
	"0xc31b0924e41e00b483ed8ccfaa61f70a86e6bab02a99831c8fceba128a1f4973",
	"0x1a3c89422c0ca927af2661efc3e7627102795d83863435c1701252121699602e",
	"0xb8aa7a35c83da10c1523e3bbd5e47b638d61f1a0ddf95f6262456a518e5facec",
	"0x89bc3fc352fe59b631ad417ce970dbeb429edab7db1a278795a84adf27384313",
	"0x363a83fe6ef27576c19fbc83cde559989b5d96f5d20804115ce6e704954ee7e6",
	"0x03c36f3497a12053c95c054821ae05b35bc85d7f6d6152993444fc056e05c917",
];

(async () => {
	const p = transactions.map((tx) => web3.eth.getTransactionReceipt(tx));
	const results = await multicall.all([p]);
})();
