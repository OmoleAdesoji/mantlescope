# MantleScope 🔭
**AI-powered wallet intelligence for Mantle Network.**

> Paste any wallet address. Claude analyses its on-chain behaviour. Get a plain English report — no trading jargon, no raw data — just answers.

Built for **The Turing Test Hackathon 2026**:
- 🎨 **Best UI/UX Award** — readable by anyone, not just traders
- 🚀 **20 Project Deployment Award** — contract on Mantle + verified
- 🏆 **Alpha Data Track** — AI-powered on-chain data analysis

---

## What It Does

Paste any Mantle wallet address into MantleScope and get:

- **AI classification** — Smart Money, Whale, DeFi Power User, Retail, or Bot
- **Plain English summary** — what this wallet has been doing and what it might mean
- **On-chain signals** — activity level, risk profile, notable behaviour
- **Recent transactions** — last 15 txs with explorer links
- **Stored on-chain** — every analysis can be written to Mantle Network permanently as verifiable proof

**The key difference:** Every insight is written in plain English. Not "0.4200 ETH outflow detected on block 8,291,044" — but *"This wallet has been quietly moving funds into DeFi protocols over the past week. The pattern suggests someone positioning for yield, not a quick trade."*

---

## Architecture

```
User pastes wallet address
        │
        ▼
Mantle RPC + Mantlescan API  ──→  balance, tx count, recent transactions
        │
        ▼
Claude AI (claude-sonnet-4)  ──→  classification, confidence score, plain
        │                          English summary, behavioural signals
        ▼
Frontend Dashboard           ──→  Bloomberg-style terminal UI
        │
        ▼ (optional)
MantleScope.sol              ──→  insight stored on-chain permanently
        │                         on Mantle Sepolia / Mainnet
        ▼
Mantle Explorer link         ──→  verifiable, public, immutable
```

---

## Smart Contract

`MantleScope.sol` records AI-generated insights on-chain:

```solidity
function recordInsight(
    address wallet,
    string  calldata summary,
    string  calldata category,
    uint8   confidence
) external returns (uint256 insightId)
```

Each stored insight includes: wallet address, analyst address, AI summary, category, confidence score, block number, and timestamp. Anyone can verify any insight was recorded at a specific point in time.

---

## Setup

### 1. Deploy Contract

```bash
npm install
cp .env.example .env
# Add PRIVATE_KEY to .env

npm run deploy:testnet
# Copy the contract address it prints
```

### 2. Verify on Mantle Explorer

```bash
npx hardhat verify --network mantleTestnet YOUR_CONTRACT_ADDRESS
```

### 3. Run Frontend

```bash
# Open frontend/index.html
# Find CLAUDE_API_KEY = '' and add your Anthropic key
# Find CONTRACT_ADDRESS and paste your deployed address

cd frontend
npx serve .
# Open http://localhost:3000
```

---

## Usage

1. Open the dashboard
2. Paste any Mantle wallet address into the search bar
3. Click **SCAN WALLET**
4. Wait ~5 seconds for Claude to analyse the wallet
5. Read the plain English report
6. Connect your wallet and click **STORE INSIGHT ON-CHAIN** to write it to Mantle permanently

---

## Why This Wins UI/UX

Most blockchain analytics tools are built for power users. Raw data, hex strings, charts with no context. MantleScope is built for everyone else.

The AI doesn't output: `WALLET_TYPE: SMART_MONEY | CONFIDENCE: 0.78 | SIGNAL: ACCUMULATION`

It outputs: *"This wallet has made 12 purchases of MNT over the past 3 days, each one slightly larger than the last. The balance has grown steadily. Whoever controls this address is accumulating quietly — a pattern that shows up more often in informed traders than in retail buyers."*

That sentence is readable by a journalist, a founder, an investor, or someone who just got into crypto last week. That's the design goal.

---

## Deployment Info

- **Network:** Mantle Sepolia Testnet (chainId: 5003)
- **MantleScan API:** https://api-sepolia.mantlescan.xyz/api (use `version=2&chainid=5003` for V2 requests)
- **Contract:** `0x3cC1Efd62a9E467D7e38Ae26b6928197369B9Edf`
- **Explorer:** https://sepolia.mantlescan.xyz/address/0x3cC1Efd62a9E467D7e38Ae26b6928197369B9Edf
- **Frontend:** `frontend/index.html` now points to the deployed contract address

---

## Hackathon Requirements Checklist

- [ ] Smart contract deployed on Mantle Testnet
- [ ] Contract verified on Mantle Explorer
- [ ] AI-powered function callable on-chain
- [ ] Frontend publicly accessible
- [ ] Deployment address in DoraHacks submission
- [ ] Demo video ≥ 2 min
- [x] Open-source GitHub with README
- [x] Architecture overview in README
- [x] Mantle on-chain data as core data source
- [x] AI analysis depth (Claude API)
- [x] On-chain proof for every analysis
