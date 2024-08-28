#!/bin/bash

# Remove existing local WordPress directory if it exists
remove_local_wp_directory() {
  if [ -d "$1" ]; then
    echo "Removing existing local WordPress directory..."
    sudo rm -rf "$1"
  fi
}

# Copy files from the remote server
copy_files() {
  echo "Copying files from the remote server..."
  rsync -avz -e "ssh -i $11" "$1@$2:$3/" "$4/"
}
