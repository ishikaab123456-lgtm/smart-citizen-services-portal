#!/usr/bin/env bash

# Displays process information useful for a portal administrator.

set -u

echo "--- PROCESS MONITOR ---"
echo "Date: $(date)"
echo "System uptime: $(uptime -p 2>/dev/null || uptime)"
echo
echo "Top five processes by CPU usage:"
cpu_processes=$(ps -eo pid,comm,%cpu,%mem --sort=-%cpu 2>/dev/null | head -n 6 || true)
if [[ -n "$cpu_processes" ]]; then
  echo "$cpu_processes"
else
  top -bn1 2>/dev/null | head -n 12 || echo "Process details are unavailable in this environment."
fi
echo
echo "Top five processes by memory usage:"
memory_processes=$(ps -eo pid,comm,%cpu,%mem --sort=-%mem 2>/dev/null | head -n 6 || true)
if [[ -n "$memory_processes" ]]; then
  echo "$memory_processes"
else
  echo "Use the 'top' command to inspect live memory usage."
fi
echo
process_count=$(find /proc -maxdepth 1 -type d -name '[0-9]*' 2>/dev/null | wc -l | tr -d ' ')
echo "Total running processes: $process_count"

if pgrep -f "[p]ython.*http.server" >/dev/null 2>&1; then
  echo "Portal demo server status: RUNNING"
else
  echo "Portal demo server status: NOT RUNNING"
fi
