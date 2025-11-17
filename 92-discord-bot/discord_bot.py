#!/usr/bin/env python3
"""
Discord Bot - Coding Challenges Helper Bot

A Discord bot that helps users find coding challenges, provides inspirational quotes,
and manages a catalog of programming challenges.

Features:
- Greet users with personalized messages
- Provide random inspirational quotes
- Suggest random coding challenges
- Add new challenges to the catalog
- List all available challenges
"""

import os
import json
import random
import re
import asyncio
from typing import Optional, List, Dict
from urllib.parse import urlparse

import discord
from discord.ext import commands
import aiohttp
from bs4 import BeautifulSoup


# Bot configuration
INTENTS = discord.Intents.default()
INTENTS.message_content = True  # Required for reading message content
INTENTS.members = True  # Required for member greetings

bot = commands.Bot(command_prefix='!', intents=INTENTS)

# File paths
CHALLENGES_FILE = 'challenges.json'
DEFAULT_CHALLENGES_URL = 'https://www.dropbox.com/s/example/challenges.json'  # Replace with actual URL


# ============================================================================
# Data Management
# ============================================================================

def load_challenges() -> List[Dict]:
    """Load challenges from JSON file"""
    if os.path.exists(CHALLENGES_FILE):
        try:
            with open(CHALLENGES_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('challenges', [])
        except json.JSONDecodeError:
            print(f"Error reading {CHALLENGES_FILE}, using default empty list")
            return []
    return []


def save_challenges(challenges: List[Dict]) -> None:
    """Save challenges to JSON file"""
    with open(CHALLENGES_FILE, 'w', encoding='utf-8') as f:
        json.dump({'challenges': challenges}, f, indent=2, ensure_ascii=False)


def add_challenge(url: str, title: str) -> bool:
    """Add a new challenge to the catalog"""
    challenges = load_challenges()

    # Check if already exists
    if any(c.get('url') == url for c in challenges):
        return False

    challenges.append({
        'url': url,
        'title': title,
        'added_at': discord.utils.utcnow().isoformat()
    })

    save_challenges(challenges)
    return True


# ============================================================================
# API Helpers
# ============================================================================

async def fetch_random_quote() -> Optional[Dict]:
    """Fetch a random quote from dummyjson.com"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get('https://dummyjson.com/quotes/random') as response:
                if response.status == 200:
                    return await response.json()
    except Exception as e:
        print(f"Error fetching quote: {e}")
    return None


async def fetch_challenge_title(url: str) -> Optional[str]:
    """Fetch the title of a challenge from its URL"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')

                    # Try to find the title tag
                    title_tag = soup.find('title')
                    if title_tag:
                        title = title_tag.get_text().strip()
                        # Clean up the title (remove site suffix if present)
                        title = re.sub(r'\s*[-|]\s*Coding Challenges.*$', '', title, flags=re.IGNORECASE)
                        return title

                    # Try to find h1 as fallback
                    h1_tag = soup.find('h1')
                    if h1_tag:
                        return h1_tag.get_text().strip()
    except Exception as e:
        print(f"Error fetching challenge title: {e}")
    return None


def is_valid_challenge_url(url: str) -> bool:
    """Validate if URL is from codingchallenges.fyi"""
    try:
        parsed = urlparse(url)
        return parsed.netloc in ['codingchallenges.fyi', 'www.codingchallenges.fyi']
    except:
        return False


# ============================================================================
# Bot Events
# ============================================================================

@bot.event
async def on_ready():
    """Called when the bot is ready"""
    print(f'{bot.user} has connected to Discord!')
    print(f'Bot is in {len(bot.guilds)} guilds')

    # Set bot status
    await bot.change_presence(
        activity=discord.Activity(
            type=discord.ActivityType.watching,
            name="for !help"
        )
    )


@bot.event
async def on_member_join(member):
    """Welcome new members"""
    # Find a general channel to send welcome message
    for channel in member.guild.text_channels:
        if channel.name in ['general', 'welcome', 'chat']:
            await channel.send(
                f"👋 Welcome to the server, {member.mention}! "
                f"Type !help to see what I can do!"
            )
            break


@bot.event
async def on_message(message):
    """Handle incoming messages"""
    # Ignore messages from the bot itself
    if message.author == bot.user:
        return

    # Process commands first
    await bot.process_commands(message)

    # Handle greetings (Step 1)
    content_lower = message.content.lower()
    if any(greeting in content_lower for greeting in ['hello', 'hi', 'hey']):
        if bot.user.mentioned_in(message) or message.content.startswith(('hello', 'hi', 'hey')):
            await message.channel.send(
                f"Hello {message.author.mention}! 👋 How can I help you today?"
            )


# ============================================================================
# Bot Commands
# ============================================================================

@bot.command(name='quote', help='Get a random inspirational quote')
async def quote(ctx):
    """Provide a random quote from dummyjson.com (Step 2)"""
    async with ctx.typing():  # Show typing indicator
        quote_data = await fetch_random_quote()

        if quote_data:
            embed = discord.Embed(
                description=f"*\"{quote_data['quote']}\"*",
                color=discord.Color.blue()
            )
            embed.set_footer(text=f"— {quote_data['author']}")
            await ctx.send(embed=embed)
        else:
            await ctx.send("❌ Sorry, I couldn't fetch a quote right now. Try again later!")


@bot.command(name='challenge', help='Get a random coding challenge')
async def challenge(ctx):
    """Provide a random coding challenge (Step 3)"""
    challenges = load_challenges()

    if not challenges:
        await ctx.send(
            "❌ No challenges available! Add some with `!add <url>`"
        )
        return

    random_challenge = random.choice(challenges)

    embed = discord.Embed(
        title="🎯 Random Coding Challenge",
        description=random_challenge.get('title', 'Untitled Challenge'),
        url=random_challenge.get('url', ''),
        color=discord.Color.green()
    )
    embed.add_field(
        name="Link",
        value=random_challenge.get('url', 'No URL'),
        inline=False
    )

    await ctx.send(embed=embed)


@bot.command(name='list', help='List all available challenges')
async def list_challenges(ctx):
    """List all challenges in the catalog (Step 4)"""
    challenges = load_challenges()

    if not challenges:
        await ctx.send("📝 No challenges in the catalog yet!")
        return

    # Create paginated embed
    embed = discord.Embed(
        title="📚 Coding Challenges Catalog",
        description=f"Total: {len(challenges)} challenges",
        color=discord.Color.purple()
    )

    # Add up to 10 challenges per page
    for i, ch in enumerate(challenges[:10], 1):
        title = ch.get('title', 'Untitled')
        url = ch.get('url', '')
        embed.add_field(
            name=f"{i}. {title}",
            value=f"[Link]({url})",
            inline=False
        )

    if len(challenges) > 10:
        embed.set_footer(text=f"Showing first 10 of {len(challenges)} challenges")

    await ctx.send(embed=embed)


@bot.command(name='add', help='Add a challenge: !add <URL>')
async def add(ctx, url: str = None):
    """Add a new challenge to the catalog (Step 4)"""
    if not url:
        await ctx.send("❌ Please provide a URL: `!add <url>`")
        return

    # Validate URL format
    if not url.startswith(('http://', 'https://')):
        await ctx.send("❌ Invalid URL format. Must start with http:// or https://")
        return

    # Validate it's from codingchallenges.fyi
    if not is_valid_challenge_url(url):
        await ctx.send(
            "❌ Invalid URL. Only challenges from codingchallenges.fyi are allowed!"
        )
        return

    async with ctx.typing():
        # Fetch the title
        title = await fetch_challenge_title(url)

        if not title:
            await ctx.send(
                "❌ Could not fetch the challenge title. "
                "Make sure the URL is valid and accessible."
            )
            return

        # Add to catalog
        if add_challenge(url, title):
            embed = discord.Embed(
                title="✅ Challenge Added!",
                description=title,
                url=url,
                color=discord.Color.green()
            )
            embed.add_field(name="URL", value=url, inline=False)
            await ctx.send(embed=embed)
        else:
            await ctx.send("⚠️ This challenge is already in the catalog!")


@bot.command(name='stats', help='Show bot statistics')
async def stats(ctx):
    """Show bot statistics"""
    challenges = load_challenges()

    embed = discord.Embed(
        title="📊 Bot Statistics",
        color=discord.Color.gold()
    )
    embed.add_field(name="Servers", value=len(bot.guilds), inline=True)
    embed.add_field(name="Challenges", value=len(challenges), inline=True)
    embed.add_field(name="Users", value=len(bot.users), inline=True)
    embed.set_footer(text=f"Bot: {bot.user.name}")

    await ctx.send(embed=embed)


@bot.command(name='ping', help='Check bot latency')
async def ping(ctx):
    """Check bot's response time"""
    latency = round(bot.latency * 1000)
    await ctx.send(f"🏓 Pong! Latency: {latency}ms")


@bot.command(name='about', help='About this bot')
async def about(ctx):
    """Display information about the bot"""
    embed = discord.Embed(
        title="🤖 Coding Challenges Bot",
        description=(
            "A helpful bot for discovering coding challenges and getting inspired!\n\n"
            "**Features:**\n"
            "• Random inspirational quotes\n"
            "• Coding challenge suggestions\n"
            "• Challenge catalog management\n"
            "• Friendly greetings"
        ),
        color=discord.Color.blue()
    )
    embed.add_field(
        name="Commands",
        value="Type `!help` to see all available commands",
        inline=False
    )
    embed.set_footer(text="Built as part of CodingChallenges.fyi")

    await ctx.send(embed=embed)


# ============================================================================
# Error Handling
# ============================================================================

@bot.event
async def on_command_error(ctx, error):
    """Handle command errors"""
    if isinstance(error, commands.MissingRequiredArgument):
        await ctx.send(f"❌ Missing required argument: {error.param.name}")
    elif isinstance(error, commands.CommandNotFound):
        # Silently ignore unknown commands
        pass
    else:
        print(f"Error: {error}")
        await ctx.send("❌ An error occurred while processing your command.")


# ============================================================================
# Main Function
# ============================================================================

def main():
    """Main entry point for the bot"""
    # Get token from environment variable
    token = os.getenv('DISCORD_BOT_TOKEN')

    if not token:
        print("Error: DISCORD_BOT_TOKEN environment variable not set!")
        print("\nTo run this bot:")
        print("1. Create a bot at https://discord.com/developers/applications")
        print("2. Get your bot token")
        print("3. Set it as an environment variable:")
        print("   export DISCORD_BOT_TOKEN='your-token-here'")
        print("4. Run the bot: python discord_bot.py")
        return

    # Initialize challenges file if it doesn't exist
    if not os.path.exists(CHALLENGES_FILE):
        # Create with sample challenges
        sample_challenges = [
            {
                "title": "Build Your Own wc Tool",
                "url": "https://codingchallenges.fyi/challenges/challenge-wc"
            },
            {
                "title": "Build Your Own JSON Parser",
                "url": "https://codingchallenges.fyi/challenges/challenge-json-parser"
            },
            {
                "title": "Build Your Own Compression Tool",
                "url": "https://codingchallenges.fyi/challenges/challenge-huffman"
            }
        ]
        save_challenges(sample_challenges)
        print(f"Created {CHALLENGES_FILE} with {len(sample_challenges)} sample challenges")

    # Run the bot
    print("Starting bot...")
    bot.run(token)


if __name__ == '__main__':
    main()
