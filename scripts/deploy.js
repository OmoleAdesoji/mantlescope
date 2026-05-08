const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("\n🔭 Deploying MantleScope");
  console.log("Network:", network.name, `(chainId: ${network.chainId})`);
  console.log("Deployer:", deployer.address);
  console.log(
    "Balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "MNT\n"
  );

  const MantleScope = await ethers.getContractFactory("MantleScope");
  const contract = await MantleScope.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const isTestnet = Number(network.chainId) === 5003;
  const explorer = isTestnet
    ? `https://sepolia.mantlescan.xyz/address/${address}`
    : `https://mantlescan.xyz/address/${address}`;

  console.log("✅ MantleScope deployed to:", address);
  console.log("Explorer:", explorer);

  // Save deployment
  const deployment = {
    contract: "MantleScope",
    address,
    network: network.name,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    explorer,
  };

  fs.mkdirSync("./deployments", { recursive: true });
  const filename = isTestnet ? "mantleTestnet.json" : "mantleMainnet.json";
  fs.writeFileSync(
    `./deployments/${filename}`,
    JSON.stringify(deployment, null, 2)
  );
  console.log(`\nDeployment saved to deployments/${filename}`);

  // Verify instructions
  console.log("\nTo verify on Mantle Explorer:");
  console.log(
    `npx hardhat verify --network ${isTestnet ? "mantleTestnet" : "mantleMainnet"} ${address}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
