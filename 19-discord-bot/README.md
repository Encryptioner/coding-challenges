# Discord Bot - Coding Challenges Helper

A friendly Discord bot that helps users discover coding challenges, provides inspirational quotes, and manages a catalog of programming challenges from [CodingChallenges.fyi](https://codingchallenges.fyi).

## Features

### Core Functionality
- ✅ **Personalized Greetings** - Responds to hello/hi with user's name
- ✅ **Random Quotes** - Fetches inspirational quotes from dummyjson.com
- ✅ **Challenge Suggestions** - Provides random coding challenges from catalog
- ✅ **Challenge Management** - Add new challenges and list all available ones
- ✅ **URL Validation** - Ensures only valid codingchallenges.fyi URLs are added
- ✅ **Rich Embeds** - Beautiful Discord embeds for all responses
- ✅ **Persistent Storage** - Challenges saved to JSON file

### Bot Commands

| Command | Description | Example |
|---------|-------------|---------|
| `!quote` | Get a random inspirational quote | `!quote` |
| `!challenge` | Get a random coding challenge | `!challenge` |
| `!list` | List all available challenges | `!list` |
| `!add <url>` | Add a new challenge | `!add https://codingchallenges.fyi/challenges/challenge-wc` |
| `!stats` | Show bot statistics | `!stats` |
| `!ping` | Check bot latency | `!ping` |
| `!about` | Learn about the bot | `!about` |
| `!help` | Show all commands | `!help` |

## Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- A Discord account
- A Discord server where you have admin permissions

### Step 1: Clone the Repository

```bash
cd 92-discord-bot
```

### Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

Or install manually:
```bash
pip install discord.py aiohttp beautifulsoup4
```

### Step 3: Create Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Give it a name (e.g., "Coding Challenges Bot")
4. Go to "Bot" section
5. Click "Add Bot"
6. Under "Privileged Gateway Intents":
   - Enable "Message Content Intent"
   - Enable "Server Members Intent"
7. Click "Reset Token" and copy your bot token

### Step 4: Configure Bot Permissions

1. Go to "OAuth2" → "URL Generator"
2. Select scopes:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Select bot permissions:
   - ✅ Send Messages
   - ✅ Send Messages in Threads
   - ✅ Embed Links
   - ✅ Read Message History
   - ✅ Add Reactions
   - ✅ Use Slash Commands
4. Copy the generated URL and open it in your browser
5. Select your server and authorize the bot

### Step 5: Set Up Environment

Create a `.env` file (or set environment variable):

```bash
# Option 1: Using .env file
cp .env.example .env
# Edit .env and add your token

# Option 2: Using environment variable
export DISCORD_BOT_TOKEN='your_bot_token_here'
```

### Step 6: Initialize Challenges Database

```bash
# Copy the example challenges file
cp challenges.json.example challenges.json
```

### Step 7: Run the Bot

```bash
python discord_bot.py
```

You should see:
```
Starting bot...
[Bot Name] has connected to Discord!
Bot is in 1 guilds
```

## Usage Examples

### Greeting the Bot

```
User: Hello
Bot: Hello @User! 👋 How can I help you today?
```

### Getting a Quote

```
User: !quote
Bot: [Embed with quote]
     "The only way to do great work is to love what you do."
     — Steve Jobs
```

### Getting a Challenge

```
User: !challenge
Bot: [Embed]
     🎯 Random Coding Challenge
     Build Your Own JSON Parser
     Link: https://codingchallenges.fyi/challenges/challenge-json-parser
```

### Listing Challenges

```
User: !list
Bot: [Embed]
     📚 Coding Challenges Catalog
     Total: 10 challenges

     1. Build Your Own wc Tool
        Link
     2. Build Your Own JSON Parser
        Link
     ...
```

### Adding a Challenge

```
User: !add https://codingchallenges.fyi/challenges/challenge-discord
Bot: [Embed]
     ✅ Challenge Added!
     Build Your Own Discord Bot
     URL: https://codingchallenges.fyi/challenges/challenge-discord
```

Invalid URL:
```
User: !add https://example.com/challenge
Bot: ❌ Invalid URL. Only challenges from codingchallenges.fyi are allowed!
```

## Project Structure

```
92-discord-bot/
├── discord_bot.py           # Main bot implementation
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variable template
├── .gitignore              # Git ignore rules
├── challenges.json.example # Sample challenges database
├── challenges.json         # Active challenges database (created on first run)
├── README.md               # This file
├── challenge.md            # Challenge specification
├── docs/                   # Tutorial documentation
│   ├── implementation.md   # Implementation guide
│   ├── examples.md         # Usage examples
│   └── deployment.md       # Deployment guide
└── static/                 # Static assets for GitHub Pages
    └── screenshots/        # Bot screenshots
```

## Implementation Details

### Message Content Intent

The bot requires the "Message Content Intent" to read message content for greeting detection. This must be enabled in the Discord Developer Portal under Bot → Privileged Gateway Intents.

### Commands System

The bot uses `discord.ext.commands` for a clean command structure. Each command is implemented as a decorated async function:

```python
@bot.command(name='quote', help='Get a random inspirational quote')
async def quote(ctx):
    # Implementation
```

### API Integration

**Quotes API** (dummyjson.com):
```python
async with aiohttp.ClientSession() as session:
    async with session.get('https://dummyjson.com/quotes/random') as response:
        quote_data = await response.json()
```

**Challenge Title Fetching** (Beautiful Soup):
```python
html = await response.text()
soup = BeautifulSoup(html, 'html.parser')
title = soup.find('title').get_text().strip()
```

### Data Persistence

Challenges are stored in `challenges.json`:
```json
{
  "challenges": [
    {
      "title": "Build Your Own wc Tool",
      "url": "https://codingchallenges.fyi/challenges/challenge-wc",
      "added_at": "2024-01-01T00:00:00"
    }
  ]
}
```

### Error Handling

The bot includes comprehensive error handling:
- Missing required arguments
- Invalid URLs
- API failures
- Network timeouts
- File I/O errors

## Deployment

### Running as a Service (Linux)

Create a systemd service file `/etc/systemd/system/discord-bot.service`:

```ini
[Unit]
Description=Discord Coding Challenges Bot
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/92-discord-bot
Environment="DISCORD_BOT_TOKEN=your_token"
ExecStart=/usr/bin/python3 /path/to/92-discord-bot/discord_bot.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable discord-bot
sudo systemctl start discord-bot
sudo systemctl status discord-bot
```

### AWS EC2 Deployment

See [docs/deployment.md](docs/deployment.md) for detailed AWS deployment instructions.

### Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "discord_bot.py"]
```

Build and run:
```bash
docker build -t discord-bot .
docker run -e DISCORD_BOT_TOKEN='your_token' discord-bot
```

## Troubleshooting

### Bot Not Responding

1. **Check Message Content Intent**: Ensure it's enabled in Developer Portal
2. **Verify Token**: Make sure `DISCORD_BOT_TOKEN` is set correctly
3. **Check Permissions**: Bot needs "Send Messages" permission
4. **Check Logs**: Look for error messages in console output

### Command Not Found

- Use the correct prefix: `!command` (not `/command`)
- Type `!help` to see all available commands

### Quote/Challenge Not Loading

- Check internet connection
- APIs may be temporarily down
- Check console for error messages

### Can't Add Challenge

- URL must be from `codingchallenges.fyi`
- URL must be valid and accessible
- Challenge may already exist in catalog

## Development

### Adding New Commands

```python
@bot.command(name='mycommand', help='Description')
async def mycommand(ctx, arg: str):
    """Command implementation"""
    await ctx.send(f"You said: {arg}")
```

### Testing

```python
# Test locally by running the bot
python discord_bot.py

# In Discord, try commands:
!ping
!quote
!challenge
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Security Notes

- **Never commit your bot token** to version control
- Use environment variables for sensitive data
- Keep dependencies updated
- Follow Discord's [Terms of Service](https://discord.com/terms)
- Respect rate limits

## Rate Limits

Discord enforces rate limits:
- **Global**: 50 requests per second
- **Per-channel**: 5 messages per 5 seconds
- **Per-guild**: 10,000 requests per 10 minutes

The bot includes automatic rate limit handling via discord.py.

## Resources

- [Discord.py Documentation](https://discordpy.readthedocs.io/)
- [Discord Developer Portal](https://discord.com/developers/docs)
- [Discord Bot Best Practices](https://discord.com/developers/docs/topics/best-practices)
- [CodingChallenges.fyi](https://codingchallenges.fyi)
- [DummyJSON API](https://dummyjson.com)

## License

This is an educational project created as part of the [CodingChallenges.fyi](https://codingchallenges.fyi/challenges/challenge-discord) challenge series.

## Support

- Join the [Coding Challenges Discord Server](https://discord.gg/codingchallenges)
- Report issues on GitHub
- Check the [documentation](docs/)

## Changelog

### Version 1.0.0
- ✅ Initial release
- ✅ All 5 challenge steps implemented
- ✅ Comprehensive documentation
- ✅ Deployment guides

---

Built with ❤️ as part of [CodingChallenges.fyi](https://codingchallenges.fyi)
