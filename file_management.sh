#!/usr/bin/env bash

# Creates a safe sample file structure inside this project folder.

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
data_dir="$script_dir/citizen_service_data"

mkdir -p "$data_dir/permits" "$data_dir/certificates" "$data_dir/grievances" "$data_dir/logs" "$data_dir/temp"

touch "$data_dir/permits/permit_requests.txt"
touch "$data_dir/certificates/certificate_requests.txt"
touch "$data_dir/grievances/grievance_requests.txt"

find "$data_dir/temp" -type f -mtime +1 -delete

echo "--- FILE MANAGEMENT RESULT ---"
echo "Project data directory: $data_dir"
echo "Temporary files older than one day were removed."
echo
find "$data_dir" -maxdepth 2 -printf "%y %p\n" | sort
