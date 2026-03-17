# Build Your Own Ethereum - Implementation

A blockchain implementation inspired by Ethereum, featuring smart contracts, proof-of-work mining, peer-to-peer networking, and a virtual machine. Built with Go.

## Overview

This implementation recreates core Ethereum functionality by building a blockchain with smart contract support. It demonstrates how distributed ledgers, consensus mechanisms, and virtual machines work together to create a decentralized computing platform.

## Features

- ✅ **Blockchain**: Linked blocks with Merkle proofs
- ✅ **Transactions**: Signed, validated, and executed transactions
- ✅ **Accounts**: User-controlled and contract accounts
- ✅ **State Management**: World state with Merkle Patricia Trie
- ✅ **Mining**: Proof-of-work consensus with difficulty adjustment
- ✅ **Smart Contracts**: Simple EVM for contract execution
- ✅ **P2P Networking**: Peer discovery and block synchronization
- ✅ **Wallet**: Key management, transaction signing, balance tracking
- ✅ **JSON-RPC API**: Web3-compatible API for external tools

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Ethereum Node                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    JSON-RPC API                         │    │
│  │  eth_getBalance, eth_sendTransaction, eth_getBlock... │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    CLI / Wallet                         │    │
│  │  Account management, transaction creation, mining      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Blockchain Core                       │    │
│  │  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐   │    │
│  │  │   Block      │  │ Transaction │  │    State     │   │    │
│  │  │   Manager    │  │    Pool     │  │    Manager   │   │    │
│  │  └──────────────┘  └─────────────┘  └──────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 Consensus Engine                        │    │
│  │  Proof of Work, Difficulty Adjustment, Block Rewards   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  EVM (Virtual Machine)                  │    │
│  │  Stack-based execution, gas metering, contract calls  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   P2P Network                           │    │
│  │  Peer discovery, block sync, transaction broadcast     │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                │    │
│  │  │ Peer 1  │  │ Peer 2  │  │ Peer 3  │  ...            │    │
│  │  └─────────┘  └─────────┘  └─────────┘                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Build and Installation

### Prerequisites

- **Go 1.21+**
- **Git** for cloning dependencies

### Build from Source

```bash
# Clone the repository
git clone <repository-url>
cd 31-ethereum

# Download dependencies
go mod download

# Build the binary
go build -o eth ./cmd/eth

# (Optional) Install to system path
sudo cp eth /usr/local/bin/
```

### Docker Build

```bash
docker build -t ethereum-node:latest .
docker run -p 8545:8545 -p 30303:30303 ethereum-node:latest
```

## Usage

### Blockchain Commands

```bash
# Initialize new blockchain
eth init

# Start node with RPC server
eth --rpc --rpcport 8545 --port 30303

# Create genesis block
eth blockchain create-genesis

# View blockchain info
eth blockchain info
# Output:
# Latest block: 1234
# Total difficulty: 456789...
# State root: 0xabcd...
# Peers: 5
```

### Wallet Commands

```bash
# Create new account
eth wallet create
# Output:
# Enter password:
# Repeat password:
# Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# List accounts
eth wallet list

# Check balance
eth wallet balance 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
# Output: Balance: 1000000000000000000 wei (1 ETH)

# Send transaction
eth wallet send \
  --from 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb \
  --to 0x1234567890123456789012345678901234567890 \
  --value 1000000000000000 \
  --gas 21000 \
  --gas-price 1000000000
```

### Mining Commands

```bash
# Start mining
eth mine start --threads 4

# Stop mining
eth mine stop

# Get mining stats
eth mine stats
# Output:
# Hash rate: 25.3 MH/s
# Blocks mined: 42
# Difficulty: 5623844567890
```

### Smart Contract Commands

```bash
# Deploy contract
eth contract deploy \
  --from 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb \
  --code 0x606060405267... \
  --gas 1000000

# Call contract function
eth contract call \
  --to 0xabcd... \
  --data 0x70a0823100000000000000000000000000742d...

# Get contract storage
eth contract storage 0xabcd... 0
```

## Project Structure

```
31-ethereum/
├── cmd/
│   └── eth/
│       └── main.go              # CLI entry point
├── internal/
│   ├── blockchain/
│   │   ├── blockchain.go        # Blockchain management
│   │   ├── block.go             # Block structure and methods
│   │   └── chain.go             # Chain operations
│   ├── transaction/
│   │   ├── transaction.go       # Transaction structure
│   │   ├── pool.go              # Transaction pool
│   │   └── validation.go        # Transaction validation
│   ├── state/
│   │   ├── state.go             # World state management
│   │   ├── account.go           # Account structure
│   │   └── mpt.go               # Merkle Patricia Trie
│   ├── vm/
│   │   ├── evm.go               # EVM implementation
│   │   ├── opcodes.go           # Opcode definitions
│   │   ├── stack.go             # Stack operations
│   │   ├── memory.go            # Memory operations
│   │   └── gas.go               # Gas calculation
│   ├── consensus/
│   │   ├── pow.go               # Proof of work
│   │   ├── difficulty.go        # Difficulty adjustment
│   │   └── reward.go            # Block rewards
│   ├── network/
│   │   ├── server.go            # P2P server
│   │   ├── peer.go              # Peer management
│   │   ├── protocol.go          # Ethereum wire protocol
│   │   └── sync.go              # Blockchain synchronization
│   ├── crypto/
│   │   ├── secp256k1.go         # Elliptic curve cryptography
│   │   ├── address.go           # Address derivation
│   │   └── signature.go         # Signing and verification
│   ├── rpc/
│   │   ├── server.go            # JSON-RPC server
│   │   ├── api.go               # API methods
│   │   └── subscription.go      # Event subscriptions
│   └── wallet/
│       ├── wallet.go            # Wallet management
│       ├── keystore.go          # Key storage (encrypted)
│       └── account.go           # Account operations
├── pkg/
│   └── rlp/
│       └── encode.go            # RLP encoding/decoding
├── test/
│   ├── blockchain_test.go
│   ├── transaction_test.go
│   ├── vm_test.go
│   └── contracts/               # Test contracts
├── docs/
│   ├── implementation.md        # Implementation details
│   ├── examples.md              # Usage examples
│   └── internals.md             # Deep dive into internals
├── CHALLENGE.md                 # Challenge requirements
├── README.md                    # This file
├── go.mod
├── go.sum
└── Dockerfile
```

## How It Works

### Blockchain Data Flow

```
1. Transaction Created
   ├─ User signs transaction with private key
   ├─ Transaction added to pool
   └─ Broadcast to peers

2. Mining
   ├─ Miner selects transactions from pool
   ├─ Creates candidate block
   ├─ Runs proof-of-work algorithm
   └─ Finds valid nonce

3. Block Propagation
   ├─ Miner broadcasts new block
   ├─ Peers validate block
   ├─ Peers add block to chain
   └─ Peers forward to other peers

4. State Update
   ├─ Execute transactions in order
   ├─ Update account balances
   ├─ Execute smart contracts
   ├─ Calculate new state root
   └─ Commit to database
```

### Transaction Execution

```
Transaction Execution Flow:
┌─────────────────────────────────────────────────────────────┐
│  1. Validate Transaction                                    │
│     ├─ Check signature is valid                            │
│     ├─ Check nonce matches sender                          │
│     └─ Check sender has sufficient balance                  │
│                                                              │
│  2. Calculate Gas Cost                                      │
│     ├─ Intrinsic gas (21000 base)                           │
│     ├─ Data gas (per byte)                                  │
│     └─ Contract execution gas (if applicable)                │
│                                                              │
│  3. Deduct Upfront Cost                                     │
│     cost = gasLimit * gasPrice                               │
│     sender.balance -= cost                                   │
│                                                              │
│  4. Execute Transaction                                     │
│     ├─ If value transfer:                                   │
│     │   sender.balance -= value                             │
│     │   recipient.balance += value                          │
│     │                                                        │
│     └─ If contract creation:                                │
│        ├─ Create new account with code                       │
│        ├─ Execute constructor in EVM                         │
│        └─ Return contract address                            │
│                                                              │
│     └─ If contract call:                                    │
│        ├─ Load contract code                                 │
│        ├─ Execute in EVM                                     │
│        └─ Return result                                      │
│                                                              │
│  5. Refund Unused Gas                                       │
│     refund = (gasLimit - gasUsed) * gasPrice                  │
│     sender.balance += refund                                 │
│                                                              │
│  6. Pay Miner Fee                                           │
│     minerReward = gasUsed * gasPrice                          │
│     coinbase.address += minerReward                           │
│                                                              │
│  7. Update State                                             │
│     └─ Calculate new state root                              │
└─────────────────────────────────────────────────────────────┘
```

### Proof of Work

```
Mining Algorithm:
┌─────────────────────────────────────────────────────────────┐
│  1. Prepare Block Header                                     │
│     parentHash: hash of previous block                       │
│     number: previous.number + 1                             │
│     timestamp: current time                                  │
│     difficulty: current difficulty                           │
│     stateRoot: hash of world state                           │
│     txRoot: Merkle root of transactions                      │
│                                                              │
│  2. Find Valid Nonce                                        │
│     for nonce = 0 to MAX_UINT64:                            │
│         header.nonce = nonce                                 │
│         hash = SHA3(RLP(header))                             │
│         if hash < difficultyTarget:                          │
│             return nonce  // Found!                          │
│                                                              │
│  3. Difficulty Adjustment                                    │
│     actualTime = block.timestamp - parent.timestamp           │
│     targetTime = 15 seconds                                  │
│                                                              │
│     if actualTime < targetTime:                              │
│         // Block mined too fast, increase difficulty          │
│         newDifficulty = old * (targetTime / actualTime)       │
│     else:                                                    │
│         // Block mined too slow, decrease difficulty          │
│         newDifficulty = old * (targetTime / actualTime)       │
└─────────────────────────────────────────────────────────────┘
```

### EVM Execution

```
EVM Architecture:
┌─────────────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Stack (1024 items)                 │  │
│  │  [0x12, 0x34, 0x56, ...]                            │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Memory                             │  │
│  │  [0x00, 0x01, 0x02, ...] (expandable)              │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Storage                            │  │
│  │  Key-Value store (persistent)                        │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Program Counter                    │  │
│  │  Current execution position in code                  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

Execution Loop:
while pc < len(code) and gas > 0:
    opcode = code[pc]
    operation = OPERATIONS[opcode]

    // Check gas cost
    if gas < operation.gasCost:
        revert("out of gas")

    // Execute operation
    result = operation.execute(stack, memory, storage)
    stack.push(result)

    gas -= operation.gasCost
    pc += 1

return result, gasUsed
```

## Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| Linux (amd64) | ✅ Full support | Recommended |
| macOS (amd64) | ✅ Full support | Tested |
| macOS (arm64) | ✅ Full support | Apple Silicon |
| Windows | ✅ Full support | WSL or native |

## Testing

### Unit Tests

```bash
# Run all unit tests
go test ./...

# Run with coverage
go test -cover ./...

# Verbose output
go test -v ./...
```

### Integration Tests

```bash
# Run integration tests
go test -tags=integration ./test/integration/

# Start testnet with multiple nodes
./test/start-testnet.sh
```

### Benchmark Tests

```bash
# Run benchmarks
go test -bench=. -benchmem ./...

# Output:
// BenchmarkMining-8    1   1234567 ns/op   2048 B/op   56 allocs/op
// BenchmarkEVM-8      100000  12345 ns/op   256 B/op   8 allocs/op
```

## Troubleshooting

### Mining Not Finding Blocks

**Symptom**: Hash rate shows 0 H/s

**Solutions**:
- Check CPU is not throttled
- Increase thread count: `eth mine start --threads 8`
- Verify difficulty is reasonable

### Sync Stuck

**Symptom**: Block number not increasing

**Solutions**:
- Check peer connections: `eth network peers`
- Verify connectivity to bootstrap nodes
- Check logs for errors

### Out of Gas

**Symptom**: Transactions failing with "out of gas"

**Solutions**:
- Increase gas limit: `--gas 100000`
- Reduce contract complexity
- Optimize gas usage

## Performance Considerations

- **Block validation**: ~100ms per block
- **Mining**: Depends on hardware (10-50 MH/s on modern CPU)
- **State queries**: O(log n) with Merkle Patricia Trie
- **Contract execution**: Varies by complexity (typically 1-10ms)

## Security Considerations

⚠️ **This is an educational implementation, not production-ready:**

- No formal verification of smart contracts
- Limited protection against attacks
- Simplified consensus (no uncle validation optimizations)
- Basic P2P security (no advanced DoS protection)

**Never use this implementation for real value.**

## Further Reading

- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf)
- [EVM Explained](https://takenobu-hs.github.io/downloads/ethereum_evm_illustrated.pdf)
- [Mastering Ethereum](https://github.com/ethereumbook/ethereumbook)
- [Go Ethereum Implementation](https://github.com/ethereum/go-ethereum)

## License

MIT License - See LICENSE file for details

## Contributing

This is a coding challenge implementation. For the original challenge concept, note that this is an educational project for learning blockchain fundamentals.
