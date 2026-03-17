# IRC Client

This challenge is to build an IRC (Internet Relay Chat) client that connects to IRC servers, joins channels, and sends/receives messages in real-time.

## Background

IRC (Internet Relay Chat) is a text-based chat protocol created in 1988 by Jarkko Oikarinen. It predates the World Wide Web and remains one of the oldest chat protocols still in use today. IRC was originally developed to replace a Finnish chat program called MUT (MultiUser Talk).

IRC operates on a client-server model where:
- **Clients** connect to IRC servers and join channels (rooms prefixed with #)
- **Servers** relay messages between clients and form networks
- **Networks** consist of multiple interconnected servers

Popular IRC networks include:
- **Libera.Chat** - The network formed after the Freenode migration
- **EFnet** - One of the oldest IRC networks
- **IRCnet** - European IRC network
- **OFTC** - Open and Free Technology Community

## The Challenge - Building An IRC Client

In this coding challenge, we're going to build a functional IRC client that can connect to servers, participate in channels, and handle real-time messaging.

## Step Zero

Set up your development environment. Choose a language with:
- TCP socket networking
- Asynchronous I/O or threading
- Text parsing and protocol handling
- Terminal UI capabilities (optional but recommended)

**Recommended Languages**:
- **Go**: Excellent concurrency, clean socket API, good for network protocols
- **Python**: Simple socket API, async support, great for learning
- **Node.js**: Built-in net modules, event-driven architecture
- **Rust**: Safety, performance, growing async ecosystem

For this challenge, we'll use **Go** for its excellent net package and goroutines.

## Step 1

In this step, your goal is to connect to an IRC server.

Your client should:
1. Establish TCP connection to IRC server (default port 6667)
2. Handle connection errors and retries
3. Send initial registration commands (NICK, USER)
4. Handle server welcome messages (001, 002, 003, etc.)

Test it with:
```bash
# Start your IRC client
./irc-client --server irc.libera.chat --port 6667 --nick MyNick

# Should connect and receive welcome messages
# :irc.libera.chat 001 MyNick :Welcome to the Libera.Chat Internet Relay Chat Network MyNick
```

IRC Registration Protocol:
```
PASS password        # Optional (if server requires password)
NICK nickname        # Your nickname
USER username mode :realname
```

**Key Concepts**:
- TCP socket connections
- IRC protocol basics (RFC 1459, RFC 2812)
- Message format: `PREFIX COMMAND PARAMETERS :TRAILING`
- Numeric reply codes (001-399 for success, 400-599 for errors)

## Step 2

In this step, your goal is to parse IRC messages from the server.

Your client should:
1. Read data from the TCP connection
2. Parse IRC message format (prefix, command, parameters)
3. Handle different message types (numeric replies, PRIVMSG, JOIN, PART, etc.)
4. Extract relevant information (sender, channel, message content)

Example messages to parse:
```
:server.name 001 Nickname :Welcome message
:username!user@host PRIVMSG #channel :Hello world!
:username!user@host JOIN #channel
:server.name PING :1234567
```

Data structure:
```go
type Message struct {
    Prefix     string    // :sender!user@host or :server.name
    Command    string    // PRIVMSG, JOIN, 001, etc.
    Parameters []string  // Command parameters
    Trailing   string    // Last parameter (can contain spaces)
    Raw        string    // Original raw message
}

// Parse from: ":nick!user@host PRIVMSG #chan :Hello!"
// Into: Prefix=":nick!user@host", Command="PRIVMSG", Parameters=["#chan"], Trailing="Hello!"
```

**Key Concepts**:
- IRC message format (RFC 1459 section 2.3)
- Text parsing and splitting
- Prefix parsing (nick!user@host format)
- CTCP (Client-to-Client Protocol) handling
- Message encoding (UTF-8, IRC colors)

## Step 3

In this step, your goal is to join channels and receive messages.

Your client should:
1. Send JOIN command to enter channels
2. Receive and display channel messages
3. Track channel users list
4. Handle user joins and parts

Join a channel:
```bash
# Auto-join channels on connect
./irc-client --server irc.libera.chat --nick MyNick --channels #general,#random

# Or manually join after connecting
/join #general
```

IRC Commands:
```
JOIN #channel      # Join a channel
PART #channel      # Leave a channel
LIST               # List all channels
NAMES #channel     # List users in channel
WHOIS nickname     # Get user info
```

**Key Concepts**:
- IRC commands and replies
- Channel modes (+o for ops, +v for voice)
- User presence tracking
- Channel topic display
- Message routing (direct vs channel)

## Step 4

In this step, your goal is to send messages to channels and users.

Your client should:
1. Send PRIVMSG to channels
2. Send private messages to users
3. Handle outgoing message formatting
4. Display sent messages in UI

Send messages:
```bash
# Send to channel
PRIVMSG #channel :Hello everyone!

# Send private message
PRIVMSG nickname :Hello, this is a private message

# Send action (CTCP ACTION)
PRIVMSG #channel :ACTION waves hello
```

Message types to implement:
- **Channel messages**: `PRIVMSG #channel :message`
- **Private messages**: `PRIVMSG nickname :message`
- **Notices**: `NOTICE #channel/nickname :message`
- **Actions**: `PRIVMSG target :ACTION does something`

**Key Concepts**:
- Message rate limiting (avoid flood kicks)
- CTCP commands (ACTION, VERSION, PING)
- Target validation (channels start with #)
- Message encoding and special characters

## Step 5

In this step, your goal is to implement a terminal user interface.

Your client should:
1. Display incoming messages in scrollable view
2. Accept user input for commands and messages
3. Handle IRC commands (/join, /part, /msg, etc.)
4. Show user list for current channel

Terminal UI Layout:
```
┌────────────────────────────────────────────────────────────────┐
│ [#general] IRC Client - Connected to irc.libera.chat           │
├────────────────────────────────────────────────────────────────┤
│ [10:30] <alice> Hello everyone!                                │
│ [10:31] <bob> Hi alice!                                        │
│ [10:32] *** carol has joined #general                          │
│ [10:33] <YourNick> Welcome carol!                              │
│ [10:34] <carol> Thanks!                                         │
│                                                                  │
│              ↑ (scrollable message area)                        │
│                                                                  │
├────────────────────────────────────────────────────────────────┤
│ [YourNick]> _                                                   │
└────────────────────────────────────────────────────────────────┘
                  ↑ (input area)
```

Recommended UI Libraries:
- **Go**: `bubbletea`, `tcell`, `termui`
- **Python**: `urwid`, `curses`, `rich`
- **Node.js**: `blessed`, `terminal-kit`

**Key Concepts**:
- Terminal drawing and cursor positioning
- Handling special keys (arrow keys, Ctrl+C, etc.)
- Input line editing and history
- Concurrent message display and input handling
- Window splitting (messages area vs input area)

## Step 6

In this step, your goal is to handle IRC features and events.

Your client should handle:
- **Pings**: Respond to server PING with PONG to prevent timeout
- **Nick changes**: NICK command when users change nicknames
- **User modes**: MODE commands (+o, +v, etc.)
- **Channel modes**: Channel mode changes
- **Topic changes**: Topic commands
- **Kicks/bans**: KICK, MODE +b commands

Event handlers:
```go
// Handle PING
if msg.Command == "PING" {
    send("PONG " + msg.Trailing)
}

// Handle user join
if msg.Command == "JOIN" {
    addUserToChannel(msg.Prefix, msg.Trailing)
    displayMessage("*** " + nick + " has joined " + channel)
}

// Handle user part
if msg.Command == "PART" {
    removeUserFromChannel(msg.Prefix, msg.Trailing)
    displayMessage("*** " + nick + " has left " + channel)
}
```

**Key Concepts**:
- IRC event model
- Nickname collision handling (433 numeric)
- Automatic nick renaming ( appending _ )
- Channel operator privileges
- IRC numeric replies for events

## Step 7

In this step, your goal is to add advanced features.

Your client should support:
- **Nick registration**: NickServ and IDENTIFY
- **Multiple channels**: Switch between channels
- **Private messaging**: Separate windows for PMs
- **File transfers**: DCC (Direct Client-to-Client) protocol
- **Logging**: Save chat history to files
- **Auto-reconnect**: Handle connection drops

NickServ authentication:
```
PRIVMSG NickServ :IDENTIFY password
# Response: :NickServ!NickServ@services.libera.chat NOTICE YourNick :You are now identified
```

Multiple channel tabs:
```
┌────────────────────────────────────────────────────────────────┐
│ [#general]  [#random]  [@private]                              │
│   ┌──────────────────────────────────────────────────────────┐ │
│   │ Active channel messages                                  │ │
│   └──────────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────┤
│ [#general]> _                                                  │
└────────────────────────────────────────────────────────────────┘
```

**Key Concepts**:
- NickServ and SASL authentication
- Channel switching and state management
- DCC SEND/RESUME protocol
- Chat logging and history
- Connection state management
- Reconnection strategies

## Step 8

In this step, your goal is to add security and robustness.

Your client should:
1. Support TLS/SSL connections (port 6697)
2. Validate server certificates
3. Handle connection failures gracefully
4. Implement rate limiting to avoid being kicked
5. Sanitize input to prevent injection attacks

TLS connection:
```bash
# Connect with TLS
./irc-client --server irc.libera.chat --port 6697 --tls --nick MyNick

# Or with specific certificate
./irc-client --server irc.libera.chat --port 6697 --tls --cert /path/to/cert.pem
```

Rate limiting:
```go
// Implement message rate limiting
const maxMessagesPerSecond = 4
const messageBucketSize = 20

// Token bucket algorithm
if tokenBucket.Take(1) {
    sendMessage(msg)
} else {
    queueMessage(msg)  // Queue for later
}
```

**Key Concepts**:
- TLS/SSL protocol and certificate handling
- SASL PLAIN authentication
- Flood prevention algorithms
- Input sanitization (prevent IRC injection)
- Graceful error handling and recovery
- Connection keep-alive (PONG responses)

## Going Further

There's plenty more you can add:
- **IRCv3 support**: Modern IRC extensions (CAP LS, CAP REQ)
- **Away status**: Handle and set away messages
- **Ignore list**: Filter messages from specific users
- **Highlight notifications**: Alert on mentions of your nickname
- **Sound notifications**: Beep on private messages
- **URL previews**: Show link titles in-line
- **Emoji support**: Display emojis in messages
- **IRC colors**: Parse and display IRC color codes
- **Scripting**: Built-in scripting language for automation
- **Proxy support**: Connect through SOCKS/HTTP proxy
- **Multiple server connections**: Connect to multiple networks

## References

- [RFC 1459 - Internet Relay Chat Protocol](https://tools.ietf.org/html/rfc1459)
- [RFC 2812 - Internet Relay Chat: Client Protocol](https://tools.ietf.org/html/rfc2812)
- [IRCv3 Working Group](https://ircv3.net/)
- [Libera.Chat Documentation](https://libera.chat/guides/documentation)
- [The IRC Handbook](https://modern.ircdocs.horse/)
- [Build Your Own Web Tool - IRC Client](https://codingchallenges.fyi/challenges/challenge-irc-client)
