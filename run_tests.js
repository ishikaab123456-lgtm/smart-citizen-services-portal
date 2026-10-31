const assert = require("node:assert/strict");
const os = require("../dist/algorithms.js");

const processes = [
  { id: "P1", arrival: 0, burst: 5, priority: 2, queue: "high" },
  { id: "P2", arrival: 1, burst: 8, priority: 4, queue: "normal" },
  { id: "P3", arrival: 2, burst: 3, priority: 1, queue: "high" },
  { id: "P4", arrival: 3, burst: 4, priority: 1, queue: "normal" },
  { id: "P5", arrival: 5, burst: 7, priority: 5, queue: "background" }
];

function close(actual, expected, label) {
  assert.ok(Math.abs(actual - expected) < 0.0001, `${label}: expected ${expected}, received ${actual}`);
}

close(os.schedule("FCFS", processes, 3).averages.waiting, 8.6, "FCFS waiting");
close(os.schedule("SJF", processes, 3).averages.waiting, 6.6, "SJF waiting");
close(os.schedule("SRTF", processes, 3).averages.waiting, 6.6, "SRTF waiting");
close(os.schedule("PRIORITY", processes, 3).averages.waiting, 6.8, "Priority waiting");
close(os.schedule("RR", processes, 3).averages.waiting, 11.8, "RR waiting");

const refs = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2];
assert.equal(os.pageReplacement("FIFO", refs, 3).faults, 10);
assert.equal(os.pageReplacement("LRU", refs, 3).faults, 9);
assert.equal(os.pageReplacement("Optimal", refs, 3).faults, 7);
assert.equal(os.pageReplacement("LFU", refs, 3).faults, 8);

const allocation = [[0,1,0],[2,0,0],[3,0,2],[2,1,1],[0,0,2]];
const maximum = [[7,5,3],[3,2,2],[9,0,2],[2,2,2],[4,3,3]];
const banker = os.bankersAlgorithm(allocation, maximum, [3,3,2]);
assert.equal(banker.safe, true);
assert.deepEqual(banker.sequence, ["P1", "P3", "P4", "P0", "P2"]);

const diskQueue = [98,183,37,122,14,124,65,67];
assert.equal(os.diskScheduling("FCFS", diskQueue, 53, 199).totalMovement, 640);
assert.equal(os.diskScheduling("SSTF", diskQueue, 53, 199).totalMovement, 236);
assert.equal(os.diskScheduling("SCAN", diskQueue, 53, 199).totalMovement, 331);
assert.equal(os.diskScheduling("C-SCAN", diskQueue, 53, 199).totalMovement, 382);
assert.equal(os.diskScheduling("LOOK", diskQueue, 53, 199).totalMovement, 299);

console.log("All OS algorithm tests passed.");
