# CC SMTP Server

A simple SMTP (Simple Mail Transfer Protocol) server implementation in C, built as part of the [CodingChallenges.fyi](https://codingchallenges.fyi/challenges/challenge-smtp) challenge series.

## Features

- **SMTP Protocol Support**: Implements core SMTP commands according to RFC 5321
  - `HELO` / `EHLO` - Client identification
  - `MAIL FROM` - Sender specification
  - `RCPT TO` - Recipient specification (multiple recipients supported)
  - `DATA` - Email body transmission
  - `QUIT` - Close connection
  - `RSET` - Reset session
  - `NOOP` - No operation

- **Concurrent Connections**: Handles multiple simultaneous clients using fork()
- **Email Storage**: Saves received emails to local files with timestamps
- **Configurable Port**: Can run on any port (default 2525 to avoid requiring root)
- **Verbose Mode**: Optional detailed logging of all SMTP transactions
- **Cross-Platform**: Works on Linux, macOS, and BSD systems

## Building

### Prerequisites

- GCC or compatible C compiler
- POSIX-compliant system (Linux, macOS, BSD)
- netcat (`nc`) for running tests

### Build Commands

```bash
# Standard build
make all

# Build and run tests
make test

# Debug build with symbols
make debug

# Static binary (Linux/BSD)
make static

# Clean build artifacts
make clean

# Check dependencies
make check-deps
```

## Installation

```bash
# Install to /usr/local/bin (requires root)
sudo make install

# Uninstall
sudo make uninstall
```

## Usage

### Starting the Server

```bash
# Run on default port 2525 (no root required)
./ccsmtp

# Run on custom port
./ccsmtp -p 8025

# Run with verbose logging
./ccsmtp -v

# Run on standard SMTP port (requires root)
sudo ./ccsmtp -p 25

# Show help
./ccsmtp -h
```

### Command Line Options

- `-p <port>` - Port to listen on (default: 2525)
- `-v` - Enable verbose mode for detailed logging
- `-h` - Display help message

### Testing the Server

The project includes a test client and comprehensive test suite:

```bash
# Run full test suite
make test

# Manual test with included client
./test_client [host] [port]

# Test with telnet
telnet localhost 2525

# Test with netcat
nc localhost 2525
```

## SMTP Session Example

Here's an example SMTP session:

```
S: 220 CC SMTP Server
C: HELO client.example.com
S: 250 Hello, pleased to meet you
C: MAIL FROM:<sender@example.com>
S: 250 OK
C: RCPT TO:<recipient@example.com>
S: 250 OK
C: DATA
S: 354 End data with <CR><LF>.<CR><LF>
C: Subject: Test Email
C: From: sender@example.com
C: To: recipient@example.com
C:
C: This is a test email.
C: .
S: 250 OK: message queued
C: QUIT
S: 221 Bye
```

## Email Storage

Received emails are saved to the `./mail/` directory with filenames in the format:

```
mail_<timestamp>.eml
```

Each email file contains:
- From header
- To header(s)
- Received header with client information
- Date header
- Email body

Example email file:
```
From: sender@example.com
To: recipient@example.com
Received: from client.example.com
Date: Mon Nov 17 12:34:56 2025

Subject: Test Email
From: sender@example.com
To: recipient@example.com

This is a test email.
```

## Architecture

### Server Design

The server uses a **multi-process architecture** with fork():

1. Main process listens for incoming connections
2. For each connection, forks a child process
3. Child process handles the SMTP session independently
4. SIGCHLD handler reaps zombie processes

### SMTP State Machine

The server maintains a state machine for each session:

- `STATE_INITIAL` - Connection established, waiting for HELO/EHLO
- `STATE_GREETED` - HELO/EHLO received, ready for MAIL FROM
- `STATE_MAIL` - MAIL FROM received, ready for RCPT TO
- `STATE_RCPT` - RCPT TO received, ready for DATA or more recipients
- `STATE_DATA` - Receiving email body

### Security Considerations

**Note**: This is a basic implementation for learning purposes. Production SMTP servers require:

- Authentication (SMTP AUTH)
- Encryption (STARTTLS)
- Spam filtering
- Rate limiting
- Proper DNS checks (SPF, DKIM, DMARC)
- Relay restrictions

## Testing

The test suite (`test.sh`) validates:

1. Basic TCP connection
2. 220 greeting message
3. HELO command handling
4. EHLO command handling
5. Complete email transaction
6. Email file creation
7. Multiple recipients
8. RSET command
9. Concurrent connections
10. Invalid command sequence handling

Run tests with:
```bash
make test
```

## Platform Support

### Linux
- Full support
- Tested on Ubuntu, Debian, CentOS, Fedora, Arch

### macOS
- Full support
- Darwin-specific compatibility

### BSD
- Full support
- Tested on FreeBSD, OpenBSD, NetBSD

## Troubleshooting

### Port 25 Permission Denied

Port 25 requires root privileges. Either:
- Run with sudo: `sudo ./ccsmtp -p 25`
- Use a higher port: `./ccsmtp -p 2525`

### Address Already in Use

Another process is using the port. Either:
- Stop the other process
- Choose a different port with `-p`

### Connection Refused

Ensure the server is running:
```bash
# Check if server is listening
netstat -an | grep 2525

# Or with lsof
lsof -i :2525
```

## References

- [RFC 5321 - Simple Mail Transfer Protocol](https://tools.ietf.org/html/rfc5321)
- [RFC 5322 - Internet Message Format](https://tools.ietf.org/html/rfc5322)
- [CodingChallenges.fyi - SMTP Challenge](https://codingchallenges.fyi/challenges/challenge-smtp)
- [Wikipedia - SMTP](https://en.wikipedia.org/wiki/Simple_Mail_Transfer_Protocol)

## License

This project is for educational purposes as part of the CodingChallenges.fyi challenge series.

## Author

Built as part of the 94 coding challenges from [CodingChallenges.fyi](https://codingchallenges.fyi/).
