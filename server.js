const express = require('express');
const cors = require('cors');
require('dotenv').config();
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
if (!CLAUDE_API_KEY) {
  console.error('ERROR: CLAUDE_API_KEY not found in .env file');
  process.exit(1);
}

// Helper to format large numbers
const fromWei = (val, decimals = 18) => {
  try {
    const n = BigInt(val);
    const div = BigInt(10 ** decimals);
    const whole = n / div;
    const frac = n % div;
    return parseFloat(`${whole}.${frac.toString().padStart(decimals, '0')}`).toFixed(4);
  } catch {
    return '0.0000';
  }
};

const timeAgo = (ts) => {
  const d = Date.now() - ts * 1000;
  const m = Math.floor(d / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const short = (a) => (a ? `${a.slice(0, 8)}...${a.slice(-6)}` : '');

// Main endpoint: analyze wallet
app.post('/api/analyze', async (req, res) => {
  try {
    const { address, balance, txCount, txs } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Missing wallet address' });
    }

    // Build transaction summary for Claude prompt
    const txSummary = (txs || [])
      .slice(0, 10)
      .map((tx) => {
        const isOut = tx.from?.toLowerCase() === address.toLowerCase();
        const val = fromWei(tx.value || '0');
        return `${isOut ? 'OUT' : 'IN'} ${val} MNT | to: ${short(tx.to || '')} | ${tx.functionName || 'transfer'} | ${timeAgo(tx.timeStamp)}`;
      })
      .join('\n');

    const uniqueContracts = [...new Set((txs || []).filter((t) => t.to !== address.toLowerCase()).map((t) => t.to))].length;
    const contractTxs = (txs || []).filter((t) => t.input && t.input !== '0x').length;
    const inbound = (txs || []).filter((t) => t.to?.toLowerCase() === address.toLowerCase()).length;
    const outbound = (txs || []).filter((t) => t.from?.toLowerCase() === address.toLowerCase()).length;

    const prompt = `You are an on-chain analyst for Mantle Network. Analyse this wallet and provide a concise intelligence report.

WALLET: ${address}
NETWORK: Mantle Sepolia (testnet)
BALANCE: ${balance} MNT
TOTAL TXS (nonce): ${txCount}
RECENT TRANSACTIONS (last 20):
${txSummary || 'No recent transactions found.'}

STATS:
- Unique contracts interacted with: ${uniqueContracts}
- Contract calls (non-transfer): ${contractTxs}
- Inbound txs: ${inbound}
- Outbound txs: ${outbound}

Respond with ONLY valid JSON in this exact format:
{
  "summary": "2-4 sentence plain English analysis of this wallet's behaviour and what type of user it likely belongs to. Be specific and insightful.",
  "category": "one of: smart_money | whale | defi_power_user | retail | bot | unknown",
  "confidence": <integer 0-100>,
  "signals": {
    "activity_level": "high | medium | low",
    "primary_behaviour": "short label like 'DeFi trader' or 'HODLer' or 'bridge user'",
    "risk_profile": "aggressive | moderate | conservative",
    "notable": "one specific notable observation about this wallet"
  }
}

Base confidence on how much transaction data is available. If very few txs, confidence should be 50-60. More data = higher confidence possible.`;

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Claude API error:', errorData);
      return res.status(response.status).json({
        error: 'Claude API error',
        details: errorData.error?.message || 'Unknown error',
      });
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text || '{}';
    const clean = raw.replace(/```json|```/g, '').trim();
    const insight = JSON.parse(clean);

    res.json(insight);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ MantleScope backend running on http://localhost:${PORT}`);
});
