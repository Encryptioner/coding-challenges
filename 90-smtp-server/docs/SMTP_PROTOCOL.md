# SMTP Protocol Overview

This document provides an overview of the SMTP protocol as implemented in the CC SMTP Server.

## Protocol Basics

SMTP (Simple Mail Transfer Protocol) is a text-based protocol where:
- Commands are sent by the client
- Responses are sent by the server
- Each command/response ends with CRLF (`\r\n`)
- Responses include a 3-digit status code

## Status Codes

### 2xx - Success
- `220` - Service ready
- `221` - Service closing transmission channel
- `250` - Requested mail action okay, completed
- `251` - User not local; will forward
- `252` - Cannot verify user, but will accept message

### 3xx - Intermediate
- `354` - Start mail input; end with <CRLF>.<CRLF>

### 4xx - Transient Errors
- `421` - Service not available
- `450` - Mailbox unavailable
- `451` - Action aborted: local error
- `452` - Insufficient storage

### 5xx - Permanent Errors
- `500` - Syntax error, command unrecognized
- `501` - Syntax error in parameters
- `502` - Command not implemented
- `503` - Bad sequence of commands
- `504` - Parameter not implemented
- `550` - Mailbox unavailable
- `551` - User not local
- `552` - Storage allocation exceeded
- `553` - Mailbox name not allowed
- `554` - Transaction failed

## Command Reference

### HELO

Identifies the SMTP client to the SMTP server.

**Syntax**: `HELO <domain>`

**Example**:
```
C: HELO client.example.com
S: 250 Hello, pleased to meet you
```

### EHLO

Extended HELO - identifies client and requests extended SMTP features.

**Syntax**: `EHLO <domain>`

**Example**:
```
C: EHLO client.example.com
S: 250-CC SMTP Server
S: 250 SIZE 10240000
```

### MAIL FROM

Specifies the sender's email address.

**Syntax**: `MAIL FROM:<email>`

**Example**:
```
C: MAIL FROM:<sender@example.com>
S: 250 OK
```

**Optional parameters** (not implemented in CC SMTP):
- `SIZE=<bytes>` - Message size declaration
- `BODY=8BITMIME` - 8-bit MIME encoding
- `AUTH=<param>` - Authentication information

### RCPT TO

Specifies a recipient's email address. Can be used multiple times for multiple recipients.

**Syntax**: `RCPT TO:<email>`

**Example**:
```
C: RCPT TO:<recipient1@example.com>
S: 250 OK
C: RCPT TO:<recipient2@example.com>
S: 250 OK
```

### DATA

Begins transmission of the email message body.

**Syntax**: `DATA`

**Example**:
```
C: DATA
S: 354 End data with <CR><LF>.<CR><LF>
C: Subject: Test Email
C: From: sender@example.com
C:
C: This is the message body.
C: .
S: 250 OK: message queued
```

**Important**:
- Message ends with a line containing only a period (`.`)
- If a line in the message starts with a period, it should be doubled (`..`) for transparency
- The server removes the extra period when saving

### QUIT

Closes the SMTP connection.

**Syntax**: `QUIT`

**Example**:
```
C: QUIT
S: 221 Bye
```

### RSET

Resets the current mail transaction, clearing sender and recipient information.

**Syntax**: `RSET`

**Example**:
```
C: RSET
S: 250 OK
```

### NOOP

No operation - server responds with OK.

**Syntax**: `NOOP`

**Example**:
```
C: NOOP
S: 250 OK
```

## Command Sequence

A typical SMTP session follows this sequence:

1. **Connection**: Server sends 220 greeting
2. **Identification**: Client sends HELO or EHLO
3. **Mail Transaction**:
   - Client sends MAIL FROM
   - Client sends one or more RCPT TO
   - Client sends DATA
   - Client sends message body
   - Server queues message
4. **Additional Transactions** (optional): Repeat step 3
5. **Termination**: Client sends QUIT

## State Diagram

```
         +-----+
         |START|
         +-----+
            |
            | (connection established)
            v
      +----------+
      | INITIAL  |
      +----------+
            |
            | HELO/EHLO
            v
      +----------+
      | GREETED  |<---------+
      +----------+          |
            |               |
            | MAIL FROM     | RSET
            v               |
      +----------+          |
      |   MAIL   |----------+
      +----------+
            |
            | RCPT TO
            v
      +----------+
      |   RCPT   |<--+
      +----------+   |
            |        |
            |        | RCPT TO (add more recipients)
            +--------+
            |
            | DATA
            v
      +----------+
      |   DATA   |
      +----------+
            |
            | (message received)
            v
      +----------+
      | GREETED  |
      +----------+
```

## Email Format

The DATA command accepts an email message that should follow RFC 5322 format:

```
Header-Name: Value
Another-Header: Value

Message body starts here.
Can have multiple lines.
```

Common headers:
- `From:` - Sender address
- `To:` - Recipient address(es)
- `Subject:` - Email subject
- `Date:` - Message date
- `Message-ID:` - Unique identifier
- `Content-Type:` - MIME type

## Transparency

According to the SMTP specification, if a line in the message body starts with a period, it must be doubled:

**Client sends**:
```
This is a normal line.
.This line starts with a period.
..This line starts with two periods.
```

**Server stores**:
```
This is a normal line.
.This line starts with a period.
..This line starts with two periods.
```

The CC SMTP Server handles transparency automatically.

## Error Handling

### Invalid Command Sequence

```
C: DATA
S: 503 Send RCPT TO first
```

### Syntax Errors

```
C: MAIL
S: 501 Syntax: MAIL FROM:<address>
```

### Unknown Commands

```
C: HELP
S: 502 Command not implemented
```

## Extensions (EHLO)

The CC SMTP Server advertises these extensions in response to EHLO:

- `SIZE 10240000` - Maximum message size (10MB)

## Security Considerations

The CC SMTP Server is a basic implementation and lacks many security features found in production servers:

**Missing features**:
- No authentication (SMTP AUTH)
- No encryption (STARTTLS)
- No spam filtering
- No relay control
- No rate limiting
- No sender verification

**For production use**, consider implementing:
- TLS/SSL encryption
- SASL authentication
- SPF/DKIM/DMARC checking
- Greylisting
- Connection rate limiting
- Valid recipient checking

## References

- [RFC 5321 - Simple Mail Transfer Protocol](https://tools.ietf.org/html/rfc5321)
- [RFC 5322 - Internet Message Format](https://tools.ietf.org/html/rfc5322)
- [RFC 4954 - SMTP AUTH](https://tools.ietf.org/html/rfc4954)
- [RFC 3207 - STARTTLS](https://tools.ietf.org/html/rfc3207)
