# Build Your Own Markdown Presentation Tool

This challenge is to build your own version of Go's Present or Slidev. They are tools that allow us to write and design presentations using Markdown to define the content of the slides. Both also provide the functionality to display the slides.

## Background

I find myself moving more and more toward writing all my documentation, courses, training material and presentations in Markdown. It makes them portable and most importantly for me as a software engineer I can version control them!

## The Challenge - Building A Markdown Presentation Tool

In this challenge you'll be building a tool that allows the user to create a new presentation with a simple command.

Once they have edited the Markdown to add their content they will be able to deliver the presentation with the tool.

Slidev has a great demonstration of what we're aiming for on their homepage.

## Step Zero

In this step you decide which programming language and IDE you're going to use and you get yourself setup with a nice new project.

## Step 1

In this step your goal is to allow user to create a new project with a suitable folder structure.

For example:

A directory structure for presentation content:
- `slides/` - Markdown slide content
- `template/` - Template customisation
- `images/` - Image assets
- `.git/` folder - Initialising the project ready for git
- Relevant configuration for the technology stack used to present the slides
- A `README.md` explaining how the user uses their new presentation

When it comes to the .git initialisation you could invoke git or if you fancy getting to know how git works "under the covers" check out and implement Step 1 of the build your own git coding challenge.

## Step 2

In this step your goal is to launch a web server and render the markdown as it is, by which I mean in raw text.

As part of this step you also want to support **live reload**, so that when the user edits the Markdown, the change is reflected in the 'rendered' content in their browser. Frontend developers should be familiar with the benefits from this if they've used React.

## Step 3

In this step your goal is to render the markdown in HTML. In other words allow the user to make their slides look nice!

I'd suggest you define the look and feel of the HTML as a template and provide a default template like Present does. Slidev allows the user to specify themes that govern the appearance of the slides and layouts that control the layout.

## Step 4

In this step your goal is to allow the user of the tool to define their own template directory and use the pieces of the template in there if they exist, otherwise it should fall back to the default.

## Step 5

In this step your goal is to support exporting the slides to PDF. This allows you to use them as a handout for an in person presentation or training course.

## Going Further

If you fancy taking this coding challenge further you could:

- Extend it to support exporting to PowerPoint, Google Slides etc.
- Incorporate the ability to run example code - Present does this well

## References

- [Build Your Own Markdown Presentation Tool](https://codingchallenges.fyi/challenges/challenge-md-to-slides)
- [Slidev](https://sli.dev/)
- [Go Present](https://pkg.go.dev/golang.org/x/tools/present)
