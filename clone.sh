#!/bin/bash

# Import functions from other script files
source ./file_operations.sh
source ./db.sh
source ./wp_config.sh

# Clone the application
clone_app() {
  SSH_USER=$1
  SSH_HOST=$2
  WP_PATH=$3
  LOCAL_PATH=$4
  REMOTE_URL=$5
  LOCAL_URL=$6
  LOCAL_DB_NAME=$7
  LOCAL_DB_USER=$8
  LOCAL_DB_PASSWORD=$9
  LOCAL_DB_HOST=${10}
  SSH_KEY=${11}

  remove_local_wp_directory "$LOCAL_PATH"
  copy_files "$SSH_USER" "$SSH_HOST" "$WP_PATH" "$LOCAL_PATH"
  export_remote_db "$SSH_USER" "$SSH_HOST" "$WP_PATH"

  if ! check_db_exists "$LOCAL_DB_USER" "$LOCAL_DB_PASSWORD" "$LOCAL_DB_HOST" "$LOCAL_DB_NAME"; then
    create_db "$LOCAL_DB_USER" "$LOCAL_DB_PASSWORD" "$LOCAL_DB_HOST" "$LOCAL_DB_NAME"
  else
    echo "Database ${LOCAL_DB_NAME} already exists. Importing into existing database..."
  fi

  import_db "$LOCAL_DB_USER" "$LOCAL_DB_PASSWORD" "$LOCAL_DB_HOST" "$LOCAL_DB_NAME"
  update_siteurl_and_home "$LOCAL_DB_USER" "$LOCAL_DB_PASSWORD" "$LOCAL_DB_HOST" "$LOCAL_DB_NAME" "$LOCAL_URL" "$LOCAL_URL"
  update_wp_config "$LOCAL_PATH" "$LOCAL_DB_NAME" "$LOCAL_DB_USER" "$LOCAL_DB_PASSWORD" "$LOCAL_DB_HOST"

  echo "Cloning complete! Your local WordPress site is ready at ${LOCAL_URL}"
}

# Execute the cloning process with provided arguments
clone_app "$@"
