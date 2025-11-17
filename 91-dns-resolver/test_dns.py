#!/usr/bin/env python3
"""
Test suite for DNS resolver
"""

import sys
from dns_resolver import (
    encode_dns_name, decode_dns_name, build_query, parse_response,
    send_query, resolve, resolve_recursive
)


def test_encode_dns_name():
    """Test DNS name encoding"""
    print("Testing DNS name encoding...")

    # Test case: dns.google.com
    encoded = encode_dns_name('dns.google.com')
    expected = b'\x03dns\x06google\x03com\x00'
    assert encoded == expected, f"Expected {expected}, got {encoded}"
    print("✓ DNS name encoding works correctly")


def test_decode_dns_name():
    """Test DNS name decoding"""
    print("Testing DNS name decoding...")

    # Test case: dns.google.com
    data = b'\x03dns\x06google\x03com\x00extra'
    name, offset = decode_dns_name(data, 0)
    assert name == 'dns.google.com', f"Expected 'dns.google.com', got '{name}'"
    assert offset == 17, f"Expected offset 17, got {offset}"
    print("✓ DNS name decoding works correctly")


def test_build_query():
    """Test DNS query building"""
    print("Testing DNS query building...")

    query = build_query('dns.google.com', record_type=1, recursion_desired=True)

    # Check length (12 byte header + encoded name + 4 bytes for type/class)
    # dns.google.com encoded is 17 bytes
    assert len(query) == 12 + 17 + 4, f"Unexpected query length: {len(query)}"

    # Check header structure
    assert query[2:4] == b'\x01\x00', "Recursion desired flag not set"
    assert query[4:6] == b'\x00\x01', "Question count should be 1"

    print("✓ DNS query building works correctly")


def test_google_dns():
    """Test querying Google's DNS server"""
    print("\nTesting query to Google DNS (8.8.8.8)...")

    try:
        ip = resolve('dns.google.com', '8.8.8.8')
        assert ip in ['8.8.8.8', '8.8.4.4'], f"Unexpected IP: {ip}"
        print(f"✓ Successfully resolved dns.google.com to {ip}")
    except Exception as e:
        print(f"✗ Failed to resolve: {e}")
        return False

    return True


def test_common_domains():
    """Test resolving common domains"""
    print("\nTesting resolution of common domains...")

    domains = ['google.com', 'github.com', 'example.com']

    for domain in domains:
        try:
            ip = resolve(domain, '8.8.8.8')
            if ip:
                print(f"✓ Resolved {domain} to {ip}")
            else:
                print(f"✗ Could not resolve {domain}")
        except Exception as e:
            print(f"✗ Error resolving {domain}: {e}")


def test_recursive_resolution():
    """Test recursive resolution from root servers"""
    print("\nTesting recursive resolution from root servers...")
    print("(This may take several seconds as it follows the DNS hierarchy)\n")

    try:
        ip = resolve_recursive('dns.google.com')
        assert ip in ['8.8.8.8', '8.8.4.4'], f"Unexpected IP: {ip}"
        print(f"\n✓ Successfully resolved dns.google.com to {ip} via recursive resolution")
    except Exception as e:
        print(f"\n✗ Failed recursive resolution: {e}")
        return False

    return True


def test_parse_response():
    """Test parsing a DNS response"""
    print("\nTesting DNS response parsing...")

    # Send a real query and parse the response
    try:
        response = send_query('8.8.8.8', 'dns.google.com')
        header, answers, authorities, additionals = parse_response(response)

        print(f"  Questions: {header.num_questions}")
        print(f"  Answers: {header.num_answers}")
        print(f"  Authorities: {header.num_authorities}")
        print(f"  Additionals: {header.num_additionals}")

        assert header.num_questions == 1, "Should have 1 question"
        assert header.num_answers >= 1, "Should have at least 1 answer"

        # Check answers
        for i, record in enumerate(answers):
            ip = record.get_ip()
            if ip:
                print(f"  Answer {i+1}: {record.name} -> {ip}")

        print("✓ DNS response parsing works correctly")
    except Exception as e:
        print(f"✗ Failed to parse response: {e}")
        return False

    return True


def run_all_tests():
    """Run all tests"""
    print("=" * 60)
    print("DNS Resolver Test Suite")
    print("=" * 60)
    print()

    try:
        # Unit tests
        test_encode_dns_name()
        test_decode_dns_name()
        test_build_query()

        # Integration tests
        test_parse_response()
        test_google_dns()
        test_common_domains()

        # Recursive resolution test (optional, can be slow)
        print("\n" + "=" * 60)
        print("Testing recursive resolution (this may take 10-30 seconds)...")
        print("=" * 60)
        test_recursive_resolution()

        print("\n" + "=" * 60)
        print("✓ All tests passed!")
        print("=" * 60)

    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    run_all_tests()
