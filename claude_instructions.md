# How to Analyze Your Project with Claude Pro

I have prepared a consolidated snapshot of your project's core code. You can use this to get high-quality code reviews, architecture suggestions, and feature implementation help from Claude Pro.

## Steps to Use the Snapshot

1.  **Locate the Snapshot**: The file is named `project_snapshot.md` and is located in your artifacts directory.
2.  **Upload to Claude Pro**: 
    - Go to [Claude.ai](https://claude.ai).
    - Start a new chat (using Claude 3 Opus or Sonnet for best results).
    - Attach or upload the `project_snapshot.md` file to the chat.
3.  **Provide a Prompt**: Use one of the suggested prompts below to start the analysis.

## Suggested Prompts for Claude Pro

### 1. General Code Review
> "I have attached a snapshot of my project's core source code. Can you perform a comprehensive code review focusing on:
> - Security vulnerabilities (especially in the multi-tenant context).
> - Performance bottlenecks.
> - Best practices and code quality improvements.
> - Potential areas for refactoring."

### 2. Multi-Tenancy Validation
> "My application uses Supabase and Clerk for a multi-tenant (SaaS) architecture. Please review the implementation in `App.tsx`, `server.ts`, and the components to ensure data isolation is handled correctly and efficiently. Are there any edge cases I'm missing?"

### 3. Feature Suggestion
> "Based on the existing architecture, what are the most logical next features to implement for a Hood Cleaning Management System? Please provide high-level implementation steps for your top 3 suggestions."

### 4. Technical Debt Analysis
> "Identify any technical debt or 'smells' in the current codebase. Recommend a roadmap for addressing these issues without breaking existing functionality."

## Tips for Better Results
- **Be Specific**: If you have a particular concern (e.g., "how the PDF generator works"), mention it in your prompt.
- **Context Matters**: Tell Claude what the app does (it's a management system for cleaning businesses) to get more relevant advice.
