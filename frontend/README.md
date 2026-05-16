# Smart Property Platform Frontend

React/Vite interface for the Smart Property Platform.

## Local Run

```bash
npm install
npm run dev
```

The app runs on `http://localhost:8080` and proxies `/api` plus `/health` to the backend target.

Create `frontend/.env` from `frontend/.env.example` if the backend is not running on `http://localhost:4001`.

## Checks

```bash
npm run build
npm run lint
npm run test
```
