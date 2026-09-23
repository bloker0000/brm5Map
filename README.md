# BRMap5 - Blackhawk Rescue Map 5

Interactive map for Blackhawk Rescue Mission 5.
You can check it out [here](https://www.brmap5.com/).

## Running it

```
npm install
npm run dev
```

That serves the site on http://localhost:5173. `npm run build` makes the production build
and `npm run lint` checks the code.

## Adding or editing locations

With the dev server running, press Ctrl+Shift+A to open the admin panel. It is only there
in dev, a production build leaves it out. Every edit is saved straight into
`src/data/brm5-locations.json`, so it shows up in git and wants committing. Ctrl+Z and
Ctrl+Shift+Z undo and redo.

## Tech Stack

- React 19 + TypeScript
- Vite
- Fuse.js (fuzzy search in the mission library)
- Hosted on Vercel, the visitor counter is a Vercel function on Upstash Redis

The background artwork is by the artists credited on the site.
