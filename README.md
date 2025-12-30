# BRM5 Interactive Map

Interactive map for Blackhawk Rescue Mission 5 (Roblox). Browse locations, search with fuzzy matching, and filter by category.

## Features

- Pan and zoom the map with mouse/touch
- Hover over pins for quick tooltips
- Click pins for detailed location info
- Fuzzy search across location names, descriptions, and categories
- Category-based filtering
- Admin panel for adding/editing locations (Ctrl+Shift+A)
- Fully responsive design
- Data persists in localStorage

## Development

npm install
npm run dev

Open http://localhost:5173

## Admin Panel

Press Ctrl+Shift+A to open the admin panel. Features:
- Add new locations (click on map to get coordinates)
- Edit existing locations
- Delete locations
- Export locations to JSON
- Import locations from JSON

## Deployment

Configured for Vercel. Push to GitHub and connect to Vercel.

## Tech Stack

- React 19 + TypeScript
- Vite
- react-zoom-pan-pinch (pan/zoom)
- Fuse.js (fuzzy search)

## Categories

Spawnpoint, Residence, Office Building Small/Large, Extraction Point, Enemy Outpost, Loot Area, Medical, Shop, Quest Location, Landmark, Other
