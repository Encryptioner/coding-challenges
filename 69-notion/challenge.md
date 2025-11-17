# Build Your Own Notion

This challenge is to build your own version of Notion - a popular all-in-one workspace application.

## Background

Notion is a powerful note-taking and knowledge management application that combines documents, databases, wikis, and project management. It's known for its flexible block-based editor and hierarchical page organization.

## The Challenge - Building A Notion Clone

In this challenge you'll be building a simplified version of Notion with core features including:
- Rich text editing
- Page management
- Hierarchical organization
- Navigation sidebar
- Page duplication
- AI-assisted writing (bonus)

## Step Zero

In this step you decide which programming language and framework you're going to use and set up your development environment.

For this challenge, you'll need:
- A web framework for the backend
- A database for persistence
- A rich text editor for content editing
- A frontend framework (optional but recommended)

## Step 1

In this step your goal is to create a basic page editor that allows users to write and format text.

The editor should support:
- Basic text formatting (bold, italic, underline)
- Headings (H1, H2, H3)
- Lists (bulleted and numbered)
- Code blocks
- Links

## Step 2

In this step your goal is to implement page management functionality.

Users should be able to:
- Create new pages
- Edit existing pages
- Delete pages
- Save pages automatically
- View a list of all pages

## Step 3

In this step your goal is to implement data persistence.

Pages should be:
- Saved to a database
- Loaded on application start
- Updated when edited
- Removed when deleted

## Step 4

In this step your goal is to create a navigation sidebar.

The sidebar should:
- List all pages the user has created
- Allow clicking to navigate between pages
- Show the current page highlighted
- Have a button to create new pages

## Step 5

In this step your goal is to allow pages to be duplicated.

This allows a user to:
- Create a new blank page
- Create a copy of an existing page
- Use templates by duplicating pages

Be sure to give the duplicate a sensible name:
- Add "(1)" after the name, or
- Add "Copy of" to the beginning

## Step 6

In this step your goal is to allow pages to be reorganized.

Notion allows users to:
- Group pages under other pages (hierarchy)
- Re-order pages in the navigation bar
- Nest pages multiple levels deep

You should implement:
- Drag and drop reordering
- Parent-child page relationships
- Collapsible page groups

## Step 7 (Bonus)

In this step your goal is to add AI-assisted text generation.

Add a formatting option that:
- Uses the current sentence as a prompt for an LLM
- Generates text to continue writing
- Integrates with Ollama or similar local LLM

See:
- https://ollama.com/library/llama3
- https://github.com/ollama/ollama/tree/main/docs

## Going Further

You can take this challenge further by:

- **Mobile/Desktop Apps**: Build native apps using Electron (desktop) or React Native (mobile)
- **Real-time Collaboration**: Add multi-user editing with WebSockets
- **Databases**: Add table/spreadsheet views
- **Templates**: Create and manage page templates
- **Export**: Export pages to PDF, Markdown, or HTML
- **Search**: Full-text search across all pages
- **Tags**: Add tagging and filtering
- **Dark Mode**: Theme customization

## References

- [Build Your Own Notion](https://codingchallenges.fyi/challenges/challenge-notion)
- [Notion](https://www.notion.so/)
- [Ollama](https://ollama.com/)
