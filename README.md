# clone-wp-from-server

Clones a live WordPress site to a local Docker environment with a single command. Each site gets an isolated URL derived from its name — run multiple sites simultaneously without port conflicts.

```
npm run clone
```
```
✓ Done!

  WordPress:  http://website.localhost:8090
  wp-admin:   http://website.localhost:8090/wp-admin
  MailHog:    http://mailhog.localhost:8090
```

## How it works

1. Starts a shared [Traefik](https://traefik.io/) reverse proxy (port 8090) — once, for all sites
2. Starts a MySQL container isolated to this site
3. Rsyncs WordPress files from the remote server via SSH
4. Exports the remote database with WP-CLI and imports it locally
5. Rewrites `wp-config.php` with local credentials
6. Updates `siteurl` and `home` in `wp_options` to the local URL
7. Builds theme assets if the theme lives in a separate git repo
8. Starts WordPress — routed via Traefik to `<site-slug>.localhost:8090`

Each site runs in its own Docker Compose project (`website-*`, `website2-*`) with its own MySQL volume. Cloning a new site never touches existing ones.

## Prerequisites

- Node.js 18+
- Docker
- SSH access to the remote server
- WP-CLI installed on the remote server

## Setup

```bash
git clone <this-repo>
cd clone-wp-from-server
npm install
cp .env.example .env
```

Edit `.env` with the site you want to clone:

```env
SITE_NAME=Your site

SSH_USER=ssh_user
SSH_HOST=123.456.789.0
SSH_KEY=~/.ssh/id_rsa
WP_PATH=/home/yourserver/webapps/website
```

That's it. Everything else is derived automatically:

| What | How |
|---|---|
| Local URL | `http://website.localhost:8090` (from SITE_NAME) |
| WordPress files | `~/wp-sites/website/` |
| Database name | `website_local` |
| DB credentials | `root / root` (Docker-internal only) |

## Usage

**Clone a site:**
```bash
npm run clone
```

**Switch to a different site:** update `.env` and run `npm run clone` again. Previously cloned sites keep running untouched.

## Theme from a separate git repo

If the theme lives outside the WordPress repo (e.g. a private git repo you're actively developing), add these to `.env`:

```env
THEME_GIT_PATH=/home/user/projects/my-theme
THEME_WP_FOLDER=my-theme
THEME_BUILD_CMD=npm run build
```

The theme folder is excluded from rsync and mounted as a live Docker bind-mount instead. The clone script runs `npm install && <THEME_BUILD_CMD>` automatically since build output (`dist/`) is typically gitignored.

After clone, run your theme's dev watcher directly:
```bash
cd /home/user/projects/my-theme && npm run dev
```

## What gets created

```
~/wp-sites/
  website/          ← WordPress files (rsync'd from server)
  website.yml       ← Docker Compose config for this site
  website2/
  website2.yml
```

Docker volumes (`website_mysql-data`, etc.) persist between clones — re-running `npm run clone` on the same site refreshes files and database.

## Multiple sites simultaneously

Clone as many sites as needed. Traefik routes each by hostname:

```
http://website.localhost:8090    → website WordPress container
http://website2.localhost:8090   → website2 WordPress container
http://mailhog.localhost:8090     → shared MailHog (catches all outgoing email)
```

`*.localhost` resolves to `127.0.0.1` natively in all modern browsers — no `/etc/hosts` changes needed.
