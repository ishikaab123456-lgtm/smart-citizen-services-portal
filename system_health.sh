#!/usr/bin/env bash

# Checks CPU, memory and disk health using standard Linux commands.

set -u

cpu_used=$(top -bn1 | awk '/Cpu\(s\)/ {print 100 - $8; exit}')
memory_used=$(free | awk '/Mem:/ {printf "%.1f", ($3/$2)*100}')
disk_used=$(df -P / | awk 'NR==2 {gsub("%", "", $5); print $5}')
load_average=$(awk '{print $1", "$2", "$3}' /proc/loadavg)

echo "--- SYSTEM HEALTH REPORT ---"
echo "Generated       : $(date)"
printf "CPU used        : %.1f%%\n" "${cpu_used:-0}"
echo "Memory used     : ${memory_used:-0}%"
echo "Root disk used  : ${disk_used:-0}%"
echo "Load averages   : $load_average"
echo

status="HEALTHY"
awk -v value="${cpu_used:-0}" 'BEGIN {exit !(value >= 80)}' && { echo "Warning: CPU usage is high."; status="ATTENTION"; }
awk -v value="${memory_used:-0}" 'BEGIN {exit !(value >= 80)}' && { echo "Warning: Memory usage is high."; status="ATTENTION"; }
if [[ ${disk_used:-0} -ge 85 ]]; then
  echo "Warning: Disk usage is high. Run backup and cleanup."
  status="ATTENTION"
fi

echo "Overall status  : $status"
