# New User Request Form

A simple web form that clients use to request a new user account from the Elevated MSP Service Desk.

Submitting the form opens a pre-filled email to support@elevatedmsp.com in the requester's email app. They review it and click Send. The form never collects passwords.

## Development

```bash
npm test                                         # unit tests for the email builder
py -3 -m http.server 8765 --directory site       # preview at http://localhost:8765
```

Pushes to `main` run the tests and deploy `site/` to GitHub Pages.
