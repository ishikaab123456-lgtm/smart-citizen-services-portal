# Smart Citizen Services Portal with OS Resource Management Simulator

Student: Ishika Agarwal  
ERP ID: 0251CSML282  
Branch: CSE (AIML)

## 1. Project idea

A municipality provides permits, certificates and grievance services online. When many citizens use the portal together, requests wait for CPU time, memory, database connections and disk access. This project demonstrates how Operating System concepts can manage that workload.

The citizen portal is a small academic interface. The main project is the OS simulator.

## 2. What is included

- Citizen request form, tracking and admin queue
- FCFS, SJF, SRTF, Priority, Round Robin, Multilevel Queue and MLFQ scheduling
- Gantt chart and scheduling performance values
- Producer-Consumer and semaphore/mutex demonstration
- Banker's Algorithm and safe-sequence calculation
- FIFO, LRU, Optimal and LFU page replacement
- FCFS, SSTF, SCAN, C-SCAN and LOOK disk scheduling
- System-health dashboard
- Five Linux shell scripts
- Eight ready-to-use architecture diagrams in PNG and SVG formats
- Sample datasets and algorithm tests

## 3. How to run the website on Windows

1. Extract the project ZIP.
2. Open the `dist` folder.
3. Double-click `index.html`.
4. The project opens in Chrome, Edge or Firefox.

No Python installation is required for the website.

If the browser blocks local files, open Command Prompt inside the project folder and run:

```text
python -m http.server 8000 --directory dist
```

Then open `http://localhost:8000`.

## 4. Demonstration order

1. Open Dashboard and explain the request queue.
2. Open Citizen Portal and submit one Grievance request.
3. Copy the generated request ID and track it.
4. Use `Process next request` to show priority handling.
5. Open CPU Scheduling and run Round Robin.
6. Change the algorithm to FCFS, SJF, SRTF and Priority.
7. Open Synchronization and select `Run complete demo`.
8. Open Deadlock and calculate the safe sequence.
9. Open Memory and compare all four algorithms.
10. Open Disk and compare all five algorithms.
11. Open Monitor and explain the load values.

## 5. How to run the Linux scripts

Use Ubuntu, Linux or Windows Subsystem for Linux (WSL).

```bash
cd linux_scripts
chmod +x *.sh
./file_management.sh
./user_management.sh
./process_monitor.sh
./automatic_backup.sh
./system_health.sh
```

The user-management script only reads account information by default. Do not use its optional `--create` command unless your teacher asks for a real Linux account.

## 6. How to run the algorithm tests

Node.js is only required for testing, not for using the website.

```text
npm test
```

The tests check sample answers for CPU scheduling, Banker's Algorithm, page replacement and disk scheduling.

## 7. Important project limitation

This is an educational prototype using sample data stored in the browser. It does not connect to Aadhaar, a payment gateway or a real municipality database. Actual deployment would need server authentication, encryption, audit logs, backups and privacy controls.

## 8. Before submitting

- Add your roll number if required.
- Replace at least two sample citizen names and requests with your own examples.
- Run every module and take screenshots on your own system.
- Read `HOW_TO_EXPLAIN_IN_VIVA.md`.
- Follow your college's rule for acknowledging AI assistance.
