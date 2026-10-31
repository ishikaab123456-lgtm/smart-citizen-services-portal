import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "diagrams");

const diagrams = [
  {
    file: "01_portal_architecture.svg", title: "Smart Citizen Services Portal - OS Framework",
    nodes: [
      ["citizens", 470, 90, 260, 70, "Citizens\nWeb browser", "blue"],
      ["gateway", 470, 205, 260, 70, "Request gateway\nValidation and queue", "blue"],
      ["scheduler", 470, 320, 260, 70, "OS scheduler\nPriority + Round Robin", "teal"],
      ["permit", 150, 450, 230, 70, "Permit worker\nprocess", "blue"],
      ["certificate", 485, 450, 230, 70, "Certificate worker\nprocess", "blue"],
      ["grievance", 820, 450, 230, 70, "Grievance worker\nprocess", "blue"],
      ["database", 470, 580, 260, 70, "Shared database and files\nProtected by semaphore", "orange"]
    ],
    edges: [["citizens","gateway"],["gateway","scheduler"],["scheduler","permit"],["scheduler","certificate"],["scheduler","grievance"],["permit","database"],["certificate","database"],["grievance","database"]]
  },
  {
    file: "02_process_state.svg", title: "Process State Model for a Citizen Request",
    nodes: [
      ["new", 70, 290, 150, 70, "NEW", "blue"], ["ready", 285, 160, 170, 70, "READY\nRequest queue", "blue"],
      ["running", 535, 160, 180, 70, "RUNNING\nCPU service", "teal"], ["waiting", 535, 410, 180, 70, "WAITING\nDatabase / file I/O", "orange"],
      ["end", 860, 160, 190, 70, "TERMINATED\nRequest completed", "blue"]
    ],
    edges: [["new","ready","admitted"],["ready","running","dispatch"],["running","ready","time slice"],["running","waiting","I/O wait"],["waiting","ready","I/O complete"],["running","end","finish"]]
  },
  {
    file: "03_synchronization.svg", title: "Producer-Consumer Synchronization",
    nodes: [
      ["producer", 60, 290, 190, 80, "Citizen portal\nPRODUCER", "blue"], ["empty", 300, 160, 190, 70, "wait(empty)\nFree slot", "orange"],
      ["mutex", 300, 410, 190, 70, "wait(mutex)\nLock queue", "teal"], ["buffer", 560, 290, 210, 90, "BOUNDED QUEUE\nMaximum 5 requests", "blue"],
      ["signal", 830, 160, 190, 70, "signal(mutex)\nUnlock queue", "teal"], ["consumer", 830, 410, 210, 80, "Municipal officer\nCONSUMER", "blue"]
    ],
    edges: [["producer","empty"],["empty","mutex"],["mutex","buffer"],["buffer","signal"],["signal","consumer"]]
  },
  {
    file: "04_deadlock_resource_graph.svg", title: "Resource Allocation Graph - Possible Deadlock",
    nodes: [
      ["p1", 190, 150, 250, 80, "P1: Certificate service", "blue"], ["r2", 760, 150, 250, 80, "R2: Document file", "orange"],
      ["p2", 760, 450, 250, 80, "P2: Payment service", "blue"], ["r1", 190, 450, 250, 80, "R1: Database lock", "orange"]
    ],
    edges: [["r1","p1","allocated"],["p1","r2","requests"],["r2","p2","allocated"],["p2","r1","requests"]], red: true
  },
  {
    file: "05_paging.svg", title: "Paging and Address Translation",
    nodes: [
      ["logical", 70, 250, 260, 150, "LOGICAL ADDRESS\nPage number | Offset\n\nExample: Page 2, Offset 40", "blue"],
      ["table", 470, 180, 260, 290, "PAGE TABLE\nP0 → Frame 2\nP1 → Frame 0\nP2 → Frame 3\nP3 → Frame 1", "orange"],
      ["physical", 870, 170, 270, 310, "PHYSICAL MEMORY\nFrame 0: Certificate\nFrame 1: Payment\nFrame 2: Login\nFrame 3: Grievance", "teal"]
    ],
    edges: [["logical","table","page-table lookup"],["table","physical","frame + offset"]]
  },
  {
    file: "06_file_system.svg", title: "Citizen Portal File-System Structure",
    nodes: [
      ["root", 460, 90, 280, 70, "/citizen_service_data", "teal"],
      ["permits", 45, 280, 190, 70, "permits/", "blue"], ["certs", 275, 280, 190, 70, "certificates/", "blue"],
      ["grievances", 505, 280, 190, 70, "grievances/", "blue"], ["logs", 735, 280, 190, 70, "logs/", "blue"], ["backups", 965, 280, 190, 70, "backups/", "orange"]
    ],
    edges: [["root","permits"],["root","certs"],["root","grievances"],["root","logs"],["root","backups"]]
  },
  {
    file: "07_virtualization.svg", title: "Scalable Virtualization Architecture",
    nodes: [
      ["traffic", 470, 60, 260, 65, "Citizen traffic", "blue"], ["load", 470, 165, 260, 65, "Load balancer", "teal"],
      ["vm1", 120, 290, 250, 80, "VM 1\nPortal and API", "blue"], ["vm2", 475, 290, 250, 80, "VM 2\nPortal and API", "blue"], ["vm3", 830, 290, 250, 80, "VM 3\nBackground jobs", "blue"],
      ["hypervisor", 405, 440, 390, 80, "Type 1 Hypervisor\nCPU, memory and I/O allocation", "orange"], ["hardware", 405, 575, 390, 70, "Physical server: CPU · RAM · SSD · GPU", "teal"]
    ],
    edges: [["traffic","load"],["load","vm1"],["load","vm2"],["load","vm3"],["vm1","hypervisor"],["vm2","hypervisor"],["vm3","hypervisor"],["hypervisor","hardware"]]
  },
  {
    file: "08_linux_architecture.svg", title: "Linux Architecture Used in the Project",
    nodes: [
      ["apps", 250, 90, 700, 90, "USER APPLICATIONS\nCitizen portal · OS simulator · Bash scripts", "blue"],
      ["shell", 250, 235, 700, 90, "SHELL AND SYSTEM LIBRARIES\nBash · standard commands · system calls", "teal"],
      ["kernel", 250, 380, 700, 100, "LINUX KERNEL\nProcess scheduler · memory manager · VFS · device drivers", "orange"],
      ["hardware", 250, 545, 700, 80, "HARDWARE\nCPU · main memory · storage · network devices", "blue"]
    ],
    edges: [["apps","shell","commands / API"],["shell","kernel","system calls"],["kernel","hardware","device control"]]
  }
];

function escapeText(text) {
  return String(text).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

function diagramSvg(item) {
  const palette = {
    blue: ["#eaf3f9", "#1f5f8b"], teal: ["#e8f5f3", "#117a75"], orange: ["#fff4d8", "#d28a08"]
  };
  const map = new Map(item.nodes.map((n) => [n[0], n]));
  const edgeColor = item.red ? "#b13f3a" : "#117a75";
  const edges = item.edges.map(([from, to, label = ""]) => {
    const a = map.get(from); const b = map.get(to);
    const ax = a[1] + a[3] / 2; const ay = a[2] + a[4] / 2;
    const bx = b[1] + b[3] / 2; const by = b[2] + b[4] / 2;
    const dx = bx - ax; const dy = by - ay;
    const horizontal = Math.abs(dx) > Math.abs(dy);
    const x1 = horizontal ? ax + Math.sign(dx) * a[3] / 2 : ax;
    const y1 = horizontal ? ay : ay + Math.sign(dy) * a[4] / 2;
    const x2 = horizontal ? bx - Math.sign(dx) * b[3] / 2 : bx;
    const y2 = horizontal ? by : by - Math.sign(dy) * b[4] / 2;
    const lx = (x1 + x2) / 2; const ly = (y1 + y2) / 2 - 8;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${edgeColor}" stroke-width="3" marker-end="url(#arrow)"/><text x="${lx}" y="${ly}" text-anchor="middle" class="edge-label">${escapeText(label)}</text>`;
  }).join("");
  const nodes = item.nodes.map(([, x, y, w, h, label, color]) => {
    const [fill, stroke] = palette[color];
    const lines = label.split("\n");
    const startY = y + h / 2 - (lines.length - 1) * 12;
    return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>${lines.map((line, i) => `<text x="${x + w / 2}" y="${startY + i * 24}" text-anchor="middle" class="node-text">${escapeText(line)}</text>`).join("")}</g>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700">
  <defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="${edgeColor}"/></marker></defs>
  <style>.title{font:700 28px Arial;fill:#102a43}.node-text{font:600 17px Arial;fill:#233445}.edge-label{font:600 14px Arial;fill:#65788a}</style>
  <rect width="1200" height="700" fill="#ffffff"/><text x="600" y="42" text-anchor="middle" class="title">${escapeText(item.title)}</text>${edges}${nodes}</svg>`;
}

await fs.mkdir(out, { recursive: true });
for (const item of diagrams) await fs.writeFile(path.join(out, item.file), diagramSvg(item), "utf8");
console.log(`Generated ${diagrams.length} SVG diagrams.`);
