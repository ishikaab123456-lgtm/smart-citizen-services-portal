#!/usr/bin/env bash

# Smart Citizen Services Portal - user management
# Run normally to view account information.
# Creating a Linux account is optional and needs administrator permission.

set -u

show_summary() {
  echo "--- USER MANAGEMENT SUMMARY ---"
  echo "Current user : $(whoami)"
  echo "User ID      : $(id -u)"
  echo "Group ID     : $(id -g)"
  echo "Login shell  : ${SHELL:-Not available}"
  echo
  echo "Currently logged-in users:"
  who || true
}

list_service_accounts() {
  echo
  echo "First 10 regular Linux accounts:"
  awk -F: '$3 >= 1000 && $1 != "nobody" {print $1 " (UID " $3 ")"}' /etc/passwd | head -n 10
}

check_account() {
  local account_name="$1"
  if id "$account_name" >/dev/null 2>&1; then
    echo "Account '$account_name' exists."
    id "$account_name"
  else
    echo "Account '$account_name' does not exist."
  fi
}

create_account() {
  local account_name="$1"
  if [[ ! "$account_name" =~ ^[a-z_][a-z0-9_-]*$ ]]; then
    echo "Use a simple lowercase Linux username."
    return 1
  fi
  if [[ $(id -u) -ne 0 ]]; then
    echo "Creation skipped: run with sudo only if your teacher asks for a real account."
    return 1
  fi
  if id "$account_name" >/dev/null 2>&1; then
    echo "Account already exists."
  else
    useradd --create-home --shell /bin/bash "$account_name"
    echo "Created account: $account_name"
  fi
}

show_summary
list_service_accounts

case "${1:-}" in
  --check)
    [[ -n "${2:-}" ]] && check_account "$2" || echo "Usage: $0 --check username"
    ;;
  --create)
    [[ -n "${2:-}" ]] && create_account "$2" || echo "Usage: sudo $0 --create username"
    ;;
  "")
    echo
    echo "Optional commands:"
    echo "  $0 --check username"
    echo "  sudo $0 --create username"
    ;;
  *)
    echo "Unknown option. Use --check or --create."
    exit 1
    ;;
esac
