#!/bin/bash

# Check if the provided database exists
check_db_exists() {
  DB_EXISTS=$(mysql --user="$1" --password="$2" --host="$3" -e "SHOW DATABASES LIKE '$4';" | grep "$4" > /dev/null; echo "$?")
  return $DB_EXISTS
}

# Create local database if it doesn't exist
create_db() {
  echo "Creating local database $4..."
  mysql --user="$1" --password="$2" --host="$3" -e "CREATE DATABASE $4;"
}

# Import database into local environment
import_db() {
  echo "Importing the database..."
  mysql --user="$1" --password="$2" --host="$3" "$4" < db_backup.sql
}

# Export remote database
export_remote_db() {
  echo "Exporting the remote database..."
  ssh -i "$11" "$1"@"$2" "cd $3 && wp db export ${3}/db_backup.sql"
  scp -i "$11" "$1"@"$2":"$3/db_backup.sql" ./
}

# Update siteurl and home in the wp_options table
update_siteurl_and_home() {
  local db_user="$1"
  local db_password="$2"
  local db_host="$3"
  local db_name="$4"
  local new_siteurl="$5"
  local new_home="$6"

  echo "Updating siteurl and home in the wp_options table..."
  
  mysql --user="$db_user" --password="$db_password" --host="$db_host" "$db_name" -e "
    UPDATE wp_options SET option_value = '$new_siteurl' WHERE option_name IN ('siteurl', 'home');
  "

  if [ $? -eq 0 ]; then
    echo "Successfully updated siteurl and home."
  else
    echo "Failed to update siteurl and home."
  fi
}
