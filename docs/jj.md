## Development Conventions

- **Commit Tracing:** Ensure traceability by executing the `jj describe` command after each step.
- **Approval Flow:** NEVER start implementation before the user explicitly approves the proposed plan in `docs/`.

## Version Control Workflow (Jujutsu)

**IMPORTANT:** Do NOT push directly to the `main` branch. Always use Pull Requests.

### Initial Setup

Configure `jj` to automatically track bookmarks from the remote to simplify the push workflow.

```bash
jj config set --user remotes.origin.auto-track-bookmarks '"glob:*"'
```

### Development Cycle

1.  **Create a Bookmark:** Start a new bookmark for your task.
    ```bash
    jj new main -m "feat: description of changes"
    jj bookmark set feat/your-feature-name
    ```
2.  **Develop & Format:** Make changes, then format the code before committing.
    ```bash
    pnpm format
    jj describe -m "feat: updated description"
    ```
3.  **Push Bookmark:** **Wait for user approval.** Once approved, push your specific bookmark to the remote to create/update the Pull Request.
    ```bash
    jj git push --bookmark feat/your-feature-name
    ```
4.  **Create Pull Request:** Open a Pull Request on GitHub targeting `main`.
5.  **Merge:** After approval, merge the PR on GitHub.
6.  **Update Local:** Fetch changes and start a new task.
    ```bash
    jj git fetch
    jj new main
    ```
