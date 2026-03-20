import * as path from 'path';

export const TRAEFIK_COMPOSE_FILE = path.resolve(__dirname, '..', 'traefik.yml');
export const TRAEFIK_NETWORK      = 'wp-local';
export const TRAEFIK_PORT         = '8090';

export const MYSQL_MAX_RETRIES      = 24;
export const MYSQL_RETRY_INTERVAL_S = 2;

// Local DB credentials — fixed for all sites (Docker-internal only, never exposed to host)
export const LOCAL_DB_USER     = 'root';
export const LOCAL_DB_PASSWORD = 'root';
export const LOCAL_DB_HOST     = 'mysql'; // Docker service name
