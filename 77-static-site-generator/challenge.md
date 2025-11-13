# Build Your Own Static Site Generator

This challenge is to build your own static site generator, i.e. something like Hugo (an open source static site generator built in Go).

Static site generators are a useful tool for those of us who want to build and host a simple, relatively static website. Because the site is static you can easily host it in AWS using CloudFront and an S3 Bucket or on Cloudflare using their Pages.

Such static sites are perfect for a simple blog or rarely changing website. No need to run or manage a server and by leveraging the fast infrastructure of AWS, Cloudflare or other cloud providers we can achieve very low latency access - helping with SEO.

## The Challenge - Building A Static Site Generator

In this challenge we're going to build a static site generator. It will allow us to:

- Create a new site
- Add a new page to the site
- Define some templates
- Run a development server
- Build the static site

## Step Zero

In this introductory step you're going to set your environment up ready to begin developing and testing your solution.

I'll leave you to setup your editor and programming language of choice. I'd encourage you to pick a tech stack that makes it easy to launch a web server that can then serve the static website during development or the static website. Go and Python both make this very easy, alternatively you could build your own web server.

## Step 1

In this step your goal is to allow the user of your static site generator to initialise a project.

Initialising a project should create a new directory for the project and a basic homepage that they can edit. For the moment this home page can be static HTML with some placeholder headings and text.

In other words the user should be able to do something like:

```bash
% ccssg mysite
% tree
.
└── mysite
    └── index.html
```

Where `ccssg` is our static site generator. Do feel free to pick a more cuddly name, like Hugo did 😀

## Step 2

In this step your goal is to allow a user to create a theme. When a theme is created our site generator should create a directory for themes and within that directory another for the theme itself. Something like this:

```bash
% ccsg new theme cc
% tree
.
└── mysite
    ├── index.html
    └── themes
        └── cc
            └── index.html
```

Now we can move the content of the index.html to the theme's index.html. Next up we'll look at content.

## Step 3

In this step we want to start managing the theme and the content separately. That means our new site generator should no longer create an index.html in the root directory. Instead let's create a new folder content and within there place an index.md.

To make this useful we want to be able to add other pages too, so let's add a new command that allows us to add content:

```bash
% ccsg mysite
% tree
.
└── mysite
    ├── content
    │   └── index.md
% ccsg new theme cc
% tree
.
└── mysite
    ├── content
    │   └── index.md
    └── themes
        └── cc
            └── index.html
% ccssg new page about
% tree
.
└── mysite
    ├── content
    │   ├── about.md
    │   └── index.md
    └── themes
        └── cc
            └── index.html
```

We're starting to create a useful structure now.

## Step 4

In this step we want to start making the site useful. Let's turn index.html into a template that allows the user to define a generic layout for a page which when rendered by our static site generator will contain the transformed markdown.

For example a template might look like this:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>{{ Title }}</title>
  </head>
  <body>
    {{ Content }}
  </body>
</html>
```

Where `Title` and `Content` will be replaced when the HTML is rendered by our static site generator.

We now want to support a build command for our site generator. It should go through all the pages in the content directory and render the index.html template replacing the `{{ Content }}` tag with the content of the markdown file and the `{{ Title }}` tag with the first top level header in the markdown file.

All of this should end up in a new directory called public. That will look something like this:

```bash
% tree
.
├── content
│   ├── about.md
│   └── index.md
├── public
│   ├── about.html
│   └── index.html
└── themes
    └── cc
        └── index.html
```

The contents of the public directory are what we would then deploy to our static website.

## Step 5

In this step your goal is to serve a development version of the website. The development version of the website should update when the user edits the content of any of the pages or the theme. This is usually referred to as a livereload.

## Going Further

To take this further add support for:

- Blogging
- Generating menus
- More tags
- Support for sitemaps and analytics
- Any other features from Hugo and the like that take your fancy

## Resources

- [Hugo Documentation](https://gohugo.io/documentation/)
- [Jekyll Documentation](https://jekyllrb.com/docs/)
- [Markdown Parser Libraries](https://github.com/markdown-it/markdown-it)

## Learning Objectives

Through this challenge you'll learn:

- Template engine design and implementation
- Markdown parsing and HTML generation
- File system operations and directory management
- Command-line interface design
- Development server with file watching
- Static asset generation
- Build system architecture

## Challenge Source

This challenge is from [CodingChallenges.fyi](https://codingchallenges.fyi/challenges/challenge-ssg)
