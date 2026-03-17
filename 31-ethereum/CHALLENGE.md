# Build Your Own Ethereum

This challenge is to build your own blockchain and cryptocurrency system inspired by Ethereum.

## Background

Ethereum is a decentralized, open-source blockchain with smart contract functionality. It enables developers to build decentralized applications (DApps) and deploy smart contracts that run exactly as programmed without downtime, censorship, fraud, or third-party interference.

Key innovations introduced by Ethereum:
- **Smart Contracts**: Self-executing contracts with code defining behavior
- **Turing-complete Virtual Machine**: The Ethereum Virtual Machine (EVM) executes contract code
- **Gas Mechanism**: Computational steps cost money to prevent infinite loops
- **State Transitions**: The blockchain tracks global state, not just transactions
- **Accounts**: Both user-controlled (externally owned) and contract accounts

## The Challenge - Building Your Own Ethereum

In this coding challenge, we'll build a blockchain system that implements core Ethereum functionality:

1. **Block Structure**: Blocks containing transactions, state root, and proofs of work
2. **Transaction Processing**: Validating and executing transactions
3. **State Management**: Tracking account balances and contract storage
4. **Mining**: Proof-of-work consensus mechanism
5. **Networking**: Peer-to-peer communication
6. **Smart Contracts**: A simple virtual machine for contract execution

You'll implement each component step by step, creating a functional blockchain.

## Step Zero

Set up your development environment. Choose a language with:
- Cryptographic libraries (hashing, signing, verification)
- Network programming capabilities
- Data structures (Merkle trees, tries)
- JSON/serialization support

**Recommended Languages**:
- **Go**: Excellent crypto libraries, good concurrency
- **Rust**: Memory safety, growing crypto ecosystem
- **Python**: Simple, great libraries (web3.py reference)
- **TypeScript/JavaScript**: Node.js ecosystem, web3.js reference

For this challenge, we'll use **Go** for its excellent standard library and performance.

## Step 1

In this step, your goal is to implement the basic block structure.

A block contains:
- **Header**: Block metadata and proof of work
- **Transactions**: List of transactions
- **State Root**: Merkle root of the world state

Block structure:
```
type Block struct {
    Header       BlockHeader
    Transactions []Transaction
}

type BlockHeader struct {
    ParentHash   Hash      // Hash of parent block
    Number       uint64    // Block number (0 for genesis)
    Timestamp    uint64    // Unix timestamp
    StateRoot    Hash      // Merkle root of world state
    TxRoot       Hash      // Merkle root of transactions
    Difficulty   uint64    // Mining difficulty
    Nonce        uint64    // Proof of work nonce
}

type Transaction struct {
    From     Address  // Sender address
    To       Address  // Recipient address (nil for contract creation)
    Value    uint64   // Amount to transfer (in wei)
    Gas      uint64   // Gas limit
    GasPrice uint64   // Price per gas unit
    Data     []byte   // Contract creation code or function call
    Nonce    uint64   // Sender's transaction count
    Sig      Signature// cryptographic signature
}
```

**Requirements**:
1. Create a genesis block (block 0 with no parent)
2. Calculate block hash: `SHA3(blockHeader.RLPEncode())`
3. Verify block hash meets difficulty target
4. Link blocks via parent hash

**Test**:
```bash
eth blockchain create-genesis
# Output: Created genesis block with hash 0x1234...

eth block get 0
# Output: Block #0, hash: 0x1234..., parent: none, timestamp: ...
```

## Step 2

In this step, your goal is to implement the transaction pool and validation.

Your node should:
1. Accept transactions from users
2. Validate transactions (signature, nonce, balance)
3. Maintain a pool of pending transactions
4. Select transactions for block inclusion

Transaction validation:
```go
func ValidateTx(tx Transaction, state State) error {
    // Check signature
    if !tx.VerifySignature() {
        return ErrInvalidSignature
    }

    // Check nonce
    expectedNonce := state.GetNonce(tx.From)
    if tx.Nonce != expectedNonce {
        return ErrInvalidNonce
    }

    // Check balance
    cost := tx.Value + tx.Gas * tx.GasPrice
    if state.GetBalance(tx.From) < cost {
        return ErrInsufficientBalance
    }

    return nil
}
```

**Key Concepts**:
- Elliptic curve cryptography (secp256k1)
- Transaction signing and verification
- Account nonce (anti-replay)
- Balance checking
- Gas calculation

## Step 3

In this step, your goal is to implement world state management.

The world state tracks:
- **Account balances**: How much ETH each address has
- **Account nonces**: Transaction counts
- **Contract storage**: Data stored by contracts
- **Contract code**: EVM bytecode

State structure:
```
type State struct {
    Accounts map[Address]Account
}

type Account struct {
    Balance  uint64
    Nonce    uint64
    CodeHash Hash      // Hash of contract code (empty for EOAs)
    Storage  Hash      // Merkle root of contract storage
}
```

**Requirements**:
1. Initialize state with genesis allocations
2. Update state for each transaction
3. Calculate state root hash (Merkle Patricia Trie)
4. Support state queries (balance, nonce, code, storage)

**State Transition**:
```
For each transaction in block:
1. Verify sender has sufficient balance
2. Deduct gas cost from sender
3. Execute transaction (transfer value or run contract)
4. Refund unused gas
5. Update state
6. Calculate new state root
```

## Step 4

In this step, your goal is to implement a simple virtual machine for contract execution.

The VM should support:
1. Stack-based execution (push, pop, arithmetic)
2. Memory operations (mstore, mload)
3. Storage operations (sstore, sload)
4. Control flow (jump, jumpi)
5. Contract creation (CREATE)
6. Message calls (CALL)

Basic EVM opcodes:
```
0x00: STOP    - halt execution
0x01: ADD     - pop two, push sum
0x02: MUL     - pop two, push product
0x03: SUB     - pop two, push difference
0x10: LT      - pop two, push (a < b ? 1 : 0)
0x51: MLOAD   - load from memory
0x52: MSTORE  - store to memory
0x54: SLOAD   - load from storage
0x55: SSTORE  - store to storage
0x56: JUMP    - jump to location
0x57: JUMPI   - conditional jump
0xF0: CREATE  - create new contract
0xF1: CALL    - call another contract
```

**Example Contract** (Simple storage):

```
PUSH1 0x42        // [0x42]
PUSH1 0           // [0x42, 0]
SSTORE            // storage[0] = 0x42

PUSH1 0           // [0]
SLOAD             // [storage[0]] = 0x42
```

**Key Concepts**:
- Stack manipulation
- Gas metering per opcode
- Revert on out of gas
- Exception handling

## Step 5

In this step, your goal is to implement proof-of-work mining.

Mining involves:
1. Gathering pending transactions
2. Creating a candidate block
3. Finding a nonce that makes block hash valid
4. Broadcasting the new block

Proof of work:
```
Find nonce such that:
SHA3(blockHeaderWithoutNonce ++ nonce) < difficultyTarget

For difficulty = 2^20:
Hash must have 20 leading zero bits
```

Mining loop:
```go
func Mine(block Block, difficulty uint64) Block {
    target := new(big.Int).Lsh(big.NewInt(1), 256 - uint(difficulty))

    for nonce := uint64(0); ; nonce++ {
        block.Header.Nonce = nonce
        hash := block.Hash()

        if new(big.Int).SetBytes(hash[:]).Cmp(target) == -1 {
            return block  // Found valid nonce!
        }
    }
}
```

**Requirements**:
1. Adjust difficulty based on block time
2. Limit block size (gas limit)
3. Reward miner with new ETH
4. Handle uncle blocks (stale blocks)

**Mining Reward**:
```
Block reward: 2 ETH
Uncle reward: up to 2.125 ETH (based on uncle number)
```

## Step 6

In this step, your goal is to implement peer-to-peer networking.

Your node should:
1. Discover peers on the network
2. Maintain connections to multiple peers
3. Sync blockchain with peers
4. Broadcast transactions and blocks

**Message Types**:
```
0x00: Hello        - Version and capabilities handshake
0x01: Disconnect   - Connection termination
0x02: Ping         - Keep-alive
0x03: Pong        - Ping response
0x10: GetBlocks    - Request block hashes
0x11: Blocks       - Send block hashes
0x12: GetBlock     - Request full block
0x13: Block        - Send full block
0x18: NewBlock     - Announce newly mined block
0x20: Transactions - Broadcast transaction
```

**Peer Discovery**:
- Use bootstrap nodes
- Maintain peer table
- Periodically ping peers
- Handle disconnects

**Block Sync**:
```
On connection:
1. Exchange status (best block, total difficulty)
2. If peer has better chain, request blocks
3. Validate received blocks
4. Request missing blocks
5. Update blockchain
```

## Step 7

In this step, your goal is to implement a simple wallet.

Your wallet should:
1. Generate private keys
2. Derive addresses from private keys
3. Sign transactions
4. Manage multiple accounts
5. Track balances

**Key Generation** (secp256k1):
```
Private key: random 32 bytes
Public key:  ECDSA private * G
Address:     SHA3(public key)[12:]

Example:
Private: 0xc87f65ff3f271c5e5b8c7a0d5c...
Public:  0x04f876... (uncompressed)
Address:  0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**Transaction Signing**:
```
1. Hash transaction: SHA3(RLP(from, to, value, nonce, gas, gasPrice, data))
2. Sign hash with private key: (r, s, v)
3. Return signature + transaction
```

**Wallet Commands**:
```bash
eth wallet create
# Output: Created new account 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
# Private key saved to wallet.dat

eth wallet balance 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
# Output: Balance: 1000000000000000000 wei (1 ETH)

eth wallet send 0x742d... 0x1234... 1000000000000000
# Output: Sent 0.001 ETH to 0x1234...
# Tx hash: 0xabcd...
```

## Step 8

In this step, your goal is to implement a JSON-RPC API.

Your node should expose an API for:
- Querying blockchain state
- Submitting transactions
- Managing accounts
- Listening for events

**JSON-RPC Methods**:

```json
// Get block by number
{
  "jsonrpc": "2.0",
  "method": "eth_getBlockByNumber",
  "params": ["0x0", false],
  "id": 1
}

// Get balance
{
  "jsonrpc": "2.0",
  "method": "eth_getBalance",
  "params": ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", "latest"],
  "id": 2
}

// Send transaction
{
  "jsonrpc": "2.0",
  "method": "eth_sendTransaction",
  "params": [{
    "from": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "to": "0x1234...",
    "value": "0xde0b6b3a7640000",
    "gas": "0x5208",
    "gasPrice": "0x4a817c800"
  }],
  "id": 3
}
```

**Web3 Compatibility**:
Implement subset of Web3.js API for compatibility with existing tools.

## Going Further

There's plenty more you can add:
- **Sharding**: Split blockchain into parallel chains
- **Proof of Stake**: Replace mining with validator staking
- **State Channels**: Off-chain transactions
- **Zero-Knowledge Proofs**: Privacy-preserving transactions
- **Cross-chain Bridges**: Interoperability with other blockchains
- **Advanced EVM**: Support all opcodes, precompiled contracts
- **Wallet Encryption**: Protect private keys with passwords
- **DApp Browser**: Browser for decentralized applications
- **Faucet**: Testnet ETH dispenser
- **Block Explorer**: Web interface for exploring blockchain

## References

- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf)
- [Ethereum Whitepaper](https://ethereum.org/en/whitepaper/)
- [EVM Opcode Reference](https://www.evm.codes/)
- [Merkle Patricia Trie](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/)
- [Consensus Mechanisms](https://ethereum.org/en/developers/docs/consensus-mechanisms/)
- [Web3.js Documentation](https://web3js.readthedocs.io/)
