// src/clone.ts
import { execSync } from 'child_process';
import * as fs from 'fs';
import { updateDatabaseValues, updateWpConfig } from './db';


const checkAndCreateDatabase = async (dbName: string, dbUser: string, dbPassword: string, dbHost: string) => {
    const checkQuery = `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${dbName}'`;
    const createQuery = `CREATE DATABASE ${dbName}`;

    try {
        const exists = execSync(`mysql --user=${dbUser} --password=${dbPassword} --host=${dbHost} -e "${checkQuery}"`, { stdio: 'pipe' });
        if (exists.toString().includes(dbName)) {
            console.log(`Database '${dbName}' already exists.`);
        } else {
            throw new Error('Database does not exist');
        }
    } catch (error) {
        execSync(`mysql --user=${dbUser} --password=${dbPassword} --host=${dbHost} -e "${createQuery}"`);
        console.log(`Database '${dbName}' created successfully.`);
    }
};

// Clone application based on the environment
export const cloneApp = async (env: 'STAGING' | 'PROD') => {
    const SSH_USER = process.env[`${env}_SSH_USER`];
    const SSH_HOST = process.env[`${env}_SSH_HOST`];
    const WP_PATH = process.env[`${env}_WP_PATH`];
    const LOCAL_PATH = process.env.LOCAL_WP_PATH;
    const LOCAL_URL = process.env.LOCAL_URL;
    const LOCAL_DB_NAME = process.env.LOCAL_DB_NAME;
    const LOCAL_DB_USER = process.env.LOCAL_DB_USER;
    const LOCAL_DB_PASSWORD = process.env.LOCAL_DB_PASSWORD;
    const LOCAL_DB_HOST = process.env.LOCAL_DB_HOST;
    const SSH_KEY = process.env.SSH_KEY;

    // Step 1: Remove existing local directory if it exists
    if (LOCAL_PATH && fs.existsSync(LOCAL_PATH)) {
        console.log("Removing existing local WordPress directory...");
        execSync(`rm -rf ${LOCAL_PATH}`);
    }

    // Step 2: Copy files from the remote server
    console.log("Copying files from the remote server...");
    execSync(`rsync -avz -e "ssh -i ${SSH_KEY}" ${SSH_USER}@${SSH_HOST}:${WP_PATH}/ ${LOCAL_PATH}/`);

    // Step 3: Export the remote database
    console.log("Exporting the remote database...");
    execSync(`ssh -i ${SSH_KEY} ${SSH_USER}@${SSH_HOST} "cd ${WP_PATH} && wp db export ${WP_PATH}/db_backup.sql"`);

    // Step 4: Copy the exported database backup to local
    console.log("Copying the exported database backup to local...");
    execSync(`scp -i ${SSH_KEY} ${SSH_USER}@${SSH_HOST}:${WP_PATH}/db_backup.sql ./`);

    // Step 5: Check if the local database exists, and create it if it doesn't
    if (LOCAL_DB_NAME && LOCAL_DB_USER && LOCAL_DB_PASSWORD && LOCAL_DB_HOST) {
        await checkAndCreateDatabase(LOCAL_DB_NAME, LOCAL_DB_USER, LOCAL_DB_PASSWORD, LOCAL_DB_HOST);
    }

    // Step 6: Import the database into the local environment
    console.log("Importing the database...");
    execSync(`mysql --user=${LOCAL_DB_USER} --password=${LOCAL_DB_PASSWORD} --host=${LOCAL_DB_HOST} ${LOCAL_DB_NAME} < db_backup.sql`);

    // Step 7: Update siteurl and home values in the database
    if (LOCAL_DB_NAME && LOCAL_DB_USER && LOCAL_DB_PASSWORD && LOCAL_DB_HOST && LOCAL_URL && LOCAL_PATH) {
        updateDatabaseValues(LOCAL_DB_NAME, LOCAL_DB_USER, LOCAL_DB_PASSWORD, LOCAL_DB_HOST, LOCAL_URL);
        updateWpConfig(LOCAL_PATH, LOCAL_DB_NAME, LOCAL_DB_USER, LOCAL_DB_PASSWORD, LOCAL_DB_HOST);
    } else {
        console.log("One or more environment variables are undefined.");
    }

    // Clean up
    console.log("Cleaning up temporary files...");
    execSync(`rm db_backup.sql`);

    console.log(`Cloning complete! Your local WordPress site is ready at ${LOCAL_URL}`);
};
