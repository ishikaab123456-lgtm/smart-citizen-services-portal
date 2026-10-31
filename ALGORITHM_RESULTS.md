# Verified Sample Results

These values are generated from the sample data in the project and are checked by the automated tests.

## CPU scheduling comparison

| Algorithm | Average waiting | Average turnaround | Average response | Throughput |
|---|---:|---:|---:|---:|
| FCFS | 8.6 | 14.0 | 8.6 | 0.185 |
| SJF | 6.6 | 12.0 | 6.6 | 0.185 |
| SRTF | 6.6 | 12.0 | 6.6 | 0.185 |
| Priority | 6.8 | 12.2 | 6.8 | 0.185 |
| Round Robin, q = 3 | 11.8 | 17.2 | 4.2 | 0.185 |
| Multilevel Queue | 8.4 | 13.8 | 6.0 | 0.185 |
| Multilevel Feedback Queue | 13.2 | 18.6 | 1.8 | 0.185 |

### Interpretation

- SJF and SRTF give the lowest average waiting time for this sample.
- Round Robin gives a better average response time than FCFS.
- Multilevel Queue separates urgent, normal and background work.
- The recommended portal policy combines priority queues with Round Robin and aging.

## Page-replacement comparison

Reference string: `7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2`  
Frames: `3`

| Algorithm | Page faults | Page hits |
|---|---:|---:|
| FIFO | 10 | 3 |
| LRU | 9 | 4 |
| Optimal | 7 | 6 |
| LFU | 8 | 5 |

Optimal has the fewest faults, but LRU is more practical because future requests are not normally known.

## Disk-scheduling comparison

Initial head: `53`  
Queue: `98, 183, 37, 122, 14, 124, 65, 67`  
Range: `0–199`, direction upward

| Algorithm | Total head movement |
|---|---:|
| FCFS | 640 cylinders |
| SSTF | 236 cylinders |
| SCAN | 331 cylinders |
| C-SCAN | 382 cylinders |
| LOOK | 299 cylinders |

SSTF gives the least movement in this sample. LOOK is a balanced recommendation because it avoids unnecessary movement to a disk boundary.

## Banker’s Algorithm

Available vector: `(3, 3, 2)`  
Verified safe sequence: `P1 → P3 → P4 → P0 → P2`

The existence of this sequence shows that the sample system is in a safe state.
