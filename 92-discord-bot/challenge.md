# Challenge #92 - Build Your Own Discord Bot

**Source**: [CodingChallenges.fyi - Discord Bot Challenge](https://codingchallenges.fyi/challenges/challenge-discord)

## Overview

Build a Discord bot that helps users discover coding challenges, provides inspiration, and manages a catalog of programming challenges.

## Background

Discord is an instant messaging and VoIP social platform launched in 2015. It quickly became popular among gaming communities and has since expanded to serve all types of communities, including programming and tech.

**What is a Discord Bot?**

A Discord bot is an automated program that can:
- Respond to messages and commands
- Send messages and embeds
- Manage server members
- Moderate content
- Integrate with external APIs
- Automate repetitive tasks

**Why Build a Bot?**

Building a Discord bot teaches you:
- API integration and authentication
- Event-driven programming
- Async/await patterns
- RESTful API consumption
- Webhook handling
- Real-time messaging

## The Challenge - Building a Discord Bot

Create a bot that can:
1. Greet users with personalized messages
2. Provide random inspirational quotes from an API
3. Suggest random coding challenges from a catalog
4. Allow users to add new challenges with URL validation
5. List all available challenges
6. Deploy to a 24/7 hosting environment

---

## Step 0: Environment Setup

### Create Discord Application

1. **Visit Discord Developer Portal**
   - Go to https://discord.com/developers/applications
   - Click "New Application"
   - Name your application (e.g., "Coding Challenges Bot")

2. **Create Bot User**
   - Go to "Bot" section
   - Click "Add Bot"
   - Customize bot username and avatar

3. **Get Bot Token**
   - Click "Reset Token"
   - **Copy and save securely** (you won't see it again!)
   - ⚠️ Never share or commit your token

4. **Enable Required Intents**
   Under "Privileged Gateway Intents":
   - ✅ Message Content Intent (required to read messages)
   - ✅ Server Members Intent (optional, for member join events)

5. **Set Bot Permissions**
   Go to "Bot" → "Bot Permissions":
   - ✅ Send Messages
   - ✅ Send Messages in Threads
   - ✅ Embed Links
   - ✅ Read Message History
   - ✅ Add Reactions

6. **Generate Invite URL**
   Go to "OAuth2" → "URL Generator":
   - **Scopes**:
     - ✅ `bot`
     - ✅ `applications.commands`
   - **Bot Permissions** (same as above)
   - Copy the generated URL

7. **Invite Bot to Server**
   - Open the generated URL in your browser
   - Select your test server
   - Click "Authorize"

### Set Up Development Environment

```bash
# Create project directory
mkdir discord-bot
cd discord-bot

# Create virtual environment (Python example)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install discord.py aiohttp beautifulsoup4

# Create main file
touch discord_bot.py

# Create environment file
touch .env
echo "DISCORD_BOT_TOKEN=your_token_here" > .env
```

### Choose Your Tech Stack

**Popular Options**:
- **Python**: discord.py (most popular, great docs)
- **JavaScript/TypeScript**: discord.js (Node.js)
- **Go**: discordgo
- **Rust**: serenity
- **Java**: JDA (Java Discord API)

**This guide uses Python with discord.py**

### Acceptance Criteria

- [ ] Discord application created
- [ ] Bot user configured
- [ ] Message Content Intent enabled
- [ ] Bot invited to test server
- [ ] Development environment set up
- [ ] Bot token secured

---

## Step 1: Hello, World!

**Goal**: Make your bot connect and respond to greetings.

### Requirements

1. **Connect to Discord**
   - Use bot token to authenticate
   - Handle connection events
   - Show online status

2. **Respond to Greetings**
   - Listen for messages containing "hello", "hi", or "hey"
   - Respond with personalized greeting
   - Include user's name/mention

### Implementation

**Basic Bot Structure**:
```python
import discord
from discord.ext import commands

# Create bot with intents
intents = discord.Intents.default()
intents.message_content = True  # Required!

bot = commands.Bot(command_prefix='!', intents=intents)

@bot.event
async def on_ready():
    print(f'{bot.user} has connected!')

@bot.event
async def on_message(message):
    # Ignore bot's own messages
    if message.author == bot.user:
        return

    # Respond to greetings
    if 'hello' in message.content.lower():
        await message.channel.send(
            f'Hello {message.author.mention}! 👋'
        )

    # Process commands
    await bot.process_commands(message)

# Run bot
bot.run('YOUR_TOKEN')
```

### Expected Behavior

```
User: Hello
Bot: Hello @User! 👋 How can I help you today?

User: Hi there
Bot: Hello @User! 👋 How can I help you today?
```

### Acceptance Criteria

- [ ] Bot comes online when started
- [ ] Bot responds to "hello", "hi", "hey"
- [ ] Response includes user's mention
- [ ] Bot ignores its own messages
- [ ] Multiple users can interact simultaneously

---

## Step 2: Random Quotes

**Goal**: Fetch and display random inspirational quotes from an API.

### Requirements

1. **Create `!quote` Command**
   - Responds to `!quote` message
   - Fetches quote from dummyjson.com API
   - Displays quote in rich embed

2. **API Integration**
   - Endpoint: https://dummyjson.com/quotes/random
   - Handle API failures gracefully
   - Parse JSON response

### API Response Format

```json
{
  "id": 1,
  "quote": "Life is what happens when you're busy making other plans.",
  "author": "John Lennon"
}
```

### Implementation

```python
import aiohttp

@bot.command(name='quote')
async def quote(ctx):
    """Get a random quote"""
    async with aiohttp.ClientSession() as session:
        async with session.get('https://dummyjson.com/quotes/random') as response:
            data = await response.json()

    # Create rich embed
    embed = discord.Embed(
        description=f'*"{data["quote"]}"*',
        color=discord.Color.blue()
    )
    embed.set_footer(text=f'— {data["author"]}')

    await ctx.send(embed=embed)
```

### Expected Behavior

```
User: !quote
Bot: [Rich Embed]
     "The only way to do great work is to love what you do."
     — Steve Jobs
```

### Acceptance Criteria

- [ ] `!quote` command works
- [ ] Quote fetched from API
- [ ] Quote displayed in rich embed
- [ ] Author attribution included
- [ ] Error handling for API failures
- [ ] Typing indicator shown while fetching

---

## Step 3: Random Challenge

**Goal**: Suggest random coding challenges from a catalog.

### Requirements

1. **Load Challenges Catalog**
   - Download: https://www.dropbox.com/s/example/challenges.json
   - Or create your own JSON file
   - Store locally as `challenges.json`

2. **Create `!challenge` Command**
   - Select random challenge from catalog
   - Display title and URL
   - Use rich embed for formatting

### Catalog Format

```json
{
  "challenges": [
    {
      "title": "Build Your Own wc Tool",
      "url": "https://codingchallenges.fyi/challenges/challenge-wc"
    },
    {
      "title": "Build Your Own JSON Parser",
      "url": "https://codingchallenges.fyi/challenges/challenge-json-parser"
    }
  ]
}
```

### Implementation

```python
import json
import random

def load_challenges():
    with open('challenges.json', 'r') as f:
        data = json.load(f)
    return data['challenges']

@bot.command(name='challenge')
async def challenge(ctx):
    """Get a random challenge"""
    challenges = load_challenges()
    ch = random.choice(challenges)

    embed = discord.Embed(
        title="🎯 Random Coding Challenge",
        description=ch['title'],
        url=ch['url'],
        color=discord.Color.green()
    )

    await ctx.send(embed=embed)
```

### Expected Behavior

```
User: !challenge
Bot: [Rich Embed]
     🎯 Random Coding Challenge
     Build Your Own JSON Parser
     [clickable link]
```

### Acceptance Criteria

- [ ] Challenges loaded from JSON file
- [ ] `!challenge` command works
- [ ] Random challenge selected
- [ ] Title and URL displayed
- [ ] URL is clickable in embed
- [ ] Handle empty catalog gracefully

---

## Step 4: Add and List Challenges

**Goal**: Allow users to manage the challenge catalog.

### Requirements

1. **Create `!add <url>` Command**
   - Accept challenge URL as parameter
   - Validate URL is from codingchallenges.fyi
   - Fetch challenge title from URL
   - Add to catalog if valid
   - Save to JSON file

2. **Create `!list` Command**
   - Display all challenges in catalog
   - Show total count
   - Paginate if many challenges

3. **URL Validation**
   - Check URL format (http/https)
   - Verify domain is codingchallenges.fyi
   - Ensure URL is accessible
   - Prevent duplicates

4. **Title Extraction**
   - Fetch HTML from URL
   - Parse `<title>` tag
   - Clean up title (remove site suffix)

### Implementation

**URL Validation**:
```python
from urllib.parse import urlparse

def is_valid_challenge_url(url):
    parsed = urlparse(url)
    return parsed.netloc in [
        'codingchallenges.fyi',
        'www.codingchallenges.fyi'
    ]
```

**Title Fetching**:
```python
from bs4 import BeautifulSoup

async def fetch_title(url):
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            html = await response.text()

    soup = BeautifulSoup(html, 'html.parser')
    title = soup.find('title').get_text().strip()
    # Clean up title
    title = title.replace(' - Coding Challenges', '')
    return title
```

**Add Command**:
```python
@bot.command(name='add')
async def add(ctx, url: str):
    """Add a challenge to catalog"""
    # Validate URL
    if not is_valid_challenge_url(url):
        await ctx.send('❌ Invalid URL! Only codingchallenges.fyi allowed')
        return

    # Fetch title
    try:
        title = await fetch_title(url)
    except:
        await ctx.send('❌ Could not fetch challenge title')
        return

    # Add to catalog
    challenges = load_challenges()
    challenges.append({'title': title, 'url': url})
    save_challenges(challenges)

    embed = discord.Embed(
        title='✅ Challenge Added!',
        description=title,
        url=url,
        color=discord.Color.green()
    )
    await ctx.send(embed=embed)
```

**List Command**:
```python
@bot.command(name='list')
async def list_challenges(ctx):
    """List all challenges"""
    challenges = load_challenges()

    embed = discord.Embed(
        title='📚 Coding Challenges Catalog',
        description=f'Total: {len(challenges)} challenges',
        color=discord.Color.purple()
    )

    for i, ch in enumerate(challenges[:10], 1):
        embed.add_field(
            name=f'{i}. {ch["title"]}',
            value=f'[Link]({ch["url"]})',
            inline=False
        )

    await ctx.send(embed=embed)
```

### Expected Behavior

**Invalid URL**:
```
User: !add https://example.com/challenge
Bot: ❌ Invalid URL! Only challenges from codingchallenges.fyi are allowed!
```

**Valid URL**:
```
User: !add https://codingchallenges.fyi/challenges/challenge-discord
Bot: [Rich Embed]
     ✅ Challenge Added!
     Build Your Own Discord Bot
     [link]
```

**List**:
```
User: !list
Bot: [Rich Embed]
     📚 Coding Challenges Catalog
     Total: 15 challenges

     1. Build Your Own wc Tool
        [Link]
     2. Build Your Own JSON Parser
        [Link]
     ...
```

### Acceptance Criteria

- [ ] `!add <url>` command works
- [ ] URL validation implemented
- [ ] Only codingchallenges.fyi URLs accepted
- [ ] Challenge title fetched from HTML
- [ ] New challenges saved to JSON
- [ ] Duplicate prevention
- [ ] `!list` command shows all challenges
- [ ] Challenges persist after bot restart

---

## Step 5: Deploy to Production

**Goal**: Host your bot 24/7 on a cloud platform.

### Deployment Options

1. **AWS EC2** (Recommended)
   - Free Tier eligible
   - Full control
   - Can run indefinitely

2. **Heroku**
   - Easy deployment
   - Limited free tier
   - Good for beginners

3. **Railway**
   - Modern platform
   - Simple deployment
   - Free tier available

4. **DigitalOcean**
   - Simple VPS
   - $4/month minimum
   - Easy to manage

5. **Replit** (Development Only)
   - Free tier
   - Not for production
   - May sleep after inactivity

### AWS EC2 Deployment

**Step-by-Step**:

1. **Create EC2 Instance**
   - Log into AWS Console
   - Navigate to EC2
   - Click "Launch Instance"
   - Choose "Ubuntu Server 22.04 LTS"
   - Select "t2.micro" (Free Tier)
   - Configure security group (no inbound rules needed)
   - Create/select key pair
   - Launch instance

2. **Connect to Instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-instance-ip
   ```

3. **Install Dependencies**
   ```bash
   sudo apt update
   sudo apt install python3-pip python3-venv git
   ```

4. **Clone Your Bot**
   ```bash
   git clone your-repo-url
   cd discord-bot
   ```

5. **Set Up Python Environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

6. **Set Environment Variables**
   ```bash
   echo "export DISCORD_BOT_TOKEN='your_token'" >> ~/.bashrc
   source ~/.bashrc
   ```

7. **Create Systemd Service**
   Create `/etc/systemd/system/discord-bot.service`:
   ```ini
   [Unit]
   Description=Discord Bot
   After=network.target

   [Service]
   Type=simple
   User=ubuntu
   WorkingDirectory=/home/ubuntu/discord-bot
   Environment="DISCORD_BOT_TOKEN=your_token"
   ExecStart=/home/ubuntu/discord-bot/venv/bin/python discord_bot.py
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

8. **Enable and Start Service**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable discord-bot
   sudo systemctl start discord-bot
   sudo systemctl status discord-bot
   ```

9. **View Logs**
   ```bash
   sudo journalctl -u discord-bot -f
   ```

### Self-Healing Setup

For automatic recovery from crashes:

1. **Systemd handles restarts** (already configured with `Restart=always`)

2. **Monitor with CloudWatch** (AWS):
   - Set up log streaming
   - Create alarms for failures
   - Auto-restart if needed

3. **Health Check Script**:
   ```python
   # health_check.py
   import discord
   import os

   async def check_bot_status():
       client = discord.Client(intents=discord.Intents.default())
       try:
           await client.login(os.getenv('DISCORD_BOT_TOKEN'))
           await client.close()
           return True
       except:
           return False
   ```

### Docker Deployment

**Dockerfile**:
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "discord_bot.py"]
```

**Deploy**:
```bash
docker build -t discord-bot .
docker run -d \
  -e DISCORD_BOT_TOKEN='your_token' \
  --name discord-bot \
  --restart unless-stopped \
  discord-bot
```

### Acceptance Criteria

- [ ] Bot hosted on cloud platform
- [ ] Runs 24/7 without manual intervention
- [ ] Automatically restarts on crashes
- [ ] Logs accessible for debugging
- [ ] Environment variables secured
- [ ] Updates can be deployed easily

---

## Bonus Challenges

### 1. Slash Commands

Implement modern Discord slash commands:
```python
@bot.tree.command(name="quote", description="Get a random quote")
async def slash_quote(interaction: discord.Interaction):
    await interaction.response.defer()
    # Fetch and send quote
```

### 2. Embeds with Buttons

Add interactive buttons:
```python
class QuoteView(discord.ui.View):
    @discord.ui.button(label="Another Quote", style=discord.ButtonStyle.primary)
    async def another_quote(self, interaction, button):
        # Fetch new quote
```

### 3. Database Instead of JSON

Use SQLite or PostgreSQL:
```python
import sqlite3

conn = sqlite3.connect('bot.db')
cursor = conn.cursor()
cursor.execute('''
    CREATE TABLE IF NOT EXISTS challenges (
        id INTEGER PRIMARY KEY,
        title TEXT,
        url TEXT UNIQUE,
        added_at TIMESTAMP
    )
''')
```

### 4. Admin Commands

Role-based permissions:
```python
@bot.command()
@commands.has_role('Admin')
async def clear_challenges(ctx):
    # Admin-only command
```

### 5. Scheduled Tasks

Daily challenge suggestions:
```python
from discord.ext import tasks

@tasks.loop(hours=24)
async def daily_challenge():
    channel = bot.get_channel(CHANNEL_ID)
    # Send daily challenge
```

### 6. Multi-Server Support

Handle multiple servers:
```python
# Use per-guild catalogs
def get_catalog_file(guild_id):
    return f'challenges_{guild_id}.json'
```

### 7. Webhooks Integration

Connect to GitHub, CI/CD, etc.:
```python
@bot.command()
async def github_webhook(ctx):
    # Set up webhook listener
```

### 8. Natural Language Processing

Advanced message understanding:
```python
# Use NLP to understand intent
if 'challenge' in message and 'easy' in message:
    # Suggest beginner challenges
```

---

## Testing Your Bot

### Manual Tests

- [ ] Bot comes online
- [ ] Responds to greetings
- [ ] `!quote` returns a quote
- [ ] `!challenge` returns a challenge
- [ ] `!list` shows catalog
- [ ] `!add` validates URLs correctly
- [ ] Invalid URLs are rejected
- [ ] Challenges persist after restart
- [ ] Multiple users can interact
- [ ] Handles rate limits gracefully

### Automated Tests

```python
import pytest
from discord_bot import is_valid_challenge_url, load_challenges

def test_url_validation():
    assert is_valid_challenge_url('https://codingchallenges.fyi/challenges/challenge-wc')
    assert not is_valid_challenge_url('https://example.com')

def test_catalog_load():
    challenges = load_challenges()
    assert isinstance(challenges, list)
```

---

## Success Criteria

Your Discord bot is complete when:
- ✅ Bot connects and stays online
- ✅ Greets users personalized
- ✅ Provides random quotes from API
- ✅ Suggests random challenges
- ✅ Validates and adds new challenges
- ✅ Lists all challenges
- ✅ Data persists between restarts
- ✅ Deployed to 24/7 hosting
- ✅ Handles errors gracefully
- ✅ Uses rich embeds for formatting

Congratulations! You've built a production Discord bot! 🎉
