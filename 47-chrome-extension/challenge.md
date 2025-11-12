# Build Your Own Chrome Extension

This challenge is to build your own Chrome extension. Chrome extensions are software programs that extend the functionality of the Google Chrome web browser. They are typically written in HTML, CSS, and JavaScript, and they modify or enhance the browser's functionality in some way.

Chrome extensions can add new features, customise the appearance of websites, improve productivity, block ads, manage passwords, and much more. You can install and manage Chrome extensions through the Chrome Web Store.

## The Challenge - Building A Chrome Extension

For this Coding Challenge you're going to build a Chrome extension that will customise the look and functionality of each new tab you open in Chrome. It's drawing on inspiration from the popular extension Bonjourr and the more complicated Momentum.

If you've never built a Chrome extension before, the [Chrome for Developer website](https://developer.chrome.com/docs/extensions/mv3/getstarted/) has a section on getting started building Chrome extensions.

## Step Zero

Before we begin, please set up your IDE etc. as you like it. This challenge is one you'll be tackling in JavaScript or TypeScript along with HTML and CSS.

## Step 1

In this step your goal is to create the Coding Challenges equivalent to 'Hello, World' for Chrome extensions. That is create an extension that:

- You can install locally
- Sets the background colour of the new tab to Coding Challenges Blue (that's `#04295B`)
- Displays the text `Coding Challenges>_` in the centre of the new tab. Bonus points for matching the Coding Challenges branding! 😀

When you create a new tab, the tab should then look like this:

![Step 1 Screenshot](https://codingchallenges.fyi/images/chrome-ext-1.png)

## Step 2

In this step your goal is to add the current time to the tab, and the date in a human friendly format below. You can draw your inspiration from Bonjourr or the example.

![Step 2 Screenshot](https://codingchallenges.fyi/images/chrome-ext-2.png)

Don't forget to include the functionality to update the time!

## Step 3 - Version 1

In this step your goal is to add some dynamic information. For example, Bonjourr provides details of the weather.

![Step 3 Weather Screenshot](https://codingchallenges.fyi/images/chrome-ext-3.png)

We're doing Coding Challenges so we'll list the latest coding challenges from the Coding Challenges Substack Feed.

![Step 3 Substack Screenshot](https://codingchallenges.fyi/images/chrome-ext-4.png)

To do this you'll have to ensure the extension has permission to fetch from Substack. To further complicate things, at the time of writing the Substack RSS feed doesn't include CORS headers so you'll need to find a way to fetch the feed through some sort of proxy. If you haven't come across it before, you can learn more about [CORS here](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS).

## Step 3 - Version 2

In this alternate step your goal is to add some dynamic information without the need for a proxy. As the Coding Challenges Community is doing a great job of sharing solutions, this version displays all the open PRs for the Shared Solutions Github Repository.

![Step 3 GitHub Screenshot](https://codingchallenges.fyi/images/chrome-ext-5.png)

You can get a list of the PRs by calling Github's REST API endpoint:
```
https://api.github.com/repos/CodingChallegesFYI/SharedSolutions/pulls
```

You'll find the full documentation for their REST API [here](https://docs.github.com/en/rest).

## Going Further

You can take this Coding Challenge further by:

1. Extracting further information from either of the dynamic elements and adding some more context. For example, for the Substack feed you could add the images, title and description of each challenge.

2. Change the extension to be more generic, perhaps displaying a daily quote and offering a customisable Github feed.

3. Consider packaging the extension and making it available on the Chrome Web Store.

## Resources

- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [GitHub REST API](https://docs.github.com/en/rest)
- [CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

## Learning Objectives

Through this challenge you'll learn:

- How to create and structure a Chrome extension
- Working with Chrome Extension Manifest V3
- Using Chrome's override pages feature
- Making API requests from extensions
- Managing permissions in Chrome extensions
- Using JavaScript for DOM manipulation and time formatting
- Working with external APIs (GitHub REST API)
- Handling CORS issues in browser extensions

## Challenge Source

This challenge is from [CodingChallenges.fyi](https://codingchallenges.fyi/challenges/challenge-chrome-extension)
