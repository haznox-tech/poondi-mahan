# Deploying to ResellerClub VPS (cPanel)

This app is a Vite-built React SPA served by a small persistent Express server
(`server/index.js`). The server serves the built static site **and** the
`/api/*` admin/auth endpoints from one Node process. Deployments are done by
`git pull`-ing code changes onto the server and rebuilding — there is no
database; gallery/video content lives in `src/data/galleryData.json` /
`public/data/galleryData.json` on the server's disk (server-side storage, not
committed back to GitHub by the app anymore).

## 0. One-time repo setup on the VPS

SSH or open the cPanel **Terminal**, then:

```bash
cd ~                      # or wherever you want the app to live, e.g. ~/apps
git clone https://github.com/haznox-tech/poondi-mahan.git
cd poondi-mahan
```

Since the repo is private, cPanel's terminal will prompt for GitHub
credentials on clone/pull. Easiest options:
- Use a GitHub Personal Access Token as the password when prompted, or
- `git remote set-url origin https://<token>@github.com/haznox-tech/poondi-mahan.git`
  (keep this token scoped to `repo` read-only if possible).

## 1. Check whether "Setup Node.js App" is available

In cPanel, look for an app icon called **"Setup Node.js App"** (Software
section). This is cPanel's Phusion Passenger integration and is the easiest
path. If you don't see it, your hosting plan doesn't expose it and you must
use the PM2 fallback (Section 3).

### If "Setup Node.js App" IS available (Passenger)

1. Click **Create Application**.
2. **Node.js version**: pick the latest available 18+ (20 LTS preferred).
3. **Application mode**: Production.
4. **Application root**: the folder you cloned into, e.g. `poondi-mahan`
   (relative to the home directory).
5. **Application URL**: your domain, `poondimahan.org` (or a subdomain).
6. **Application startup file**: `server/index.js`.
7. Click **Create**. cPanel creates a virtualenv-style Node environment and
   gives you a command like:
   ```bash
   source /home/<cpanel_user>/nodevenv/poondi-mahan/20/bin/activate && cd /home/<cpanel_user>/poondi-mahan
   ```
8. Use that activation command (or the "Run NPM Install" button in the UI)
   to install dependencies and build:
   ```bash
   npm install
   npm run build
   ```
9. Set environment variables in the **same cPanel Node App screen** (the
   "Environment variables" section) — see Section 2 below for which ones.
   Passenger injects `PORT` automatically; do not set it yourself.
10. Click **Restart** in the Node App UI. Passenger keeps the process alive
    and restarts it on crash — no PM2 needed.

## 2. Environment variables

Set these either in the cPanel "Setup Node.js App" environment-variables UI,
or in a `.env` file in the app root if running via PM2. Never commit `.env`.

| Variable | Required | Notes |
|---|---|---|
| `SMTP_USER` | Optional | Gmail address used to send OTP emails |
| `SMTP_PASS` | Optional | Gmail App Password (not the account password) |
| `SMTP_FROM` | Optional | From address shown in OTP emails |
| `VITE_ADMIN_EMAIL` | Optional | Cosmetic only — seeds the admin email the *first* time the server ever starts. Not the real auth boundary. |
| `VITE_CLOUDINARY_CLOUD_NAME` | If using Cloudinary | Public, safe to expose |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | If using Cloudinary | Public, safe to expose |
| `CLOUDINARY_API_SECRET` | If using Cloudinary delete | Server-only — never prefix with `VITE_` |
| `PORT` | Passenger sets this automatically | Only set manually for PM2 |

`VITE_*` variables must be present at **build time** (`npm run build`), since
Vite inlines them into the client bundle. Server-only variables (`SMTP_*`,
`CLOUDINARY_API_SECRET`) are read at **runtime** by `server/`, so they can be
set/changed without rebuilding, but the Node process must be restarted.

## 3. Fallback: no "Setup Node.js App" — use PM2

If Passenger/Node App Selector isn't available on the account, run the
server yourself with PM2 (install it once per account):

```bash
cd ~/poondi-mahan
npm install
npm install -g pm2          # may need --prefix ~/.local if no root access
cp .env.example .env        # then edit .env with real values
npm run build
PORT=3001 pm2 start server/index.js --name poondi-mahan
pm2 save
pm2 startup                 # follow the printed instructions to survive reboots
```

You'll then need an Apache reverse proxy (via cPanel's "Domains" ->
".htaccess" or an Apache include) forwarding `poondimahan.org` to
`127.0.0.1:3001`, since Apache — not Node — owns port 80/443 on shared/VPS
cPanel setups. If ResellerClub support can enable a proxy for you, request:

```
ProxyPreserveHost On
ProxyPass / http://127.0.0.1:3001/
ProxyPassReverse / http://127.0.0.1:3001/
```

(This step is unnecessary if "Setup Node.js App" is available — Passenger
handles the proxying automatically.)

## 4. First-run: set the real admin password

The server auto-generates a random admin password on first boot and prints
it once to the terminal/log — copy it immediately, or better, set your own:

```bash
node scripts/set-admin-password.js "you@yourdomain.com" "a-strong-password-16+chars"
```

This writes `server/data/admin-credentials.json` (bcrypt hash only, gitignored,
never committed). Restart the Node app afterward so it picks up the new file
if it was already running.

## 5. Deploying code updates (the `git pull` workflow)

For every future update:

```bash
cd ~/poondi-mahan
git pull origin main
npm install          # only needed if package.json changed
npm run build        # rebuilds dist/ — required after any src/ change
```

Then restart the app:
- **Passenger**: click **Restart** in cPanel's "Setup Node.js App" screen
  (or touch the restart file: `touch tmp/restart.txt` inside the app root,
  if your Passenger version supports it).
- **PM2**: `pm2 restart poondi-mahan`

`git pull` only updates code — it will **never** overwrite
`src/data/galleryData.json` / `public/data/galleryData.json` or
`server/data/admin-credentials.json` on the server, because those paths are
gitignored (`server/data/`) or are the same tracked JSON files the admin
panel edits directly on disk. If you edit gallery content through the admin
panel, that content lives only on the server's disk — pulling code changes
never touches it.

## 6. Sanity checklist after first deploy

- `curl https://poondimahan.org/api/admin/data` → should return JSON with
  keys `items, featured, trash, videos, videoTrash` and **no** `credentials`
  key.
- Visit `/admin/login`, log in with the credentials from Section 4.
- Try uploading a gallery photo — confirm it lands under
  `public/images/gallery/uploaded/` on the server.
- Confirm `server/data/admin-credentials.json` exists and is **not**
  reachable over HTTP (e.g. `curl https://poondimahan.org/server/data/admin-credentials.json`
  should 404 — it's outside `dist/`, so Express's static file serving never
  exposes it).
