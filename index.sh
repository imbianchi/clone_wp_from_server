#!/bin/bash

# Load environment variables from the .env file
load_env() {
  export $(grep -v '^#' .env | xargs)
}

# Display usage information
usage() {
  echo "Usage: ./index.sh [staging-to-local | prod-to-local]"
  exit 1
}

cleanup() {
  echo "Cleaning up temporary files..."
  rm -f db_backup.sql  # Adjust this if you have other temporary files to clean up
}

# Main script logic
main() {
  load_env
  
  if [ -z "$1" ]; then
    usage
  fi

  case "$1" in
    staging-to-local)
      ./clone.sh "$STAGING_SSH_USER" "$STAGING_SSH_HOST" "$STAGING_WP_PATH" "$LOCAL_WP_PATH" "$STAGING_URL" "$LOCAL_URL" "$LOCAL_DB_NAME" "$LOCAL_DB_USER" "$LOCAL_DB_PASSWORD" "$LOCAL_DB_HOST" "$SSH_KEY"
      ;;
    prod-to-local)
      ./clone.sh "$PROD_SSH_USER" "$PROD_SSH_HOST" "$PROD_WP_PATH" "$LOCAL_WP_PATH" "$PROD_URL" "$LOCAL_URL" "$LOCAL_DB_NAME" "$LOCAL_DB_USER" "$LOCAL_DB_PASSWORD" "$LOCAL_DB_HOST" "$SSH_KEY"
      ;;
    *)
      usage
      ;;
  esac

  cleanup
}

# Execute the main function
main "$@"
