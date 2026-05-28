# Personal Job Board

A static GitHub Pages dashboard for saved job-search links, grouped by search lane, with space for future daily job updates.

## Edit Your Boards

Saved sites, industry tabs, keyword-search destinations, and future automation notes live in `data/boards.json`.

To add another industry tab, add an object to the `industries` array:

```json
{
  "id": "sample-industry",
  "name": "Sample Industry",
  "shortName": "Sample",
  "headline": "The board headline.",
  "description": "What this board is for.",
  "keywordSearch": {
    "placeholder": "Try analyst...",
    "sites": [
      { "name": "LinkedIn", "template": "https://www.linkedin.com/jobs/search/?keywords={query}" }
    ]
  },
  "careers": [
    { "name": "Example Careers", "url": "https://example.com/careers" }
  ],
  "jobBoards": [
    { "name": "Example Board", "url": "https://example.com/jobs" }
  ],
  "automation": {
    "ready": [],
    "requirements": ["Daily results are not active yet."],
    "research": ["Confirm a supported API or feed before automating this source."]
  }
}
```

For a tab without a keyword search section, omit `keywordSearch`, as the Missoula tab does.

## Future Daily Newest Jobs

The current page documents sources that are appropriate starting points for a scheduled update. Collection is not enabled in the visible dashboard yet.

- **USAJOBS keyword searches**: The official Search API requires an API key and the `Host`, `User-Agent`, and `Authorization-Key` headers. `User-Agent` should be the email address used for the API key request. Source: <https://developer.usajobs.gov/guides/authentication>
- **OnX, 10a Labs, and One Acre Fund**: These use Greenhouse-hosted job boards. Greenhouse's Job Board API exposes published GET job listings without authentication. Source: <https://developers.greenhouse.io/job-board>
- **Sibylline**: Its SmartRecruiters-hosted career page can use the public Posting API; SmartRecruiters documents the Posting API as public data available without authentication. Source: <https://developers.smartrecruiters.com/docs/authentication>
- **Control Risks**: Its Workable-hosted page can use Workable's public published-job endpoints. Source: <https://help.workable.com/hc/en-us/articles/115012771647-Using-the-Workable-API-to-create-a-careers-page>
- **ReliefWeb Jobs**: The ReliefWeb API exposes job data. It requires a pre-approved `appname` query parameter for API requests. Source: <https://apidoc.reliefweb.int/parameters>

Other career pages and aggregators on the board remain manual links unless a supported feed/API or an acceptable monitoring method is confirmed.

## Publish With GitHub Pages

In the repository settings, set GitHub Pages to deploy from the branch containing these files. If you use the default GitHub Pages branch deployment, choose the repository root as the source.

## Local Preview

Because the page loads JSON files, preview it with a local web server:

```powershell
python -m http.server 8080
```

Then open <http://localhost:8080>.
