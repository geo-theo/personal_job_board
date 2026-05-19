# Personal Job Board

A static GitHub Pages dashboard for saved job-search links, grouped by industry, with an optional daily USAJOBS refresh powered by GitHub Actions.

## Edit Your Boards

Saved sites and industry tabs live in `data/boards.json`.

To add another industry tab, add an object to the `industries` array:

```json
{
  "id": "sample-industry",
  "name": "Sample Industry",
  "shortName": "Sample",
  "headline": "The board headline.",
  "description": "What this board is for.",
  "quickActions": [
    { "label": "Saved search", "url": "https://example.com/jobs" }
  ],
  "links": [
    {
      "name": "Example Careers",
      "type": "Company",
      "description": "Why this site belongs here.",
      "cadence": "Check weekly.",
      "url": "https://example.com/careers",
      "searchUrl": "https://example.com/careers?q=geo"
    }
  ]
}
```

## Daily Newest Jobs

Recurring searches live in `data/searches.json`. The included searches use USAJOBS.

USAJOBS currently requires an API key and three request headers for job search calls: `Host`, `User-Agent`, and `Authorization-Key`. The user agent should be the email address used for the API key request. Source: <https://developer.usajobs.gov/guides/authentication>

Add these repository secrets in GitHub:

- `USAJOBS_USER_AGENT`: the email address used for your USAJOBS API key
- `USAJOBS_AUTH_KEY`: your USAJOBS API key

Then run **Actions -> Update newest jobs -> Run workflow** once. After that, the workflow runs every day at 12:00 UTC and commits `data/jobs.json`.

## Publish With GitHub Pages

In the repository settings, set GitHub Pages to deploy from the branch containing these files. If you use the default GitHub Pages branch deployment, choose the repository root as the source.

## Local Preview

Because the page loads JSON files, preview it with a local web server:

```powershell
python -m http.server 8080
```

Then open <http://localhost:8080>.
