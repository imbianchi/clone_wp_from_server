import * as dotenv from 'dotenv';
import { SiteConfig } from './types';
import { cloneToDocker } from './clone';

const REQUIRED_FIELDS: (keyof SiteConfig)[] = [
    'SITE_NAME',
    'SSH_USER', 'SSH_HOST', 'SSH_KEY', 'WP_PATH',
];

const loadConfig = (): SiteConfig => {
    dotenv.config();

    const missing = REQUIRED_FIELDS.filter(key => !process.env[key]);
    if (missing.length > 0) {
        console.error('\nMissing required fields in .env:');
        missing.forEach(key => console.error(`  ${key}`));
        console.error('\nCopy .env.example to .env and fill in the values.\n');
        process.exit(1);
    }

    return process.env as unknown as SiteConfig;
};

cloneToDocker(loadConfig());
