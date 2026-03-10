# Nana Club Tanger

Deployable website and admin panel for the Nana Club product site.

## Architecture

- `website-server.js`: public website API and static site
- `admin-server.js`: protected admin API and admin UI
- shared persistent data in `data.json`
- shared uploads directory in `uploads/`

The admin is configured for a separate subdomain:

- website: `nana.ibnbatoutaweb.com`
- admin: `admin.nana.ibnbatoutaweb.com`

## Local development

1. Install dependencies:
   ```bash
   npm ci
   ```
2. Start the website:
   ```bash
   npm run start:website
   ```
3. Start the admin:
   ```bash
   ADMIN_USER=admin ADMIN_PASS=change-me-now npm run start:admin
   ```

Local URLs:

- website: `http://localhost:3001`
- admin: `http://localhost:3101/admin`

## Security model

- public site can only read site data
- admin login is server-side and cookie-based
- admin credentials come from `ADMIN_USER` / `ADMIN_PASS`
- uploads require admin authentication
- site data no longer stores admin credentials

## Data bootstrap note

This repo does not currently include the media files referenced under `/uploads/...` in `data.json`. The deployment setup will preserve the JSON content, but you need to restore the actual media files into `uploads/` if you want those existing images to render.

## Deploy to Coolify

Use Docker Compose.

### Environment variables

- `WEBSITE_PORT=3001`
- `ADMIN_PORT=3101`
- `PRODUCT_DOMAIN=nana.ibnbatoutaweb.com`
- `ADMIN_DOMAIN=admin.nana.ibnbatoutaweb.com`
- `ADMIN_USER=admin`
- `ADMIN_PASS=<strong-password>`
- `COOKIE_SECURE=true`
- `DATA_FILE=/app/data/data.json`
- `UPLOADS_DIR=/app/uploads`

### Coolify domain fields

Use generated domains first. After they work over HTTPS, move to custom domains one by one.

- website service: `https://nana.ibnbatoutaweb.com:3001`
- admin service: `https://admin.nana.ibnbatoutaweb.com:3101`

Do not start with bare hostnames in the domain fields. Use full HTTPS FQDNs with ports.

### DNS strategy

For first deployment:

- `A panel -> <server-ip>`
- `A * -> <server-ip>`

After custom domains are stable, keep only:

- `A panel -> <server-ip>`
- `A nana -> <server-ip>`
- `A admin.nana -> <server-ip>`

Add `AAAA` records only after IPv4 HTTP/HTTPS is confirmed working.

## Deployment scripts

Generate `.env` for the Nana subdomain:

```powershell
pwsh ./scripts/setup-env.ps1 -ParentDomain ibnbatoutaweb.com -ProductSubdomain nana
```

The generated local `.env` keeps `COOKIE_SECURE=false` for HTTP testing. In Coolify production, set `COOKIE_SECURE=true`.

Deploy locally with Docker:

```powershell
pwsh ./scripts/deploy-local.ps1
```

Commit, push, and optionally trigger Coolify directly:

```powershell
pwsh ./scripts/push-and-deploy.ps1 -Branch main -Remote origin
```

## GitHub auto-deploy

This repo includes `.github/workflows/deploy.yml`.

Set these repository secrets:

- `COOLIFY_WEBHOOK_PROD`
- `COOLIFY_TOKEN_PROD`
- `COOLIFY_WEBHOOK_STAGING` (optional)
- `COOLIFY_TOKEN_STAGING` (optional)
