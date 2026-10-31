#!/usr/bin/env bash

# Creates a dated compressed backup of the project data folder.

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source_dir="$script_dir/citizen_service_data"
backup_dir="$script_dir/backups"
log_file="$backup_dir/backup.log"
timestamp="$(date +%Y%m%d_%H%M%S)"
backup_file="$backup_dir/citizen_data_$timestamp.tar.gz"

mkdir -p "$source_dir" "$backup_dir"

if [[ -z "$(find "$source_dir" -mindepth 1 -print -quit)" ]]; then
  echo "Sample citizen-service data" > "$source_dir/readme.txt"
fi

tar -czf "$backup_file" -C "$source_dir" .
echo "$(date '+%Y-%m-%d %H:%M:%S') | SUCCESS | $backup_file" >> "$log_file"

echo "--- AUTOMATIC BACKUP RESULT ---"
echo "Backup created: $backup_file"
echo "Size: $(du -h "$backup_file" | cut -f1)"
echo "Log updated: $log_file"
