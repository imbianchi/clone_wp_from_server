/** Configuration loaded from .env */
export interface SiteConfig {
    SITE_NAME: string;

    // Remote server access
    SSH_USER: string;
    SSH_HOST: string;
    SSH_KEY: string;
    WP_PATH: string;

    // Theme git repo — optional, only for sites with a separate theme repository
    THEME_GIT_PATH?: string;
    THEME_WP_FOLDER?: string;
    THEME_BUILD_CMD?: string;
}

/** Docker Compose project context for a cloned site */
export interface ComposeContext {
    projectName: string;
    composePath: string;
}
