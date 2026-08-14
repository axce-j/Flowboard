# Content Planner

A lightweight internal content management application built with Next.js and TypeScript to streamline marketing content production.

This project was created to explore workflow-driven application design, CRUD operations, and dashboard development by modelling a real content production pipeline used by an internal marketing team.

The application provides a shared workspace where team members can create content tasks, assign ownership, update progress, and move work through predefined production stages. Rather than attempting to become a general-purpose project management platform, it focuses on one specific operational problem: managing the lifecycle of marketing content.

This project represents an important step in my progression toward building software around real business workflows rather than simply building interfaces or generic CRUD applications.

## Live Demo

<LIVE_DEMO_URL>

## Screenshots

### Dashboard

(Add screenshot)

### Content Task Management

(Add screenshot)

### Task Creation Modal

(Add screenshot)

### Production Workflow

(Add screenshot)

### Content Filtering

(Add screenshot)

### Mobile View

(Add screenshot)

## Demo Videos

* Client Walkthrough: <url>
* Architecture & Decisions: <url>
* Developer Reflection: <url>

## Features

* Create content production tasks
* Edit existing content tasks
* Delete content tasks
* Assign internal team members
* Track production progress
* Organize tasks by workflow stage
* Filter tasks by production status
* Manage tasks through modal interfaces
* Responsive dashboard experience
* Shared team workspace

## Technologies Used

* Next.js
* React
* TypeScript
* Tailwind CSS
* Render

## Architecture Highlights

The application was intentionally designed as a lightweight monolithic internal tool rather than a multi-tenant platform. It operates around a single shared workspace protected by an application-level password, while team members are selected from predefined internal users. This keeps the architecture aligned with the actual use case and avoids introducing unnecessary authentication, organization, and permission complexity for a small internal team.

## Challenges

* Designing an intuitive content production workflow
* Supporting multiple production stages without adding unnecessary complexity
* Managing task creation and editing through reusable modal interfaces
* Keeping application state consistent across task interactions
* Designing a simple dashboard for an operational workflow
* Translating a real marketing process into a usable software interface

## What I Learned

* Designing interfaces around real business workflows rather than generic entities
* Building reusable CRUD interactions within a focused application
* Making architectural decisions based on actual product requirements
* Balancing simplicity, usability, and maintainability in internal software
* Modelling production processes as structured application workflows

## Looking Back

This project taught me that useful software does not always need to be large or technically complex. By focusing on a specific content production workflow, I was able to concentrate on how people actually use a system to complete work, rather than adding features simply to make the application appear more sophisticated. It reinforced the importance of understanding the problem first and choosing an architecture that is appropriate for the scale and requirements of the product.

## Future Improvements

* Calendar-based content scheduling
* Drag-and-drop workflow management
* Content approval workflows
* Team notification system
* Activity history and audit tracking
* Advanced search and filtering
* Analytics for content production
* Social media publishing integrations



## Author

**Obinna Jachike Ezeani**

Software Engineer | Product Builder | Co-Founder

GitHub: https://github.com/axce

LinkedIn: https://www.linkedin.com/in/obinna-jachike-ezeani-a072b9284/
