import { loadEnv } from './utils';
import { cloneApp } from './clone';

const main = () => {
    loadEnv();

    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error("Usage: ts-node index.ts [staging-to-local | prod-to-local]");
        process.exit(1);
    }

    switch (args[0]) {
        case 'staging-to-local':
            cloneApp('STAGING');
            break;
        case 'prod-to-local':
            cloneApp('PROD');
            break;
        default:
            console.error("Invalid option. Use one of: staging-to-local, prod-to-local.");
    }
};

main();
