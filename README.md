# Content Planner

A lightweight internal content management application built with Next.js and TypeScript to streamline the production of marketing content.

I built this project to explore how software can be designed around a specific business workflow rather than trying to solve every possible project-management problem. The application provides a shared workspace where team members can create content tasks, assign ownership, track progress, and move work through a defined production pipeline.

The project represents an important step in my development journey toward building software that is not only technically functional, but also shaped around real operational requirements and business processes.

## Live Demo

https://team-task-calendar.onrender.com/

## Screenshots

### Dashboard

### Content Task Management

### Task Creation Modal

### Workflow Status

### Mobile Dashboard

## Demo Videos

* Client Walkthrough: <url>
* Architecture & Decisions: <url>
* Developer Reflection: <url>

## Features

### Content Workflow

*From idea to publication*

Content moves through a predefined production pipeline consisting of Idea, Draft, Ready, and Posted stages. This gives the team a simple way to understand the current state of every piece of content.

### Task Management

*Simple content operations*

Team members can create, edit, and delete content tasks while maintaining the information needed to track production. The interface uses modal-based interactions to keep task management within the main dashboard workflow.

### Team Assignment

*Clear ownership of work*

Tasks can be assigned to predefined internal team members, making responsibility visible within the shared workspace and helping the team understand who is responsible for each piece of content.

### Workflow Filtering

*Focus on what matters*

Content can be filtered according to its current production status, allowing team members to focus on specific stages of the workflow rather than navigating through unrelated tasks.

### Responsive Dashboard

*Built for everyday use*

The application provides a responsive dashboard interface so the internal workflow remains usable across different screen sizes without requiring a separate mobile application.

## Technologies Used

* Next.js
* React
* TypeScript
* Tailwind CSS
* Render

## Architecture Highlights

The application was intentionally designed as a lightweight monolithic internal tool rather than a multi-tenant SaaS platform. It uses a single shared workspace protected by an application password, with team members represented as predefined internal users. This kept the implementation aligned with the actual scope of the project and avoided introducing authentication, organization management, and permission systems that were not required for its intended use.

## Challenges

* Designing a simple content production workflow that clearly communicates the progression from Idea to Posted.
* Keeping the interface lightweight while supporting multiple task states and team assignments.
* Managing form interactions through reusable modal-based interfaces.
* Organizing application state across task creation, editing, deletion, assignment, and filtering workflows.
* Designing the application around a real internal business process rather than a generic task-management model.

## What I Learned

This project taught me that useful software does not need to be large or complicated; it needs to clearly solve the problem it was designed for.

## Looking Back

Building the Content Planner shifted my thinking from simply implementing features to thinking more carefully about the workflow those features are meant to support. I learned that deliberately limiting a system can be just as important as adding capabilities, especially when the requirements are clear and the users are known. The project reinforced the idea that good engineering is about making appropriate decisions for the problem rather than automatically choosing the most sophisticated architecture.

## Future Improvements

* Calendar-based content scheduling
* Drag-and-drop workflow management
* Content approval workflows
* Team notifications
* Analytics and production metrics
* Activity history
* Role-based permissions
* Social media publishing integrations

## Author

**Obinna Jachike Ezeani**

Software Engineer | Product Builder | Co-Founder

GitHub: https://github.com/axce

LinkedIn: https://www.linkedin.com/in/obinna-jachike-ezeani-a072b9284/
