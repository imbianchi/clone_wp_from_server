#!/bin/bash

# Update wp-config.php for local settings
update_wp_config() {
  echo "Updating wp-config.php for local settings..."
  sed -i "s/'DB_NAME', '.*'/'DB_NAME', '$2'/" "$1/wp-config.php"
  sed -i "s/'DB_USER', '.*'/'DB_USER', '$3'/" "$1/wp-config.php"
  sed -i "s/'DB_PASSWORD', '.*'/'DB_PASSWORD', '$4'/" "$1/wp-config.php"
  sed -i "s/'DB_HOST', '.*'/'DB_HOST', '$5'/" "$1/wp-config.php"
}
