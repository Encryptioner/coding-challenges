package main

import (
	"bufio"
	"crypto/tls"
	"flag"
	"fmt"
	"log"
	"net"
	"os"
	"strings"
)

// IRCClient represents an IRC client connection
type IRCClient struct {
	server      string
	port        int
	useTLS      bool
	nick        string
	username    string
	realname    string
	password    string
	channels    []string
	conn        net.Conn
	connected   bool
	reader      *bufio.Reader
	writer      *bufio.Writer
}

// Message represents an IRC protocol message
type Message struct {
	Prefix     string
	Command    string
	Parameters []string
	Trailing   string
	Raw        string
}

// NewClient creates a new IRC client
func NewClient(server, nick string, port int, useTLS bool) *IRCClient {
	return &IRCClient{
		server:    server,
		port:      port,
		useTLS:    useTLS,
		nick:      nick,
		username:  nick,
		realname:  "IRC Client",
		channels:  []string{},
		connected: false,
	}
}

// Connect establishes connection to IRC server
func (c *IRCClient) Connect() error {
	address := fmt.Sprintf("%s:%d", c.server, c.port)

	var conn net.Conn
	var err error

	if c.useTLS {
		log.Printf("Connecting to %s with TLS...", address)
		conn, err = tls.Dial("tcp", address, &tls.Config{
			InsecureSkipVerify: true,
		})
	} else {
		log.Printf("Connecting to %s...", address)
		conn, err = net.Dial("tcp", address)
	}

	if err != nil {
		return fmt.Errorf("failed to connect: %w", err)
	}

	c.conn = conn
	c.reader = bufio.NewReader(conn)
	c.writer = bufio.NewWriter(conn)
	c.connected = true

	log.Println("✅ Connected!")

	// Send registration
	if c.password != "" {
		c.send("PASS " + c.password)
	}
	c.send(fmt.Sprintf("NICK %s", c.nick))
	c.send(fmt.Sprintf("USER %s 0 * :%s", c.username, c.realname))

	return nil
}

// send writes a message to the server
func (c *IRCClient) send(msg string) error {
	if !c.connected {
		return fmt.Errorf("not connected")
	}
	log.Printf("[SEND] %s", msg)
	_, err := c.writer.WriteString(msg + "\r\n")
	if err != nil {
		return err
	}
	return c.writer.Flush()
}

// Join joins a channel
func (c *IRCClient) Join(channel string) error {
	if !strings.HasPrefix(channel, "#") {
		channel = "#" + channel
	}
	return c.send(fmt.Sprintf("JOIN %s", channel))
}

// Part leaves a channel
func (c *IRCClient) Part(channel string, message string) error {
	if !strings.HasPrefix(channel, "#") {
		channel = "#" + channel
	}
	if message != "" {
		return c.send(fmt.Sprintf("PART %s :%s", channel, message))
	}
	return c.send(fmt.Sprintf("PART %s", channel))
}

// Message sends a message to a channel or user
func (c *IRCClient) Message(target, text string) error {
	return c.send(fmt.Sprintf("PRIVMSG %s :%s", target, text))
}

// Quit disconnects from the server
func (c *IRCClient) Quit(message string) error {
	if message == "" {
		message = "Client quit"
	}
	err := c.send(fmt.Sprintf("QUIT :%s", message))
	c.connected = false
	c.conn.Close()
	return err
}

// Run starts the main message loop
func (c *IRCClient) Run() error {
	if !c.connected {
		return fmt.Errorf("not connected")
	}

	log.Println("Starting message loop...")

	for {
		line, err := c.reader.ReadString('\n')
		if err != nil {
			log.Printf("Connection error: %v", err)
			c.connected = false
			return err
		}

		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		msg := c.parseMessage(line)
		c.handleMessage(msg)
	}
}

// parseMessage parses an IRC protocol message
func (c *IRCClient) parseMessage(line string) Message {
	msg := Message{Raw: line}

	// Check for prefix
	if strings.HasPrefix(line, ":") {
		parts := strings.SplitN(line, " ", 2)
		msg.Prefix = parts[0][1:]
		line = parts[1]
	}

	// Split command and parameters
	parts := strings.SplitN(line, " :", 2)
	if len(parts) > 1 {
		msg.Trailing = parts[1]
	}

	fields := strings.Fields(parts[0])
	if len(fields) > 0 {
		msg.Command = fields[0]
		msg.Parameters = fields[1:]
	}

	return msg
}

// handleMessage processes incoming messages
func (c *IRCClient) handleMessage(msg Message) {
	log.Printf("[RECV] %s", msg.Raw)

	switch msg.Command {
	case "PING":
		// Respond to PING with PONG
		c.send("PONG " + msg.Trailing)

	case "001", "002", "003", "004":
		// Welcome messages
		log.Printf("✅ Server welcome: %s", msg.Trailing)

	case "376", "422":
		// End of MOTD - we're registered!
		log.Println("✅ Registration complete!")
		// Join auto-join channels
		for _, ch := range c.channels {
			log.Printf("Joining %s...", ch)
			c.Join(ch)
		}

	case "JOIN":
		nick := c.getNick(msg.Prefix)
		channel := msg.Trailing
		if channel == "" && len(msg.Parameters) > 0 {
			channel = msg.Parameters[0]
		}
		if nick == c.nick {
			log.Printf("✅ Joined %s", channel)
		} else {
			log.Printf("👤 %s has joined %s", nick, channel)
		}

	case "PART":
		nick := c.getNick(msg.Prefix)
		if len(msg.Parameters) > 0 {
			log.Printf("👤 %s has left %s", nick, msg.Parameters[0])
		}

	case "PRIVMSG":
		nick := c.getNick(msg.Prefix)
		target := msg.Parameters[0]
		text := msg.Trailing

		// Check if it's a channel message or private message
		if strings.HasPrefix(target, "#") {
			log.Printf("[📨 %s] <%s> %s", target, nick, text)
		} else {
			log.Printf("[📩 %s] %s", nick, text)
		}

		// Handle CTCP ACTION
		if strings.HasPrefix(text, "\x01ACTION ") && strings.HasSuffix(text, "\x01") {
			action := strings.TrimSuffix(strings.TrimPrefix(text, "\x01ACTION "), "\x01")
			if strings.HasPrefix(target, "#") {
				log.Printf("[⭐ %s] * %s %s", target, nick, action)
			} else {
				log.Printf("[⭐ %s] * %s %s", nick, nick, action)
			}
		}

	case "NOTICE":
		nick := c.getNick(msg.Prefix)
		log.Printf("[📢 %s] %s", nick, msg.Trailing)

	case "433":
		// Nickname in use
		log.Printf("❌ Nickname %s is already in use!", c.nick)

	case "473", "474", "475":
		// Cannot join channel
		log.Printf("❌ Cannot join %s: %s", msg.Parameters[1], msg.Trailing)

	case "KICK":
		channel := msg.Parameters[0]
		kickedNick := msg.Parameters[1]
		kicker := c.getNick(msg.Prefix)
		if kickedNick == c.nick {
			log.Printf("⚠️  You were kicked from %s by %s: %s", channel, kicker, msg.Trailing)
		} else {
			log.Printf("👤 %s was kicked from %s by %s: %s", kickedNick, channel, kicker, msg.Trailing)
		}

	case "MODE":
		target := msg.Parameters[0]
		if len(msg.Parameters) > 2 {
			mode := msg.Parameters[1]
			nick := c.getNick(msg.Prefix)
			if strings.HasPrefix(target, "#") {
				log.Printf("[⚙️  %s] %s sets mode %s %s", target, nick, mode, msg.Parameters[2])
			}
		}
	}
}

// getNick extracts nickname from prefix (nick!user@host)
func (c *IRCClient) getNick(prefix string) string {
	if idx := strings.Index(prefix, "!"); idx > 0 {
		return prefix[:idx]
	}
	return prefix
}

// InteractiveMode runs the client in interactive mode
func (c *IRCClient) InteractiveMode() {
	// Start message loop in background
	go c.Run()

	log.Println("\n=== IRC Client Interactive Mode ===")
	log.Println("Commands: /join #channel, /part #channel, /msg user text, /quit")
	log.Println("         Or just type to send to current channel")
	log.Println("==========================================\n")

	// Read commands from stdin
	scanner := bufio.NewScanner(os.Stdin)
	currentChannel := ""

	for scanner.Scan() {
		input := scanner.Text()

		if input == "" {
			continue
		}

		if strings.HasPrefix(input, "/") {
			// Command
			parts := strings.Fields(input)
			cmd := parts[0]

			switch cmd {
			case "/join":
				if len(parts) > 1 {
					c.Join(parts[1])
					currentChannel = parts[1]
				} else {
					log.Println("Usage: /join #channel")
				}

			case "/part":
				if len(parts) > 1 {
					c.Part(parts[1], "")
				} else if currentChannel != "" {
					c.Part(currentChannel, "")
					currentChannel = ""
				} else {
					log.Println("Usage: /part #channel")
				}

			case "/msg":
				if len(parts) > 2 {
					target := parts[1]
					text := strings.Join(parts[2:], " ")
					c.Message(target, text)
				} else {
					log.Println("Usage: /msg user/channel message")
				}

			case "/quit":
				msg := strings.Join(parts[1:], " ")
				c.Quit(msg)
				return

			case "/nick":
				if len(parts) > 1 {
					c.send("NICK " + parts[1])
					c.nick = parts[1]
				}

			case "/help":
				log.Println("Available commands:")
				log.Println("  /join #channel  - Join a channel")
				log.Println("  /part #channel  - Leave a channel")
				log.Println("  /msg target msg - Send message")
				log.Println("  /nick newnick   - Change nickname")
				log.Println("  /quit [msg]     - Quit")

			default:
				log.Printf("Unknown command: %s", cmd)
			}
		} else {
			// Message to current channel
			if currentChannel != "" {
				c.Message(currentChannel, input)
			} else {
				log.Println("Join a channel first with /join #channel")
			}
		}
	}

	if err := scanner.Err(); err != nil {
		log.Printf("Input error: %v", err)
	}
}

func main() {
	server := flag.String("server", "irc.libera.chat", "IRC server address")
	port := flag.Int("port", 6697, "Server port")
	nick := flag.String("nick", "", "Your nickname (required)")
	tls := flag.Bool("tls", true, "Use TLS")
	password := flag.String("password", "", "Server password")
	channels := flag.String("channels", "", "Comma-separated channels to join")
	username := flag.String("username", "", "Username (defaults to nick)")
	realname := flag.String("realname", "", "Real name (defaults to nick)")

	flag.Parse()

	if *nick == "" {
		log.Fatal("Error: --nick is required")
	}

	// Parse channels
	var channelList []string
	if *channels != "" {
		channelList = strings.Split(*channels, ",")
		for i := range channelList {
			channelList[i] = strings.TrimSpace(channelList[i])
			if !strings.HasPrefix(channelList[i], "#") {
				channelList[i] = "#" + channelList[i]
			}
		}
	}

	client := NewClient(*server, *nick, *port, *tls)
	client.password = *password
	client.channels = channelList

	if *username != "" {
		client.username = *username
	}
	if *realname != "" {
		client.realname = *realname
	}

	if err := client.Connect(); err != nil {
		log.Fatalf("Connection failed: %v", err)
	}

	// Run in interactive mode
	client.InteractiveMode()
}
