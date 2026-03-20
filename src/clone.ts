import { execSync, exec } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { SiteConfig, ComposeContext } from './types';
import { ensureInfraRunning, generateSiteCompose, siteComposePath, startSiteService, startSiteAll } from './docker';
import { waitForMySQL, createDatabase, importDatabase, updateSiteUrls, configureWpForLocal } from './database';
import { TRAEFIK_PORT } from './constants';

const TOTAL_STEPS = 9;
const step = (n: number, msg: string) => console.log(`\n[${n}/${TOTAL_STEPS}] ${msg}`);

const buildTheme = (config: SiteConfig): void => {
    if (!config.THEME_GIT_PATH || !config.THEME_BUILD_CMD) return;
    // Theme assets (dist/) are gitignored — must be compiled locally after clone
    execSync(`cd ${config.THEME_GIT_PATH} && npm install --silent && ${config.THEME_BUILD_CMD}`, { stdio: 'inherit' });
};

export const cloneToDocker = (config: SiteConfig): void => {
    const { SSH_USER, SSH_HOST, SSH_KEY, WP_PATH } = config;

    const siteSlug    = config.SITE_NAME.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const localWpPath = path.join(os.homedir(), 'wp-sites', siteSlug);
    const localDbName = siteSlug.replace(/-/g, '_') + '_local';
    const localUrl    = `http://${siteSlug}.localhost:${TRAEFIK_PORT}`;

    const ctx: ComposeContext = {
        projectName: siteSlug,
        composePath: siteComposePath(siteSlug),
    };

    const themeExclude = config.THEME_WP_FOLDER
        ? `--exclude='wp-content/themes/${config.THEME_WP_FOLDER}'`
        : '';

    console.log(`\nCloning [${config.SITE_NAME}]`);
    console.log(`  ${SSH_USER}@${SSH_HOST}:${WP_PATH} → ${localWpPath}`);

    step(1, 'Starting MySQL container...');
    ensureInfraRunning();
    generateSiteCompose(config, siteSlug, localWpPath, localDbName);
    startSiteService(ctx, 'mysql');
    waitForMySQL(ctx);

    step(2, 'Syncing WordPress files from server...');
    fs.rmSync(localWpPath, { recursive: true, force: true });
    fs.mkdirSync(localWpPath, { recursive: true });
    execSync(`rsync -az ${themeExclude} -e "ssh -i ${SSH_KEY}" ${SSH_USER}@${SSH_HOST}:${WP_PATH}/ ${localWpPath}/`, { stdio: 'inherit' });

    step(3, 'Exporting remote database...');
    execSync(`ssh -i ${SSH_KEY} ${SSH_USER}@${SSH_HOST} "cd ${WP_PATH} && wp db export ${WP_PATH}/db_backup.sql"`);
    execSync(`scp -i ${SSH_KEY} ${SSH_USER}@${SSH_HOST}:${WP_PATH}/db_backup.sql ./db_backup.sql`);

    step(4, 'Importing database...');
    createDatabase(ctx, localDbName);
    importDatabase(ctx, localDbName, path.resolve('./db_backup.sql'));

    step(5, 'Configuring wp-config.php...');
    configureWpForLocal(localWpPath, localDbName);

    step(6, 'Updating site URLs...');
    updateSiteUrls(ctx, localDbName, localUrl);

    step(7, 'Building theme assets...');
    buildTheme(config);

    step(8, 'Cleaning up...');
    execSync('rm -f db_backup.sql');
    execSync(`ssh -i ${SSH_KEY} ${SSH_USER}@${SSH_HOST} "rm -f ${WP_PATH}/db_backup.sql"`);

    step(9, 'Starting containers...');
    startSiteAll(ctx);

    const openCmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
    exec(`${openCmd} ${localUrl}`);

    console.log(`
✓ Done! [${config.SITE_NAME}]

  WordPress:  ${localUrl}
  wp-admin:   ${localUrl}/wp-admin
  MailHog:    http://mailhog.localhost:${TRAEFIK_PORT}
${config.THEME_GIT_PATH ? `\n  Theme: cd ${config.THEME_GIT_PATH} && npm run dev` : ''}
`);
};
