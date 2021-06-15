export const nodes = [
	"https://bsc-dataseed1.ninicoin.io",
	"https://bsc-dataseed1.defibit.io",
	"https://bsc-dataseed.binance.org",
];

const getNodeUrl = () => {
	return nodes[Math.floor(Math.random() * nodes.length)];
};

export default getNodeUrl;
