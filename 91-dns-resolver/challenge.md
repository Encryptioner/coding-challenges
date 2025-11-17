# Challenge #91 - Build Your Own DNS Resolver

**Source**: [CodingChallenges.fyi - DNS Resolver Challenge](https://codingchallenges.fyi/challenges/challenge-dns-resolver)

## Overview

This challenge is to build your own DNS Resolver that can translate domain names (like `google.com`) into IP addresses (like `142.250.185.46`).

## Background

A common interview question for technical roles is: "What happens when you enter a URL into the address bar of your browser and hit enter?" Today we're going to dig into part of the answer - specifically, how your system translates the hostname to an IP address.

### How DNS Resolution Works

When you type `dns.google.com` in your browser:

1. Your browser contacts a **DNS Resolver**
2. The resolver checks its **cache** for the answer
3. If not cached, it contacts an **authoritative nameserver**
4. To find the authoritative server, it may need to contact **root nameservers** first
5. The resolver follows the chain until it gets an IP address
6. The IP is returned to your browser

## The Challenge - Building a DNS Resolver

Build a simple DNS resolver that can resolve IP addresses for hostnames by:
- Constructing DNS query messages
- Sending queries over UDP
- Parsing DNS responses
- Following nameserver delegations
- Implementing recursive resolution

---

## Step 0: Environment Setup

### Choose Your Tools

Pick a programming language comfortable for network programming:
- **Python**: Great for clarity and has excellent socket support
- **Go**: Excellent for network programming
- **Rust**: Systems programming with safety
- **C/C++**: Low-level control
- **Node.js**: Async I/O makes network programming natural

### What You'll Need

- UDP socket support
- Ability to pack/unpack binary data
- Byte array manipulation
- Understanding of network byte order (big-endian)

---

## Step 1: Build DNS Query Message

**Goal**: Create a properly formatted DNS query message.

### DNS Message Structure

A DNS message contains:
1. **Header** (12 bytes)
2. **Question** section
3. **Answer** section (empty for queries)
4. **Authority** section (empty for queries)
5. **Additional** section (empty for queries)

### Header Format (RFC 1035 Section 4.1.1)

```
 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                      ID                       |  2 bytes
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|QR|  Opcode   |AA|TC|RD|RA|  Z    |  RCODE    |  2 bytes
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                   QDCOUNT                     |  2 bytes
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                   ANCOUNT                     |  2 bytes
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                   NSCOUNT                     |  2 bytes
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                   ARCOUNT                     |  2 bytes
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
```

**Fields**:
- **ID**: Random 16-bit identifier to match responses
- **Flags**:
  - QR (1 bit): 0 for query, 1 for response
  - Opcode (4 bits): 0 for standard query
  - RD (1 bit): 1 to request recursive resolution
- **QDCOUNT**: Number of questions (1 for us)
- **ANCOUNT**: Number of answers (0 in query)
- **NSCOUNT**: Number of authority records (0 in query)
- **ARCOUNT**: Number of additional records (0 in query)

### Question Format (RFC 1035 Section 4.1.2)

```
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                    QNAME                      |  Variable
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                    QTYPE                      |  2 bytes
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                    QCLASS                     |  2 bytes
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
```

**Fields**:
- **QNAME**: Encoded domain name (see below)
- **QTYPE**: Record type (1 = A record for IPv4)
- **QCLASS**: 1 for Internet class

### Domain Name Encoding

Domain names are encoded as length-prefixed labels:

**Example**: `dns.google.com`
```
Original:  dns.google.com
Encoded:   [3]dns[6]google[3]com[0]
Hex:       03 64 6E 73 06 67 6F 6F 67 6C 65 03 63 6F 6D 00
```

Each label is prefixed with its length (1 byte), terminated with 0.

### Example Query

For `dns.google.com` with recursion desired:

```hex
0016 0100 0001 0000 0000 0000  # Header
03 64 6e 73                    # "dns" (length 3)
06 67 6f 6f 67 6c 65          # "google" (length 6)
03 63 6f 6d                    # "com" (length 3)
00                             # Terminator
0001                           # QTYPE = A
0001                           # QCLASS = IN
```

### Acceptance Criteria

- [ ] Can construct DNS header with correct fields
- [ ] Can encode domain names in DNS format
- [ ] Can build complete query message as bytes
- [ ] All integers in network byte order (big-endian)
- [ ] Message structure matches RFC 1035

---

## Step 2: Send Query and Receive Response

**Goal**: Send the DNS query over UDP and receive the response.

### UDP Socket Communication

DNS uses UDP on port 53:

```python
# Python example
import socket

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.sendto(query_bytes, ('8.8.8.8', 53))
response, _ = sock.recvfrom(512)  # Max 512 bytes for UDP
```

### Test with Google DNS

Send your query to Google's public DNS server:
- **IP**: 8.8.8.8
- **Port**: 53
- **Domain**: dns.google.com

### Expected Response

The response will look like:
```hex
0016 8180 0001 0002 0000 0000  # Header (note QR bit set)
03646e7306676f6f676c6503636f6d00  # Question (echoed back)
0001 0001                        # QTYPE, QCLASS
c00c 0001 0001 00000214 0004     # Answer 1 header
08080808                         # IP: 8.8.8.8
c00c 0001 0001 00000214 0004     # Answer 2 header
08080404                         # IP: 8.8.4.4
```

### Acceptance Criteria

- [ ] Can create UDP socket
- [ ] Can send query to nameserver
- [ ] Can receive response
- [ ] Response ID matches query ID
- [ ] Can verify response is valid

---

## Step 3: Parse DNS Response

**Goal**: Parse the response and extract IP addresses.

### Response Structure

Same as query but with populated answer section:

1. **Header** - check QR bit is 1 (response)
2. **Question** - skip (we already know what we asked)
3. **Answer** - extract A records with IPs
4. **Authority** - may contain NS records
5. **Additional** - may contain IP addresses for NS records

### Resource Record Format (RFC 1035 Section 4.1.3)

```
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                     NAME                      |  Variable
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                     TYPE                      |  2 bytes
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                     CLASS                     |  2 bytes
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                      TTL                      |  4 bytes
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                   RDLENGTH                    |  2 bytes
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                    RDATA                      |  Variable
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
```

**For A records (TYPE=1)**:
- RDLENGTH = 4 (bytes)
- RDATA = 4-byte IP address

### DNS Name Compression (RFC 1035 Section 4.1.4)

To save space, DNS uses **pointers** to refer to names already in the message:

- If top 2 bits are set (0xC0), next 14 bits are offset
- Points to earlier occurrence of the name
- Must handle recursively

**Example**:
```
Original name: dns.google.com
Later reference: pointer to offset 12
Encoded: C0 0C  (0xC000 | 12)
```

### Acceptance Criteria

- [ ] Can parse header and verify it's a response
- [ ] Can skip question section
- [ ] Can parse answer records
- [ ] Can handle DNS name compression
- [ ] Can extract IP addresses from A records
- [ ] For dns.google.com, get 8.8.8.8 and/or 8.8.4.4

---

## Step 4: Recursive Resolution

**Goal**: Resolve any domain by following nameserver delegations.

### The Resolution Chain

To resolve `dns.google.com` from scratch:

1. **Query root server** (e.g., 198.41.0.4)
   - Response: NS records for `.com` TLD servers
   - Example: a.gtld-servers.net

2. **Query TLD server** (e.g., 192.12.94.30)
   - Response: NS records for `google.com` nameservers
   - Example: ns1.google.com

3. **Query authoritative server** (e.g., 216.239.34.10)
   - Response: A record with IP address
   - Result: 8.8.8.8

### Changes Needed

1. **Set recursion bit to 0**
   - We're doing the recursion ourselves
   - Flags: 0x0000 instead of 0x0100

2. **Handle NS records (TYPE=2)**
   - Extract nameserver names from authority section
   - Look up IP in additional section
   - If no IP, recursively resolve the nameserver

3. **Follow the chain**
   - Start with root server
   - Follow NS delegations
   - Continue until A record found

### Root Nameservers

There are 13 root server addresses:
- a.root-servers.net: **198.41.0.4**
- b.root-servers.net: 199.9.14.201
- c.root-servers.net: 192.33.4.12
- ... (and 10 more)

Use 198.41.0.4 as your starting point.

### Example Resolution Trace

```
Querying 198.41.0.4 for dns.google.com
  → NS: a.gtld-servers.net (192.12.94.30)

Querying 192.12.94.30 for dns.google.com
  → NS: ns1.google.com (216.239.34.10)

Querying 216.239.34.10 for dns.google.com
  → A: 8.8.8.8

✓ Resolved to 8.8.8.8
```

### Acceptance Criteria

- [ ] Can query root nameservers
- [ ] Can parse NS records from authority section
- [ ] Can extract nameserver IPs from additional section
- [ ] Can recursively resolve nameserver if IP not provided
- [ ] Can follow delegation chain to final answer
- [ ] Can resolve any valid domain name

---

## Bonus Challenges

### 1. CNAME Support
Handle CNAME (canonical name) records:
- TYPE = 5
- Follow CNAME to get actual hostname
- Resolve that hostname to IP

### 2. Caching
Implement a cache:
- Store responses with TTL
- Check cache before querying
- Expire entries after TTL

### 3. Multiple Record Types
Support additional record types:
- MX (mail exchange) - TYPE 15
- TXT (text) - TYPE 16
- AAAA (IPv6) - TYPE 28
- SOA (start of authority) - TYPE 6

### 4. TCP Fallback
If response doesn't fit in UDP (512 bytes):
- Detect TC (truncation) bit
- Retry over TCP
- TCP uses 2-byte length prefix

### 5. EDNS0
Implement EDNS0 for larger UDP packets:
- Add OPT record in additional section
- Advertise larger buffer size
- Support up to 4096 bytes over UDP

### 6. DNSSEC
Validate DNSSEC signatures:
- Request DNSSEC records (DO bit)
- Validate RRSIG records
- Build chain of trust to root

### 7. Parallel Queries
Query multiple nameservers in parallel:
- Try root servers concurrently
- Use fastest response
- Fallback if timeout

### 8. DNS Server
Build the other side:
- Listen on port 53
- Parse incoming queries
- Serve responses from zone file
- Implement authoritative server

---

## Testing Your Solution

### Test Cases

1. **Google DNS**
   ```bash
   resolve dns.google.com
   # Expected: 8.8.8.8 or 8.8.4.4
   ```

2. **Common Domains**
   ```bash
   resolve google.com
   resolve github.com
   resolve example.com
   ```

3. **Recursive Resolution**
   ```bash
   resolve --recursive google.com
   # Should trace through root → TLD → authoritative
   ```

4. **Subdomains**
   ```bash
   resolve www.github.com
   resolve api.github.com
   ```

### Debugging Tools

- **dig**: Command-line DNS tool
  ```bash
  dig @8.8.8.8 google.com
  ```

- **Wireshark**: Capture and analyze DNS packets
- **tcpdump**: Monitor DNS traffic
  ```bash
  sudo tcpdump -i any port 53
  ```

### Validation

Your resolver should:
- ✅ Resolve common domains correctly
- ✅ Handle both iterative and recursive modes
- ✅ Parse responses without errors
- ✅ Follow NS delegations properly
- ✅ Handle name compression
- ✅ Work with different nameservers

---

## References

### RFCs
- [RFC 1035](https://www.rfc-editor.org/rfc/rfc1035) - Domain Names (DNS Protocol)
- [RFC 1034](https://www.rfc-editor.org/rfc/rfc1034) - Domain Concepts
- [RFC 2181](https://www.rfc-editor.org/rfc/rfc2181) - DNS Specification Clarifications
- [RFC 4034](https://www.rfc-editor.org/rfc/rfc4034) - DNSSEC Resource Records

### Tools & Resources
- [DNS Lookup Tool](https://toolbox.googleapps.com/apps/dig/)
- [Root Servers](https://www.iana.org/domains/root/servers)
- [Cloudflare Learning](https://www.cloudflare.com/learning/dns/what-is-dns/)

### Example Implementations
- [mess with dns](https://messwithdns.net/) - Interactive DNS playground
- [dnspython](https://github.com/rthalley/dnspython) - Python DNS toolkit

---

## Success Criteria

Your DNS resolver is complete when it can:
- ✅ Build properly formatted DNS queries
- ✅ Send queries over UDP
- ✅ Parse DNS responses correctly
- ✅ Handle A and NS record types
- ✅ Decode compressed names
- ✅ Perform recursive resolution from root servers
- ✅ Resolve arbitrary domain names to IP addresses

Congratulations! You've built a DNS resolver from scratch! 🎉
