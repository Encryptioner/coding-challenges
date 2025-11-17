# Testing Guide

This document describes how to test the CC SMTP Server.

## Automated Testing

### Running the Test Suite

The project includes a comprehensive test suite that validates all core functionality:

```bash
make test
```

This will:
1. Build the server and test client
2. Start the server on port 2525
3. Run 10 automated tests
4. Display results
5. Clean up

### Test Coverage

The automated test suite covers:

1. **Basic Connection** - Verifies server accepts TCP connections
2. **Greeting Message** - Validates 220 response code
3. **HELO Command** - Tests client identification with HELO
4. **EHLO Command** - Tests extended HELO functionality
5. **Full Email Transaction** - Sends complete email from start to finish
6. **Email File Creation** - Confirms emails are saved to disk
7. **Multiple Recipients** - Tests multiple RCPT TO commands
8. **RSET Command** - Validates session reset functionality
9. **Concurrent Connections** - Tests multiple simultaneous clients
10. **Invalid Sequence** - Ensures proper error handling

### Expected Output

```
======================================
CC SMTP Server Test Suite
======================================

Building SMTP server and test client...
Build successful!

Starting SMTP server on port 2525...
Server started with PID 12345

Test 1: Testing basic connection...
✓ PASS: Server accepting connections
Test 2: Testing greeting message...
✓ PASS: Server sends 220 greeting
Test 3: Testing HELO command...
✓ PASS: HELO command accepted
...
======================================
Test Summary
======================================
Tests Passed: 10
Tests Failed: 0
Total Tests: 10

All tests passed!
```

## Manual Testing

### Using the Test Client

The included test client provides a quick way to test the server:

```bash
# Start the server in one terminal
./ccsmtp -v

# Run test client in another terminal
./test_client localhost 2525
```

The test client will:
- Connect to the server
- Send a complete email transaction
- Display all SMTP commands and responses
- Disconnect cleanly

### Using Telnet

Telnet provides an interactive way to test SMTP commands:

```bash
# Connect to server
telnet localhost 2525

# You'll see:
# 220 CC SMTP Server

# Type commands:
HELO mycomputer
MAIL FROM:<test@example.com>
RCPT TO:<recipient@example.com>
DATA
Subject: Test

This is a test.
.
QUIT
```

### Using Netcat

Netcat (nc) is useful for scripted tests:

```bash
# Single command test
echo "QUIT" | nc localhost 2525

# Multi-line test
printf "HELO test\r\nQUIT\r\n" | nc localhost 2525

# Complete email
cat <<EOF | nc localhost 2525
HELO testhost
MAIL FROM:<sender@test.com>
RCPT TO:<user@test.com>
DATA
Subject: Automated Test

This is an automated test email.
.
QUIT
EOF
```

### Using OpenSSL (for encrypted connections)

If you extend the server to support TLS:

```bash
openssl s_client -connect localhost:2525 -starttls smtp
```

## Testing Specific Features

### Test Multiple Recipients

```bash
printf "HELO test\r\n\
MAIL FROM:<sender@test.com>\r\n\
RCPT TO:<user1@test.com>\r\n\
RCPT TO:<user2@test.com>\r\n\
RCPT TO:<user3@test.com>\r\n\
DATA\r\n\
Subject: Multiple Recipients\r\n\
\r\n\
This goes to multiple people.\r\n\
.\r\n\
QUIT\r\n" | nc localhost 2525
```

### Test RSET Command

```bash
printf "HELO test\r\n\
MAIL FROM:<sender1@test.com>\r\n\
RSET\r\n\
MAIL FROM:<sender2@test.com>\r\n\
RCPT TO:<recipient@test.com>\r\n\
DATA\r\n\
Test after RSET\r\n\
.\r\n\
QUIT\r\n" | nc localhost 2525
```

### Test Error Handling

```bash
# Test bad command sequence
printf "DATA\r\nQUIT\r\n" | nc localhost 2525
# Expected: 503 error

# Test missing parameters
printf "HELO\r\nQUIT\r\n" | nc localhost 2525
# Expected: 501 error

# Test unknown command
printf "HELP\r\nQUIT\r\n" | nc localhost 2525
# Expected: 502 error
```

### Test Concurrent Connections

```bash
# In one terminal
./test_client localhost 2525 &
./test_client localhost 2525 &
./test_client localhost 2525 &
wait

# Check all succeeded
echo $?
```

### Test Large Messages

```bash
# Generate a large email
(
  echo "HELO test"
  echo "MAIL FROM:<sender@test.com>"
  echo "RCPT TO:<recipient@test.com>"
  echo "DATA"
  for i in {1..1000}; do
    echo "Line $i: Lorem ipsum dolor sit amet, consectetur adipiscing elit."
  done
  echo "."
  echo "QUIT"
) | nc localhost 2525
```

## Performance Testing

### Load Testing with Multiple Connections

Create a simple load test script:

```bash
#!/bin/bash
# load_test.sh

CONNECTIONS=10
PORT=2525

echo "Starting $CONNECTIONS concurrent connections..."

for i in $(seq 1 $CONNECTIONS); do
  ./test_client localhost $PORT > /dev/null 2>&1 &
done

wait
echo "All connections completed"
```

Run it:
```bash
chmod +x load_test.sh
./load_test.sh
```

### Measuring Throughput

```bash
#!/bin/bash
# throughput_test.sh

COUNT=100
START=$(date +%s)

for i in $(seq 1 $COUNT); do
  ./test_client localhost 2525 > /dev/null 2>&1
done

END=$(date +%s)
DURATION=$((END - START))
RATE=$((COUNT / DURATION))

echo "Sent $COUNT emails in $DURATION seconds"
echo "Throughput: $RATE emails/second"
```

## Debugging

### Enable Verbose Mode

Run the server with verbose logging:

```bash
./ccsmtp -v
```

This shows all SMTP commands and responses in real-time.

### Check Server Status

```bash
# Check if server is running
ps aux | grep ccsmtp

# Check listening ports
netstat -an | grep 2525
# or
lsof -i :2525

# Check active connections
netstat -an | grep 2525 | grep ESTABLISHED
```

### Monitor Email Files

```bash
# Watch for new emails
watch -n 1 'ls -lh mail/'

# View latest email
ls -t mail/ | head -1 | xargs -I {} cat mail/{}

# Count received emails
ls mail/ | wc -l
```

### System Resource Monitoring

```bash
# Monitor server resource usage
top -p $(pgrep ccsmtp)

# Monitor file descriptors
lsof -p $(pgrep ccsmtp)

# Monitor system calls
strace -p $(pgrep ccsmtp)
```

## Common Issues and Solutions

### Port Already in Use

**Problem**: `bind: Address already in use`

**Solutions**:
```bash
# Find process using the port
lsof -i :2525

# Kill the process
kill $(lsof -t -i:2525)

# Or use a different port
./ccsmtp -p 8025
```

### Permission Denied on Port 25

**Problem**: Cannot bind to port 25

**Solutions**:
```bash
# Use sudo for privileged port
sudo ./ccsmtp -p 25

# Or use non-privileged port
./ccsmtp -p 2525
```

### Connection Timeout

**Problem**: Client cannot connect to server

**Solutions**:
```bash
# Check server is running
ps aux | grep ccsmtp

# Check firewall
sudo iptables -L | grep 2525

# Test local connectivity
nc -zv localhost 2525
```

### Zombie Processes

**Problem**: Zombie child processes accumulating

**Solution**: The server includes SIGCHLD handler to reap zombies automatically. If you see zombies:

```bash
# Check for zombies
ps aux | grep defunct

# The SIGCHLD handler should clean them up automatically
# If not, check the signal handler code
```

## Testing Checklist

Before considering the server complete, verify:

- [ ] Server starts and listens on specified port
- [ ] Server sends 220 greeting on connection
- [ ] HELO command is accepted and returns 250
- [ ] EHLO command is accepted and returns extensions
- [ ] MAIL FROM command is accepted
- [ ] RCPT TO command is accepted
- [ ] Multiple RCPT TO commands work
- [ ] DATA command is accepted
- [ ] Email body is received correctly
- [ ] Dot-stuffing (transparency) works
- [ ] Email is saved to file
- [ ] QUIT command closes connection
- [ ] RSET command resets session
- [ ] NOOP command works
- [ ] Invalid commands return appropriate errors
- [ ] Invalid sequences return 503 errors
- [ ] Concurrent connections work correctly
- [ ] Server handles client disconnects gracefully
- [ ] No zombie processes accumulate
- [ ] Memory usage is stable over time

## Advanced Testing

### Fuzzing

Test with malformed input:

```bash
# Random data
head -c 1000 /dev/urandom | nc localhost 2525

# Very long lines
python3 -c "print('A' * 100000)" | nc localhost 2525

# Special characters
printf "HELO \x00\x01\x02\r\nQUIT\r\n" | nc localhost 2525
```

### Security Testing

```bash
# Test command injection
printf "HELO test; ls -la\r\nQUIT\r\n" | nc localhost 2525

# Test path traversal
printf "HELO test\r\nMAIL FROM:<../../etc/passwd>\r\nQUIT\r\n" | nc localhost 2525

# Test buffer overflow
printf "HELO %s\r\nQUIT\r\n" $(python3 -c "print('A' * 10000)") | nc localhost 2525
```

## Continuous Integration

Example GitHub Actions workflow:

```yaml
name: Test SMTP Server

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: sudo apt-get install -y netcat
      - name: Build
        run: cd 90-smtp-server && make all
      - name: Run tests
        run: cd 90-smtp-server && make test
```

## References

- [RFC 5321 - SMTP Testing](https://tools.ietf.org/html/rfc5321)
- [SMTP Test Tools](https://www.smtptester.com/)
- [Netcat Cheat Sheet](https://www.sans.org/security-resources/sec560/netcat_cheat_sheet_v1.pdf)
