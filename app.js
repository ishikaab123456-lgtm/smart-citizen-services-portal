"use strict";

const app = document.querySelector("#app");
const navButtons = [...document.querySelectorAll(".nav-button")];
const STORAGE_KEY = "smartCitizenRequestsV1";
const USER_KEY = "smartCitizenDemoUserV1";

const templates = {
  dashboard: "dashboard-template",
  portal: "portal-template",
  scheduling: "scheduling-template",
  concurrency: "concurrency-template",
  deadlock: "deadlock-template",
  memory: "memory-template",
  disk: "disk-template",
  monitor: "monitor-template"
};

const seedRequests = [
  { id: "CSR-1001", name: "Rohan Verma", mobile: "9876543210", service: "Permit", priority: 3, description: "Shop signage permit", status: "Completed", created: "01 Sep 2026" },
  { id: "CSR-1002", name: "Meena Gupta", mobile: "9812345678", service: "Certificate", priority: 2, description: "Birth certificate copy", status: "Processing", created: "02 Sep 2026" },
  { id: "CSR-1003", name: "Arun Kumar", mobile: "9898989898", service: "Grievance", priority: 1, description: "Streetlight not working", status: "Submitted", created: "03 Sep 2026" },
  { id: "CSR-1004", name: "Nisha Singh", mobile: "9765432109", service: "Permit", priority: 3, description: "Temporary event permit", status: "Submitted", created: "03 Sep 2026" }
];

let concurrencyQueue = [];
let producedCount = 0;

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function safe(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}
function byId(id) { return document.getElementById(id); }
function getRequests() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedRequests));
    return clone(seedRequests);
  }
  try { return JSON.parse(saved); } catch { return clone(seedRequests); }
}
function saveRequests(items) { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
function priorityLabel(value) { return Number(value) === 1 ? "Urgent" : Number(value) === 2 ? "Important" : "Normal"; }
function badge(text) { return `<span class="badge ${safe(text).toLowerCase().replace(/\s+/g, "-")}">${safe(text)}</span>`; }
function numberList(value) {
  const values = String(value).split(/[\s,]+/).filter(Boolean).map(Number);
  if (!values.length || values.some((n) => !Number.isFinite(n))) throw new Error("Please enter valid numbers.");
  return values;
}
function matrix(value) {
  const rows = String(value).trim().split(/\n+/).map((row) => numberList(row));
  if (!rows.length) throw new Error("Matrix cannot be empty.");
  return rows;
}
function metricCard(label, value, note) {
  return `<article class="metric-card"><span class="metric-label">${safe(label)}</span><strong class="metric-value">${safe(value)}</strong><span class="metric-note">${safe(note)}</span></article>`;
}
function format(value) { return Number(value).toFixed(2).replace(/\.00$/, ""); }

function openView(view, updateHash = true) {
  const selected = templates[view] ? view : "dashboard";
  const template = byId(templates[selected]);
  app.replaceChildren(template.content.cloneNode(true));
  navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === selected));
  if (updateHash) history.replaceState(null, "", `#${selected}`);
  initialiseView(selected);
  app.focus({ preventScroll: true });
}

function initialiseView(view) {
  if (view === "dashboard") initDashboard();
  if (view === "portal") initPortal();
  if (view === "scheduling") initScheduling();
  if (view === "concurrency") initConcurrency();
  if (view === "deadlock") initDeadlock();
  if (view === "memory") initMemory();
  if (view === "disk") initDisk();
  if (view === "monitor") initMonitor();
  document.querySelectorAll("[data-open-view]").forEach((button) => button.addEventListener("click", () => openView(button.dataset.openView)));
}

function initDashboard() {
  const requests = getRequests();
  const completed = requests.filter((r) => r.status === "Completed").length;
  const urgent = requests.filter((r) => Number(r.priority) === 1 && r.status !== "Completed").length;
  byId("dashboard-metrics").innerHTML = [
    metricCard("Total requests", requests.length, "stored in local queue"),
    metricCard("Waiting", requests.filter((r) => r.status === "Submitted").length, "ready for scheduling"),
    metricCard("Completed", completed, "service output available"),
    metricCard("Urgent", urgent, "high-priority grievances")
  ].join("");
  byId("recent-requests").innerHTML = [...requests].reverse().slice(0, 6).map((r) => `<tr><td>${safe(r.id)}</td><td>${safe(r.service)}</td><td>${badge(priorityLabel(r.priority))}</td><td>${badge(r.status)}</td></tr>`).join("");
  byId("reset-demo").addEventListener("click", () => {
    saveRequests(clone(seedRequests));
    localStorage.removeItem(USER_KEY);
    initDashboard();
  });
}

function initPortal() {
  renderAdminTable();
  byId("request-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const requests = getRequests();
    const nextNumber = Math.max(1000, ...requests.map((r) => Number(r.id.split("-")[1]) || 1000)) + 1;
    const item = {
      id: `CSR-${nextNumber}`,
      name: byId("citizen-name").value.trim(),
      mobile: byId("citizen-mobile").value.trim(),
      service: byId("service-type").value,
      priority: Number(byId("request-priority").value),
      description: byId("request-description").value.trim(),
      status: "Submitted",
      created: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    };
    requests.push(item);
    saveRequests(requests);
    event.target.reset();
    byId("request-message").textContent = `Request submitted successfully. Your request ID is ${item.id}.`;
    byId("track-id").value = item.id;
    renderAdminTable();
  });
  byId("track-button").addEventListener("click", trackRequest);
  byId("track-id").addEventListener("keydown", (event) => { if (event.key === "Enter") trackRequest(); });
  byId("login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const email = byId("login-email").value.trim().toLowerCase();
    localStorage.setItem(USER_KEY, JSON.stringify({ email }));
    byId("login-message").textContent = `Local demo account is active for ${email}.`;
  });
  byId("advance-status").addEventListener("click", () => {
    const requests = getRequests();
    const priorityOrder = [...requests]
      .filter((r) => r.status !== "Completed")
      .sort((a, b) => Number(a.priority) - Number(b.priority) || Number(a.id.split("-")[1]) - Number(b.id.split("-")[1]));
    if (!priorityOrder.length) return;
    const selected = requests.find((r) => r.id === priorityOrder[0].id);
    selected.status = selected.status === "Submitted" ? "Processing" : "Completed";
    saveRequests(requests);
    renderAdminTable();
  });
}

function trackRequest() {
  const id = byId("track-id").value.trim().toUpperCase();
  const item = getRequests().find((r) => r.id === id);
  byId("track-result").innerHTML = item
    ? `<strong>${safe(item.id)} · ${safe(item.service)}</strong><p>${safe(item.description)}</p>${badge(item.status)} ${badge(priorityLabel(item.priority))}`
    : `<strong>Request not found.</strong><p>Check the ID and try again.</p>`;
}

function renderAdminTable() {
  const target = byId("admin-requests");
  if (!target) return;
  target.innerHTML = getRequests().sort((a, b) => Number(a.priority) - Number(b.priority)).map((r) => `<tr><td>${safe(r.id)}</td><td>${safe(r.name)}</td><td>${safe(r.service)}</td><td>${badge(priorityLabel(r.priority))}</td><td>${badge(r.status)}</td><td>${safe(r.created)}</td></tr>`).join("");
}

function parseProcesses() {
  return byId("process-input").value.trim().split(/\n+/).map((line) => {
    const [id, arrival, burst, priority, queue = "normal"] = line.split(",").map((part) => part.trim());
    return { id, arrival: Number(arrival), burst: Number(burst), priority: Number(priority), queue };
  });
}

function initScheduling() {
  byId("run-scheduling").addEventListener("click", runScheduling);
  runScheduling();
}

function runScheduling() {
  try {
    const algorithm = byId("schedule-algorithm").value;
    const result = OSAlgorithms.schedule(algorithm, parseProcesses(), Number(byId("time-quantum").value));
    const names = { PRIORITY: "Priority Scheduling", RR: "Round Robin", MLQ: "Multilevel Queue", MLFQ: "Multilevel Feedback Queue" };
    byId("schedule-title").textContent = names[algorithm] || algorithm;
    byId("throughput-pill").textContent = `Throughput ${result.throughput.toFixed(3)} process/unit`;
    byId("gantt-chart").innerHTML = result.timeline.map((block) => `<div class="gantt-block ${block.id === "Idle" ? "idle" : ""}" style="flex-grow:${Math.max(1, block.end - block.start)}"><span>${safe(block.id)}</span><span class="gantt-time">${block.start}</span><span class="gantt-end">${block.end}</span></div>`).join("");
    byId("schedule-metrics").innerHTML = [
      metricCard("Average waiting", format(result.averages.waiting), "time units"),
      metricCard("Average turnaround", format(result.averages.turnaround), "time units"),
      metricCard("Average response", format(result.averages.response), "time units")
    ].join("");
    byId("schedule-table").innerHTML = result.rows.map((row) => `<tr><td>${safe(row.id)}</td><td>${row.completion}</td><td>${row.turnaround}</td><td>${row.waiting}</td><td>${row.response}</td></tr>`).join("");
  } catch (error) {
    byId("schedule-title").textContent = error.message;
  }
}

function initConcurrency() {
  concurrencyQueue = [];
  producedCount = 0;
  renderQueue();
  addConcurrencyLog("Semaphore initialized: empty = 5, full = 0, mutex = 1.");
  byId("produce-request").addEventListener("click", produceRequest);
  byId("consume-request").addEventListener("click", consumeRequest);
  byId("auto-concurrency").addEventListener("click", async () => {
    byId("auto-concurrency").disabled = true;
    for (let i = 0; i < 4; i += 1) { produceRequest(); await pause(220); }
    for (let i = 0; i < 3; i += 1) { consumeRequest(); await pause(260); }
    byId("auto-concurrency").disabled = false;
  });
}

function pause(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function addConcurrencyLog(text) {
  const item = document.createElement("li");
  item.textContent = text;
  byId("concurrency-log").append(item);
  item.scrollIntoView({ block: "nearest" });
}
function renderQueue() {
  byId("queue-visual").innerHTML = Array.from({ length: 5 }, (_, index) => concurrencyQueue[index]
    ? `<div class="queue-slot filled">${safe(concurrencyQueue[index])}</div>`
    : `<div class="queue-slot">Empty</div>`).join("");
}
function produceRequest() {
  if (concurrencyQueue.length >= 5) {
    addConcurrencyLog("Producer waits because the queue is full (empty = 0).");
    return;
  }
  producedCount += 1;
  const id = `R${producedCount}`;
  byId("lock-state").textContent = "Mutex locked";
  concurrencyQueue.push(id);
  addConcurrencyLog(`Producer added ${id}; signal(full), queue size = ${concurrencyQueue.length}.`);
  byId("lock-state").textContent = "Mutex free";
  renderQueue();
}
function consumeRequest() {
  if (!concurrencyQueue.length) {
    addConcurrencyLog("Consumer waits because the queue is empty (full = 0).");
    return;
  }
  byId("lock-state").textContent = "Mutex locked";
  const id = concurrencyQueue.shift();
  addConcurrencyLog(`Officer processed ${id}; signal(empty), queue size = ${concurrencyQueue.length}.`);
  byId("lock-state").textContent = "Mutex free";
  renderQueue();
}

function initDeadlock() {
  byId("run-banker").addEventListener("click", runBanker);
  runBanker();
}

function runBanker() {
  try {
    const allocation = matrix(byId("allocation-input").value);
    const maximum = matrix(byId("maximum-input").value);
    const available = numberList(byId("available-input").value);
    const result = OSAlgorithms.bankersAlgorithm(allocation, maximum, available);
    byId("banker-status").textContent = result.safe ? "System is in a safe state" : "Unsafe state detected";
    byId("safe-sequence").innerHTML = result.safe
      ? result.sequence.map((id) => `<span class="sequence-node">${id}</span>`).join("")
      : `<div class="callout">No complete safe sequence. Unfinished: ${safe(result.remaining.join(", "))}</div>`;
    byId("banker-head").innerHTML = `<tr><th>Process</th>${available.map((_, i) => `<th>Need R${i}</th>`).join("")}</tr>`;
    byId("banker-table").innerHTML = result.need.map((row, i) => `<tr><td>P${i}</td>${row.map((n) => `<td>${n}</td>`).join("")}</tr>`).join("");
  } catch (error) {
    byId("banker-status").textContent = error.message;
  }
}

function initMemory() {
  byId("run-memory").addEventListener("click", runMemory);
  runMemory();
}

function runMemory() {
  try {
    const refs = numberList(byId("page-reference").value);
    const algorithm = byId("memory-algorithm").value;
    const result = OSAlgorithms.pageReplacement(algorithm, refs, Number(byId("frame-count").value));
    byId("memory-title").textContent = algorithm;
    byId("fault-pill").textContent = `${result.faults} page faults`;
    byId("memory-metrics").innerHTML = [
      metricCard("Page faults", result.faults, "page loaded from disk"),
      metricCard("Page hits", result.hits, "page already in memory"),
      metricCard("Fault rate", `${(result.faultRate * 100).toFixed(1)}%`, "faults ÷ references")
    ].join("");
    byId("memory-head").innerHTML = `<tr><th>Frame</th>${result.steps.map((s) => `<th>${s.page}</th>`).join("")}</tr>`;
    const count = Number(byId("frame-count").value);
    let rows = "";
    for (let frame = 0; frame < count; frame += 1) rows += `<tr><th>F${frame + 1}</th>${result.steps.map((s) => `<td>${s.frames[frame]}</td>`).join("")}</tr>`;
    rows += `<tr><th>Result</th>${result.steps.map((s) => `<td class="${s.fault ? "fault-cell" : "hit-cell"}">${s.fault ? "Fault" : "Hit"}</td>`).join("")}</tr>`;
    byId("memory-table").innerHTML = rows;
  } catch (error) {
    byId("memory-title").textContent = error.message;
  }
}

function initDisk() {
  byId("run-disk").addEventListener("click", runDisk);
  runDisk();
}

function runDisk() {
  try {
    const algorithm = byId("disk-algorithm").value;
    const max = Number(byId("disk-max").value);
    const result = OSAlgorithms.diskScheduling(algorithm, numberList(byId("disk-queue").value), Number(byId("disk-head").value), max);
    byId("disk-title").textContent = algorithm;
    byId("movement-pill").textContent = `${result.totalMovement} cylinders`;
    byId("disk-path").innerHTML = result.route.map((n) => `<span class="disk-node">${n}</span>`).join("");
    drawDiskChart(result.route, max);
  } catch (error) {
    byId("disk-title").textContent = error.message;
  }
}

function drawDiskChart(route, max) {
  const svg = byId("disk-chart");
  const width = 720;
  const height = 180;
  const pad = 28;
  const x = (value) => pad + (value / max) * (width - 2 * pad);
  const y = (index) => pad + index * ((height - 2 * pad) / Math.max(1, route.length - 1));
  const points = route.map((value, i) => `${x(value)},${y(i)}`).join(" ");
  const ticks = [0, Math.round(max / 4), Math.round(max / 2), Math.round(max * .75), max];
  svg.innerHTML = `
    ${ticks.map((tick) => `<line x1="${x(tick)}" y1="15" x2="${x(tick)}" y2="195" stroke="#d9e3eb"/><text x="${x(tick)}" y="212" text-anchor="middle" fill="#65788a" font-size="12">${tick}</text>`).join("")}
    <polyline points="${points}" fill="none" stroke="#117a75" stroke-width="3" stroke-linejoin="round"/>
    ${route.map((value, i) => `<circle cx="${x(value)}" cy="${y(i)}" r="5" fill="#1f5f8b"/><text x="${x(value) + 8}" y="${y(i) - 7}" fill="#233445" font-size="11">${value}</text>`).join("")}`;
}

function initMonitor() {
  byId("refresh-monitor").addEventListener("click", renderMonitor);
  renderMonitor();
}

function renderMonitor() {
  const requests = getRequests();
  const active = requests.filter((r) => r.status !== "Completed").length;
  const urgent = requests.filter((r) => Number(r.priority) === 1 && r.status !== "Completed").length;
  const cpu = Math.min(92, 24 + active * 7 + urgent * 5);
  const memory = Math.min(90, 38 + active * 4);
  const disk = Math.min(88, 31 + requests.length * 3);
  byId("monitor-metrics").innerHTML = [
    metricCard("Estimated CPU", `${cpu}%`, cpu > 80 ? "high workload" : "within target"),
    metricCard("Estimated memory", `${memory}%`, memory > 80 ? "review cache" : "within target"),
    metricCard("Document storage", `${disk}%`, disk > 80 ? "backup required" : "space available"),
    metricCard("Active processes", active, `${urgent} urgent request(s)`)
  ].join("");
  const workers = [
    ["Permit worker", 42 + active * 3, "Running"],
    ["Certificate worker", 34 + active * 2, "Running"],
    ["Grievance worker", 28 + urgent * 10, urgent ? "Priority" : "Running"],
    ["Backup service", 17, "Background"]
  ];
  byId("worker-list").innerHTML = workers.map(([name, load, state]) => `<div class="worker"><strong>${name}</strong><div class="worker-bar"><span style="width:${Math.min(100, load)}%"></span></div>${badge(state)}</div>`).join("");
}

navButtons.forEach((button) => button.addEventListener("click", () => openView(button.dataset.view)));
window.addEventListener("hashchange", () => openView(location.hash.slice(1), false));
openView(location.hash.slice(1) || "dashboard", false);
