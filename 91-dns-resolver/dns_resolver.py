#!/usr/bin/env python3
"""
DNS Resolver - A simple DNS resolver that can resolve hostnames to IP addresses
following RFC 1035 DNS protocol specification.

This implementation demonstrates:
- DNS message construction
- UDP socket communication
- DNS message parsing
- Recursive DNS resolution
- Support for A and NS records
"""

import socket
import struct
import random
from typing import List, Tuple, Optional
from dataclasses import dataclass


@dataclass
class DNSHeader:
    """DNS message header as defined in RFC 1035 Section 4.1.1"""
    id: int  # 16-bit identifier
    flags: int  # 16-bit flags field
    num_questions: int = 0
    num_answers: int = 0
    num_authorities: int = 0
    num_additionals: int = 0

    def to_bytes(self) -> bytes:
        """Convert header to bytes for network transmission"""
        return struct.pack(
            '!HHHHHH',  # ! = network (big-endian), H = unsigned short (2 bytes)
            self.id,
            self.flags,
            self.num_questions,
            self.num_answers,
            self.num_authorities,
            self.num_additionals
        )

    @classmethod
    def from_bytes(cls, data: bytes) -> 'DNSHeader':
        """Parse header from bytes"""
        id, flags, num_q, num_ans, num_auth, num_add = struct.unpack('!HHHHHH', data[:12])
        return cls(id, flags, num_q, num_ans, num_auth, num_add)


@dataclass
class DNSQuestion:
    """DNS question section as defined in RFC 1035 Section 4.1.2"""
    name: str  # Domain name to query
    qtype: int  # Query type (1 = A record, 2 = NS record)
    qclass: int  # Query class (1 = IN for Internet)

    def to_bytes(self) -> bytes:
        """Convert question to bytes for network transmission"""
        # Encode the domain name
        encoded_name = encode_dns_name(self.name)
        # Pack type and class as 16-bit integers
        return encoded_name + struct.pack('!HH', self.qtype, self.qclass)


@dataclass
class DNSRecord:
    """DNS resource record as defined in RFC 1035 Section 4.1.3"""
    name: str
    type: int
    class_: int
    ttl: int
    data: bytes

    def get_ip(self) -> Optional[str]:
        """Extract IP address from A record"""
        if self.type == 1 and len(self.data) == 4:
            return '.'.join(str(b) for b in self.data)
        return None

    def get_nameserver(self) -> Optional[str]:
        """Extract nameserver from NS record"""
        if self.type == 2:
            # NS record data is an encoded domain name
            name, _ = decode_dns_name(self.data, 0)
            return name
        return None


def encode_dns_name(name: str) -> bytes:
    """
    Encode a domain name into DNS format.

    Example: 'dns.google.com' -> b'\\x03dns\\x06google\\x03com\\x00'
    Each label is prefixed with its length, terminated with 0.
    """
    encoded = b''
    for part in name.split('.'):
        length = len(part)
        encoded += bytes([length]) + part.encode('ascii')
    encoded += b'\x00'  # Null terminator
    return encoded


def decode_dns_name(data: bytes, offset: int) -> Tuple[str, int]:
    """
    Decode a domain name from DNS format, handling compression.

    Returns: (decoded_name, new_offset)

    DNS uses compression (RFC 1035 Section 4.1.4) where a name can be
    represented as a pointer to an earlier occurrence in the message.
    Pointers are indicated by the two high bits being set (0xC0).
    """
    parts = []
    jumped = False
    original_offset = offset
    max_jumps = 5  # Prevent infinite loops
    jumps = 0

    while True:
        if jumps > max_jumps:
            raise Exception("Too many jumps in DNS name compression")

        # Check if we've reached the end
        if offset >= len(data):
            break

        length = data[offset]

        # Check for compression pointer (two high bits set: 0xC0)
        if (length & 0xC0) == 0xC0:
            if not jumped:
                original_offset = offset + 2

            # Extract pointer: lower 14 bits
            pointer = struct.unpack('!H', data[offset:offset+2])[0]
            pointer &= 0x3FFF  # Mask to get lower 14 bits
            offset = pointer
            jumped = True
            jumps += 1
            continue

        # Length of 0 indicates end of name
        if length == 0:
            offset += 1
            break

        # Read the label
        offset += 1
        parts.append(data[offset:offset+length].decode('ascii'))
        offset += length

    name = '.'.join(parts)

    if jumped:
        return name, original_offset
    else:
        return name, offset


def build_query(domain: str, record_type: int = 1, recursion_desired: bool = True) -> bytes:
    """
    Build a DNS query message.

    Args:
        domain: Domain name to query (e.g., 'google.com')
        record_type: 1 for A record, 2 for NS record
        recursion_desired: Whether to request recursive resolution

    Returns:
        DNS query as bytes ready to send over network
    """
    # Generate random ID
    query_id = random.randint(0, 65535)

    # Build flags
    # Bits: QR(1) | Opcode(4) | AA(1) | TC(1) | RD(1) | RA(1) | Z(3) | RCODE(4)
    # RD (Recursion Desired) is bit 8 (from right, 0-indexed)
    flags = 0x0100 if recursion_desired else 0x0000  # RD bit

    # Create header
    header = DNSHeader(
        id=query_id,
        flags=flags,
        num_questions=1,
        num_answers=0,
        num_authorities=0,
        num_additionals=0
    )

    # Create question
    question = DNSQuestion(
        name=domain,
        qtype=record_type,
        qclass=1  # IN (Internet)
    )

    # Build message
    message = header.to_bytes() + question.to_bytes()

    return message


def parse_response(data: bytes) -> Tuple[DNSHeader, List[DNSRecord], List[DNSRecord], List[DNSRecord]]:
    """
    Parse a DNS response message.

    Returns:
        (header, answers, authorities, additionals)
    """
    # Parse header
    header = DNSHeader.from_bytes(data)

    # Check QR bit (should be 1 for response)
    if not (header.flags & 0x8000):
        raise Exception("Not a response")

    offset = 12  # Header is 12 bytes

    # Skip question section
    for _ in range(header.num_questions):
        # Parse domain name
        _, offset = decode_dns_name(data, offset)
        # Skip qtype and qclass (4 bytes total)
        offset += 4

    # Helper function to parse records
    def parse_records(count: int) -> List[DNSRecord]:
        nonlocal offset
        records = []
        for _ in range(count):
            # Parse name
            name, offset = decode_dns_name(data, offset)

            # Parse type, class, ttl, and data length
            type_, class_, ttl, data_len = struct.unpack('!HHIH', data[offset:offset+10])
            offset += 10

            # Extract data
            record_data = data[offset:offset+data_len]
            offset += data_len

            records.append(DNSRecord(name, type_, class_, ttl, record_data))

        return records

    # Parse answer, authority, and additional sections
    answers = parse_records(header.num_answers)
    authorities = parse_records(header.num_authorities)
    additionals = parse_records(header.num_additionals)

    return header, answers, authorities, additionals


def send_query(nameserver: str, domain: str, record_type: int = 1,
               recursion_desired: bool = True, timeout: float = 5.0) -> bytes:
    """
    Send a DNS query to a nameserver and return the response.

    Args:
        nameserver: IP address of DNS server
        domain: Domain to query
        record_type: 1 for A, 2 for NS
        recursion_desired: Whether to ask for recursive resolution
        timeout: Socket timeout in seconds

    Returns:
        Raw DNS response bytes
    """
    # Build query
    query = build_query(domain, record_type, recursion_desired)

    # Create UDP socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(timeout)

    try:
        # Send query to DNS server on port 53
        sock.sendto(query, (nameserver, 53))

        # Receive response (max 512 bytes for UDP)
        response, _ = sock.recvfrom(512)

        return response
    finally:
        sock.close()


def resolve(domain: str, nameserver: str = '8.8.8.8', recursion: bool = True) -> Optional[str]:
    """
    Resolve a domain name to an IP address.

    Args:
        domain: Domain name to resolve
        nameserver: DNS server to query
        recursion: Use recursive resolution

    Returns:
        IP address as string, or None if not found
    """
    # Send query
    response = send_query(nameserver, domain, record_type=1, recursion_desired=recursion)

    # Parse response
    header, answers, authorities, additionals = parse_response(response)

    # Look for A records in answers
    for record in answers:
        if record.type == 1:  # A record
            ip = record.get_ip()
            if ip:
                return ip

    return None


def resolve_recursive(domain: str, root_server: str = '198.41.0.4') -> Optional[str]:
    """
    Recursively resolve a domain name by following NS records.

    This implements the full DNS resolution process:
    1. Query root nameserver
    2. Follow NS records to authoritative nameservers
    3. Continue until we get an A record with the IP

    Args:
        domain: Domain name to resolve
        root_server: Root DNS server to start with

    Returns:
        IP address as string, or None if not found
    """
    nameserver = root_server

    while True:
        print(f"Querying {nameserver} for {domain}")

        # Send query without recursion
        response = send_query(nameserver, domain, record_type=1, recursion_desired=False)

        # Parse response
        header, answers, authorities, additionals = parse_response(response)

        # Check for A record in answers
        for record in answers:
            if record.type == 1:  # A record
                ip = record.get_ip()
                if ip:
                    return ip

        # Look for NS records in authorities
        ns_records = [r for r in authorities if r.type == 2]

        if not ns_records:
            # No more nameservers to try
            return None

        # Find IP for the nameserver
        # First check additionals section
        ns_name = ns_records[0].get_nameserver()
        ns_ip = None

        for record in additionals:
            if record.type == 1 and record.name == ns_name:
                ns_ip = record.get_ip()
                break

        if not ns_ip:
            # Need to resolve the nameserver's IP first
            ns_ip = resolve_recursive(ns_name, root_server)

        if not ns_ip:
            return None

        # Use this nameserver for next iteration
        nameserver = ns_ip


def main():
    """Main function demonstrating DNS resolver usage"""
    import sys

    if len(sys.argv) < 2:
        print("Usage: python dns_resolver.py <domain> [nameserver]")
        print("\nExamples:")
        print("  python dns_resolver.py google.com")
        print("  python dns_resolver.py dns.google.com 8.8.8.8")
        print("  python dns_resolver.py example.com --recursive")
        sys.exit(1)

    domain = sys.argv[1]

    # Check for recursive flag
    if '--recursive' in sys.argv or '-r' in sys.argv:
        print(f"Resolving {domain} recursively from root servers...\n")
        ip = resolve_recursive(domain)
    else:
        nameserver = sys.argv[2] if len(sys.argv) > 2 else '8.8.8.8'
        print(f"Resolving {domain} using nameserver {nameserver}...\n")
        ip = resolve(domain, nameserver)

    if ip:
        print(f"\n✓ Resolved {domain} to {ip}")
    else:
        print(f"\n✗ Could not resolve {domain}")
        sys.exit(1)


if __name__ == '__main__':
    main()
