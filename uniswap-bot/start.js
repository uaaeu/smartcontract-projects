const ethers = require("ethers");
const secrets = require("./secrets.json");
const telegram = require("./telegram");

const dexFactory = secrets.spookyswap.factory;
const dexRouter = secrets.spookyswap.router;
const dexToken = secrets.tokens.fantom.WFTM;
const recipient = secrets.wallets.test["public-key"];

const provider = new ethers.providers.JsonRpcProvider(secrets["api-key"]);
const wallet = new ethers.Wallet(secrets.wallets.test["private-key"]);
const account = wallet.connect(provider);

const factory = new ethers.Contract(
  dexFactory,
  [
    "event PairCreated(address indexed token0, address indexed token1, address pair, uint)",
  ],
  account
);
const router = new ethers.Contract(
  dexRouter,
  [
    "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  ],
  account
);
telegram.sendMessage("Waiting for new pair...");
factory.on("PairCreated", async (token0, token1, pairAddress) => {
  const message = `
  New pair detected
  =================
  token0: ${token0}
  token1: ${token1}
  pairAddress: ${pairAddress}
`;
  console.log(message);
  telegram.sendMessage(message);

  let tokenIn, tokenOut;
  if (token0 === dexToken) {
    tokenIn = token0;
    tokenOut = token1;
  }

  if (token1 == dexToken) {
    tokenIn = token1;
    tokenOut = token0;
  }

  if (typeof tokenIn === "undefined") {
    return;
  }
  const amountIn = ethers.utils.parseUnits("0.001", "ether");
  const amounts = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]);
  const amountOutMin = amounts[1].sub(amounts[1].div(10));
  console.log(`
    Buying new token
    =================
    tokenIn: ${amountIn.toString()} ${tokenIn} (WFTM)
    tokenOut: ${amountOutMin.toString()} ${tokenOut}
  `);
  const tx = await router.swapExactTokensForTokens(
    amountIn,
    amountOutMin,
    [tokenIn, tokenOut],
    recipient,
    Date.now() + 1000 * 60 * 10,
    {
      gasPrice: "10000",
      gasLimit: "250000",
    }
  );
  const receipt = await tx.wait();
  console.log("Transaction receipt");
  console.log(receipt);
});
