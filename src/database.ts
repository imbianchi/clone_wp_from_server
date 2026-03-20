import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { ComposeContext } from './types';
import { MYSQL_MAX_RETRIES, MYSQL_RETRY_INTERVAL_S, LOCAL_DB_USER, LOCAL_DB_PASSWORD, LOCAL_DB_HOST } from './constants';
import { siteExec } from './docker';

const mysql = (ctx: ComposeContext, args: string): string =>
    siteExec(ctx, 'mysql', `mysql -u${LOCAL_DB_USER} -p${LOCAL_DB_PASSWORD} ${args}`);

/** Polls until MySQL accepts connections inside the container, or throws after max retries */
export const waitForMySQL = (ctx: ComposeContext): void => {
    process.stdout.write('Waiting for MySQL');

    for (let i = 0; i < MYSQL_MAX_RETRIES; i++) {
        try {
            execSync(
                siteExec(ctx, 'mysql', `mysqladmin ping -u${LOCAL_DB_USER} -p${LOCAL_DB_PASSWORD} 2>/dev/null`),
                { stdio: 'pipe' }
            );
            process.stdout.write(' ready.\n');
            return;
        } catch {
            process.stdout.write('.');
            execSync(`sleep ${MYSQL_RETRY_INTERVAL_S}`);
        }
    }

    throw new Error('MySQL did not become ready in time.');
};

export const createDatabase = (ctx: ComposeContext, dbName: string): void => {
    execSync(mysql(ctx, `-e "CREATE DATABASE IF NOT EXISTS ${dbName};"`), { stdio: 'inherit' });
};

export const importDatabase = (ctx: ComposeContext, dbName: string, sqlFile: string): void => {
    execSync(`${mysql(ctx, dbName)} < ${sqlFile}`, { stdio: 'inherit' });
};

export const updateSiteUrls = (ctx: ComposeContext, dbName: string, siteUrl: string): void => {
    execSync(
        mysql(ctx, `${dbName} -e "UPDATE wp_options SET option_value='${siteUrl}' WHERE option_name IN ('siteurl', 'home');"`),
        { stdio: 'inherit' }
    );
};

/**
 * Updates wp-config.php with local DB credentials and enables WP_DEBUG.
 * Both operations are done in a single read/write pass.
 * Note: DB_HOST must be the Docker service name ('mysql'), not 127.0.0.1.
 */
export const configureWpForLocal = (wpPath: string, dbName: string): void => {
    const configPath = path.join(wpPath, 'wp-config.php');

    if (!fs.existsSync(configPath)) {
        throw new Error(`wp-config.php not found at ${configPath}`);
    }

    let content = fs.readFileSync(configPath, 'utf8');

    content = content
        .replace(/('DB_NAME',\s*')(.*?)(')/, `$1${dbName}$3`)
        .replace(/('DB_USER',\s*')(.*?)(')/, `$1${LOCAL_DB_USER}$3`)
        .replace(/('DB_PASSWORD',\s*')(.*?)(')/, `$1${LOCAL_DB_PASSWORD}$3`)
        .replace(/('DB_HOST',\s*')(.*?)(')/, `$1${LOCAL_DB_HOST}$3`);

    content = content.replace(
        /define\(\s*'WP_DEBUG',\s*false\s*\)/,
        "define('WP_DEBUG', true)"
    );

    if (!content.includes('WP_DEBUG_LOG')) {
        content = content.replace(
            "define('WP_DEBUG', true)",
            "define('WP_DEBUG', true);\ndefine('WP_DEBUG_LOG', true);\ndefine('WP_DEBUG_DISPLAY', false)"
        );
    }

    fs.writeFileSync(configPath, content, 'utf8');
};
