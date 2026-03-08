# Nana Club – Deployment Guide

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 (Alpine) |
| Framework | Express 4 |
| Storage | JSON file + disk uploads |
| Container | Docker (multi-stage) |
| Reverse Proxy | Traefik (via Coolify) |

---

## 🖥️ Run Locally (No Docker)

```bash
npm install
npm start
```

- **Website:** http://localhost:3001/
- **Admin:** http://localhost:3001/admin.html
- **Credentials:** `admin` / `nana2024`

---

## 🐳 Run with Docker

### 1. Create your `.env` file

```bash
cp .env.example .env
# Edit .env with your domain and desired port
```

### 2. Build & Start

```bash
docker compose up -d --build
```

### 3. Verify

```bash
# Check health
curl http://localhost:3001/health

# View logs
docker compose logs -f nana-club
```

### 4. Stop

```bash
docker compose down
```

---

## ☁️ Deploy with Coolify

### Option A: Docker Compose (Recommended)

1. In Coolify, create a new **Docker Compose** service
2. Connect your GitHub repo: `yassernahri7-create/nanapark7`
3. Set environment variables in Coolify:
   - `PORT=3001`
   - `DOMAIN=yourdomain.com`
4. Coolify will auto-detect the `docker-compose.yml` and deploy

### Option B: Dockerfile

1. In Coolify, create a new **Dockerfile** service
2. Connect your GitHub repo
3. Set the port to `3001`
4. Configure the domain in Coolify's UI
5. Coolify auto-builds and routes via Traefik

### Persistent Data

Uploaded images and `data.json` are stored in Docker volumes:
- `nana-uploads` → `/app/uploads`
- `nana-data` → `/app/data.json`

These persist across container restarts and redeployments.

---

## 📁 Project Structure

```
├── Dockerfile              # Multi-stage production build
├── docker-compose.yml      # Compose config with Traefik labels
├── .env.example            # Environment variable template
├── .dockerignore           # Files excluded from Docker build
├── server.js               # Express API server
├── index.html              # Main website
├── admin.html              # Admin panel
├── style.css               # Styles
├── i18n.js                 # Multi-language support (EN/FR/AR/ES)
├── data.json               # Site data (events, menu, settings)
└── uploads/                # User-uploaded media
```

---

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `DOMAIN` | `nanaclub.local` | Domain for Traefik routing |
| `NODE_ENV` | `production` | Node environment |
