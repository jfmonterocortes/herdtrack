# HerdTrack – Group 6

HerdTrack is a React + Express web app that helps small farms track their herd: animals, weights and health events. Data is stored in PostgreSQL on Azure.

## Team

| Member | Area |
|---|---|
| Nathaniel Hickling | Backend base + authentication |
| Kevin Napoles Paneque | Frontend base + auth pages |
| Halvin Silva Mayes | Animals (API + pages) |
| Juan Felipe Montero Cortes | Azure + weights / growth |

## Folders

```
/client   React frontend (Vite, React Router, Bootstrap, Recharts)
/server   Express REST API (Node.js, Prisma, JWT)
```

## How we work

1. Never push straight to `main`.
2. Make a branch for each task: `feature/<short-name>` (example: `feature/auth-login`).
3. Open a pull request when the task is done.
4. **At least 1 other member must review and approve it before it is merged.**
5. Move your card on the GitHub Projects board: To do → In progress → In review → Done.
6. Never commit `.env` files or passwords. Use `.env.example` to show which variables are needed.

## Running the project

### API (`/server`)

Needs Node.js 20 or newer.

```bash
cd server
npm install
cp .env.example .env      # then fill in DATABASE_URL and JWT_SECRET
npx prisma generate
npm run dev               # starts the API on http://localhost:3000
npm test                  # runs the unit tests
```

Check it is running: `GET http://localhost:3000/api/health`.

### Frontend

Use Node.js 20.19+ (20.x) or 22.12+. From the repository root:

```sh
cd client
npm ci
npm run dev
```

Open the URL printed by Vite. The dev and preview servers forward `/api` to
`http://localhost:3000`. Run an API with the auth endpoints separately. To use
another API, copy `client/.env.example` to `client/.env.local` and set
`API_PROXY_TARGET`.

Run `npm run build` from `client` to produce `client/dist`. When serving the
built app, route `/api/*` to Express and serve `index.html` for client routes
such as `/herd/123`.

Login and registration verify the session through `GET /api/auth/me`. The
browser keeps the JWT for the current tab, including reloads. To call an
authenticated endpoint from a component, get `request` from `useAuth()` and
pass a path relative to `/api`, such as `request('/auth/me')`.

The navigation includes Dashboard, Herd, and Health. Animal detail pages use
`/herd/:animalId`. Herd, Animal detail, and Health are ready for their feature
implementations.
