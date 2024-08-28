import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export const updateDatabaseValues = (dbName: string, dbUser: string, dbPassword: string, dbHost: string, localUrl: string) => {
    console.log("Updating siteurl and home in the database...");
    execSync(`mysql --user=${dbUser} --password=${dbPassword} --host=${dbHost} ${dbName} -e "UPDATE wp_options SET option_value='${localUrl}' WHERE option_name IN ('siteurl', 'home');"`);
};

export const updateWpConfig = (localPath: string, dbName: string, dbUser: string, dbPassword: string, dbHost: string) => {
    const wpConfigPath = path.join(localPath, 'wp-config.php');

    if (!fs.existsSync(wpConfigPath)) {
        console.log("wp-config.php file not found.");
        return;
    }

    console.log("Updating wp-config.php for local settings...");

    // Read the current content of wp-config.php
    let configContent = fs.readFileSync(wpConfigPath, 'utf8');

    // Update the database credentials using regular expressions
    configContent = configContent.replace(/('DB_NAME', ')(.*?)(')/, `$1${dbName}$3`);
    configContent = configContent.replace(/('DB_USER', ')(.*?)(')/, `$1${dbUser}$3`);
    configContent = configContent.replace(/('DB_PASSWORD', ')(.*?)(')/, `$1${dbPassword}$3`);
    configContent = configContent.replace(/('DB_HOST', ')(.*?)(')/, `$1${dbHost}$3`);

    // Write the updated content back to wp-config.php
    fs.writeFileSync(wpConfigPath, configContent, 'utf8');

    console.log("wp-config.php updated successfully.");
};