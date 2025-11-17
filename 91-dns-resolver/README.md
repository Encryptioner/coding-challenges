# DNS Resolver

A simple yet complete DNS resolver implementation that demonstrates how domain names are resolved to IP addresses using the DNS protocol (RFC 1035).

## Overview

This project implements a DNS resolver from scratch in Python, showing the complete process of:
- Building DNS query messages
- Sending queries over UDP
- Parsing DNS responses
- Following nameserver delegations
- Recursive resolution from root servers

## Features

### Core Functionality
- ✅ **DNS Message Construction** - Build RFC 1035 compliant DNS queries
- ✅ **Query/Response Handling** - Send queries via UDP and parse responses
- ✅ **Record Type Support** - A records (IP addresses) and NS records (nameservers)
- ✅ **DNS Name Encoding/Decoding** - Handle DNS label format with compression
- ✅ **Recursive Resolution** - Follow nameserver chain from root to authoritative server
- ✅ **Simple Interface** - Easy-to-use command-line tool

### Implementation Highlights
- Clean, educational code with extensive comments
- Type hints for clarity
- Dataclasses for DNS structures
- Step-by-step implementation following RFC 1035
- Both iterative and recursive resolution modes

## Installation

### Prerequisites
- Python 3.7 or higher
- Network access (for actual DNS queries)

### Setup

```bash
cd 91-dns-resolver

# Make scripts executable
chmod +x dns_resolver.py test_dns.py

# No additional dependencies required (uses only Python standard library)
```

## Usage

### Basic Resolution

Resolve a domain using Google's DNS server (default):

```bash
python3 dns_resolver.py google.com
```

Output:
```
Resolving google.com using nameserver 8.8.8.8...

✓ Resolved google.com to 142.250.185.46
```

### Specify Custom Nameserver

```bash
python3 dns_resolver.py example.com 1.1.1.1
```

### Recursive Resolution from Root Servers

Follow the complete DNS hierarchy starting from root servers:

```bash
python3 dns_resolver.py dns.google.com --recursive
```

Output:
```
Resolving dns.google.com recursively from root servers...

Querying 198.41.0.4 for dns.google.com
Querying 192.12.94.30 for dns.google.com
Querying 216.239.34.10 for dns.google.com

✓ Resolved dns.google.com to 8.8.8.8
```

### Running Tests

```bash
python3 test_dns.py
```

## How It Works

### DNS Resolution Process

1. **Build Query Message**
   - Create DNS header with random ID and flags
   - Encode domain name in DNS format
   - Add question section (domain, type, class)

2. **Send Query**
   - Create UDP socket
   - Send query to nameserver on port 53
   - Receive response (max 512 bytes for UDP)

3. **Parse Response**
   - Extract header to verify it's a response
   - Skip question section
   - Parse answer records for IP addresses
   - Parse authority/additional for nameserver info

4. **Recursive Resolution** (if needed)
   - Start with root nameserver
   - Follow NS records to next nameserver
   - Repeat until A record found

### DNS Message Format

```
+---------------------+
|       Header        |  12 bytes
+---------------------+
|      Question       |  Variable
+---------------------+
|       Answer        |  Variable
+---------------------+
|     Authority       |  Variable
+---------------------+
|     Additional      |  Variable
+---------------------+
```

### Header Structure (12 bytes)

```
 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                      ID                       |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|QR|  Opcode   |AA|TC|RD|RA|  Z    |  RCODE    |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                   QDCOUNT                     |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                   ANCOUNT                     |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                   NSCOUNT                     |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                   ARCOUNT                     |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
```

### DNS Name Encoding

Domain names are encoded as length-prefixed labels:

```
"dns.google.com" → [3]dns[6]google[3]com[0]
```

- Each label prefixed with its length (1 byte)
- Terminated with null byte (0)
- Compression pointers use 2-byte offset with top 2 bits set

## Code Structure

```
91-dns-resolver/
├── dns_resolver.py      # Main implementation
├── test_dns.py          # Test suite
├── README.md            # This file
├── challenge.md         # Challenge description
└── docs/
    ├── implementation.md  # Detailed implementation guide
    ├── examples.md        # Usage examples
    └── protocol.md        # DNS protocol deep dive
```

## Examples

### Programmatic Usage

```python
from dns_resolver import resolve, resolve_recursive

# Simple resolution
ip = resolve('google.com', '8.8.8.8')
print(f"IP: {ip}")  # Output: IP: 142.250.185.46

# Recursive resolution
ip = resolve_recursive('example.com')
print(f"IP: {ip}")  # Output: IP: 93.184.216.34
```

### Building Custom Queries

```python
from dns_resolver import build_query, send_query, parse_response

# Build query for A record
query = build_query('example.com', record_type=1, recursion_desired=True)

# Send to nameserver
response = send_query('8.8.8.8', 'example.com')

# Parse response
header, answers, authorities, additionals = parse_response(response)

# Extract IP from answer
for record in answers:
    if record.type == 1:  # A record
        print(record.get_ip())
```

## Implementation Steps (Challenge Progression)

### Step 1: Build DNS Query Message ✅
- Implemented DNS header with all fields
- Created question encoding with domain name encoding
- Generated proper byte format for network transmission

### Step 2: Send Query and Receive Response ✅
- Created UDP socket
- Sent query to Google DNS (8.8.8.8)
- Received and validated response

### Step 3: Parse DNS Response ✅
- Parsed header with all flags
- Decoded compressed domain names
- Extracted answers, authorities, and additionals sections
- Validated response records

### Step 4: Recursive Resolution ✅
- Queried root nameservers
- Followed NS record delegations
- Resolved nameserver IPs when needed
- Retrieved final A record with IP address

## DNS Record Types Supported

| Type | Code | Description | Support |
|------|------|-------------|---------|
| A | 1 | IPv4 address | ✅ Full |
| NS | 2 | Nameserver | ✅ Full |
| CNAME | 5 | Canonical name | ⬜ Future |
| SOA | 6 | Start of authority | ⬜ Future |
| MX | 15 | Mail exchange | ⬜ Future |
| TXT | 16 | Text record | ⬜ Future |
| AAAA | 28 | IPv6 address | ⬜ Future |

## Limitations

- **UDP Only**: Uses 512-byte UDP packets (no TCP fallback)
- **No DNSSEC**: Doesn't validate DNSSEC signatures
- **Limited Record Types**: Only A and NS records fully supported
- **No Caching**: Doesn't cache results (every query hits network)
- **IPv4 Only**: Doesn't handle IPv6 (AAAA records)

## Future Enhancements

- [ ] Add CNAME record support
- [ ] Implement DNS caching with TTL
- [ ] Add TCP support for large responses
- [ ] Support IPv6 (AAAA records)
- [ ] Implement EDNS0 for larger UDP packets
- [ ] Add MX and TXT record support
- [ ] Implement DNSSEC validation
- [ ] Add response timeout and retry logic
- [ ] Create async/await version
- [ ] Add DNS server mode (authoritative server)

## Technical Details

### DNS Protocol (RFC 1035)

- **Transport**: UDP port 53 (TCP for zone transfers)
- **Max UDP Size**: 512 bytes (can be extended with EDNS0)
- **Byte Order**: Network byte order (big-endian)
- **Name Compression**: Pointers to reduce packet size
- **TTL**: Time-to-live for caching (in seconds)

### Root Nameservers

There are 13 root nameserver addresses (a.root-servers.net through m.root-servers.net):

- a.root-servers.net: 198.41.0.4
- b.root-servers.net: 199.9.14.201
- c.root-servers.net: 192.33.4.12
- And 10 more...

Our implementation uses `198.41.0.4` (a.root-servers.net) as the default root server.

## Troubleshooting

### Network Timeouts

If queries time out:
- Check internet connection
- Verify firewall allows UDP port 53
- Try different nameserver (e.g., 1.1.1.1 instead of 8.8.8.8)
- Increase timeout in code

### DNS Resolution Failures

If resolution fails:
- Domain may not exist
- Nameserver may be down
- NXDOMAIN response (no such domain)
- Check DNS propagation if domain is new

### Sandboxed Environments

This resolver requires outbound UDP port 53 access. In restricted environments (containers, VMs with network policies), external DNS queries may be blocked.

## References

- [RFC 1035](https://www.rfc-editor.org/rfc/rfc1035) - Domain Names Implementation and Specification
- [Root Servers](https://www.iana.org/domains/root/servers) - Root Server Technical Information
- [DNS Query Tool](https://toolbox.googleapps.com/apps/dig/) - Google's DNS Lookup Tool
- [Wireshark](https://www.wireshark.org/) - Network protocol analyzer for debugging

## License

This is an educational project created as part of the [CodingChallenges.fyi](https://codingchallenges.fyi/challenges/challenge-dns-resolver) challenge series.

## Contributing

This is a learning project, but improvements are welcome:
- Bug fixes
- Additional record type support
- Better error handling
- Performance optimizations
- Documentation improvements

## Author

Built as part of the Coding Challenges series.
