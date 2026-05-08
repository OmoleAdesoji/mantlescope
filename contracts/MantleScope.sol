// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title MantleScope — AI-Powered On-Chain Wallet Intelligence
/// @notice Stores AI-generated insights about wallet behaviour on Mantle Network.
///         Anyone can submit an insight for any wallet. The contract records
///         the insight, the analyst, and a confidence score on-chain permanently.
/// @dev    Deployed on Mantle Testnet / Mainnet for The Turing Test Hackathon 2026.

contract MantleScope {

    // ── Structs ───────────────────────────────────────────────────────────────

    struct Insight {
        address wallet;         // Wallet being analysed
        address analyst;        // Who submitted the insight
        string  summary;        // AI-generated plain English summary
        string  category;       // e.g. "smart_money", "retail", "bot", "whale"
        uint8   confidence;     // 0–100 confidence score from the AI
        uint256 blockNumber;    // When the insight was recorded
        uint256 timestamp;      // Unix timestamp
        bool    flagged;        // Community flagged as inaccurate
    }

    // ── Storage ───────────────────────────────────────────────────────────────

    /// @dev insight ID → Insight struct
    mapping(uint256 => Insight) public insights;

    /// @dev wallet → array of insight IDs
    mapping(address => uint256[]) public walletInsights;

    /// @dev analyst → number of insights submitted
    mapping(address => uint256) public analystCount;

    /// @dev Total insights ever recorded
    uint256 public totalInsights;

    /// @dev Minimum confidence threshold to store (prevents junk)
    uint8 public minConfidence = 50;

    address public owner;

    // ── Events ────────────────────────────────────────────────────────────────

    event InsightRecorded(
        uint256 indexed insightId,
        address indexed wallet,
        address indexed analyst,
        string  category,
        uint8   confidence,
        uint256 timestamp
    );

    event InsightFlagged(uint256 indexed insightId, address flaggedBy);
    event MinConfidenceUpdated(uint8 oldValue, uint8 newValue);

    // ── Modifiers ─────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "MantleScope: not owner");
        _;
    }

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ── Core Functions ────────────────────────────────────────────────────────

    /// @notice Record an AI-generated insight for a wallet address
    /// @param wallet      The wallet being analysed
    /// @param summary     Plain English AI summary of wallet behaviour
    /// @param category    Classification: "smart_money" | "retail" | "bot" | "whale" | "defi_power_user" | "unknown"
    /// @param confidence  AI confidence score 0–100
    /// @return insightId  The ID of the newly recorded insight
    function recordInsight(
        address wallet,
        string  calldata summary,
        string  calldata category,
        uint8   confidence
    ) external returns (uint256 insightId) {
        require(wallet != address(0),          "MantleScope: zero address");
        require(bytes(summary).length > 0,     "MantleScope: empty summary");
        require(bytes(summary).length <= 1000, "MantleScope: summary too long");
        require(confidence >= minConfidence,   "MantleScope: confidence too low");
        require(confidence <= 100,             "MantleScope: invalid confidence");

        insightId = totalInsights++;

        insights[insightId] = Insight({
            wallet:      wallet,
            analyst:     msg.sender,
            summary:     summary,
            category:    category,
            confidence:  confidence,
            blockNumber: block.number,
            timestamp:   block.timestamp,
            flagged:     false
        });

        walletInsights[wallet].push(insightId);
        analystCount[msg.sender]++;

        emit InsightRecorded(
            insightId,
            wallet,
            msg.sender,
            category,
            confidence,
            block.timestamp
        );

        return insightId;
    }

    /// @notice Flag an insight as potentially inaccurate
    function flagInsight(uint256 insightId) external {
        require(insightId < totalInsights, "MantleScope: insight does not exist");
        insights[insightId].flagged = true;
        emit InsightFlagged(insightId, msg.sender);
    }

    // ── View Functions ────────────────────────────────────────────────────────

    /// @notice Get all insight IDs for a wallet
    function getWalletInsightIds(address wallet)
        external view returns (uint256[] memory)
    {
        return walletInsights[wallet];
    }

    /// @notice Get the most recent insight for a wallet
    function getLatestInsight(address wallet)
        external view
        returns (Insight memory insight, bool exists)
    {
        uint256[] memory ids = walletInsights[wallet];
        if (ids.length == 0) return (insight, false);
        return (insights[ids[ids.length - 1]], true);
    }

    /// @notice Get multiple insights by ID range
    function getInsightsBatch(uint256 from, uint256 to)
        external view returns (Insight[] memory)
    {
        require(to >= from, "MantleScope: invalid range");
        require(to < totalInsights, "MantleScope: out of range");
        Insight[] memory batch = new Insight[](to - from + 1);
        for (uint256 i = from; i <= to; i++) {
            batch[i - from] = insights[i];
        }
        return batch;
    }

    /// @notice How many insights exist for a wallet
    function insightCount(address wallet) external view returns (uint256) {
        return walletInsights[wallet].length;
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    function setMinConfidence(uint8 newMin) external onlyOwner {
        emit MinConfidenceUpdated(minConfidence, newMin);
        minConfidence = newMin;
    }
}
