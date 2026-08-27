# Issue tracker: GitHub

Issues and specifications for this repository live as GitHub issues. Use the `gh` CLI for all operations. Infer the repository from `git remote -v`; `gh` does this automatically when run inside this clone.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

## Specification and ticket workflow

- When `/to-spec` creates a specification, add the `spec` label and set its status to `Backlog`.
- When `/to-tickets` creates tickets, add the `ticket` label, set each ticket to `Ready`, and link it to its specification as a GitHub sub-issue. Keep an annotation in each ticket body identifying its parent specification.
- Once every ticket has been created and linked, set the parent specification to `Ready`.
- Add a native GitHub `Blocked by` relationship only when a ticket genuinely depends on another ticket. Keep useful dependency annotations in issue bodies as well.
- When `/implement` starts, set both the ticket and its parent specification to `In Progress`.
- When creating a pull request, include `Closes #<ticket-number>` in its body and set the ticket to `In Review`.
- After a pull request is merged, set its ticket to `Done`. Set the parent specification to `Done` only when all of its sub-issues are `Done`.
- If a pull request closes without merging, return its ticket to `In Progress`.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repository treats external PRs as feature requests; `/triage` reads this flag.)_

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.
