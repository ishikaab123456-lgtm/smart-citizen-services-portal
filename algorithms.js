(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.OSAlgorithms = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function cleanProcesses(input) {
    if (!Array.isArray(input) || input.length === 0) throw new Error("Add at least one process.");
    return input.map((p, index) => {
      const arrival = Number(p.arrival);
      const burst = Number(p.burst);
      const priority = Number(p.priority);
      if (!p.id || !Number.isFinite(arrival) || arrival < 0 || !Number.isFinite(burst) || burst <= 0 || !Number.isFinite(priority)) {
        throw new Error("Every process needs a valid ID, arrival, burst and priority.");
      }
      return {
        id: String(p.id), arrival, burst, priority,
        queue: String(p.queue || "normal").toLowerCase(),
        remaining: burst, order: index, level: 0
      };
    });
  }

  function pushSegment(timeline, id, start, end) {
    if (end <= start) return;
    const last = timeline[timeline.length - 1];
    if (last && last.id === id && last.end === start) last.end = end;
    else timeline.push({ id, start, end });
  }

  function completeSchedule(processes, timeline) {
    const rows = processes.map((p) => {
      const segments = timeline.filter((item) => item.id === p.id);
      const completion = segments.length ? segments[segments.length - 1].end : p.arrival;
      const firstStart = segments.length ? segments[0].start : p.arrival;
      const turnaround = completion - p.arrival;
      return {
        id: p.id,
        completion,
        turnaround,
        waiting: turnaround - p.burst,
        response: firstStart - p.arrival
      };
    });
    const average = (key) => rows.reduce((sum, row) => sum + row[key], 0) / rows.length;
    const endTime = Math.max(...timeline.map((item) => item.end), 0);
    const startTime = Math.min(...processes.map((p) => p.arrival));
    return {
      timeline,
      rows,
      averages: {
        waiting: average("waiting"),
        turnaround: average("turnaround"),
        response: average("response")
      },
      throughput: rows.length / Math.max(1, endTime - startTime)
    };
  }

  function runNonPreemptive(input, compare) {
    const processes = cleanProcesses(input);
    const pending = [...processes];
    const timeline = [];
    let time = Math.min(...processes.map((p) => p.arrival));
    while (pending.length) {
      const ready = pending.filter((p) => p.arrival <= time);
      if (!ready.length) {
        const next = Math.min(...pending.map((p) => p.arrival));
        pushSegment(timeline, "Idle", time, next);
        time = next;
        continue;
      }
      ready.sort(compare);
      const selected = ready[0];
      pending.splice(pending.indexOf(selected), 1);
      pushSegment(timeline, selected.id, time, time + selected.burst);
      time += selected.burst;
    }
    return completeSchedule(processes, timeline);
  }

  function fcfs(input) {
    return runNonPreemptive(input, (a, b) => a.arrival - b.arrival || a.order - b.order);
  }

  function sjf(input) {
    return runNonPreemptive(input, (a, b) => a.burst - b.burst || a.arrival - b.arrival || a.order - b.order);
  }

  function priority(input) {
    return runNonPreemptive(input, (a, b) => a.priority - b.priority || a.arrival - b.arrival || a.order - b.order);
  }

  function srtf(input) {
    const processes = cleanProcesses(input);
    const work = processes.map((p) => ({ ...p }));
    const timeline = [];
    let time = Math.min(...work.map((p) => p.arrival));
    while (work.some((p) => p.remaining > 0)) {
      const ready = work.filter((p) => p.arrival <= time && p.remaining > 0)
        .sort((a, b) => a.remaining - b.remaining || a.arrival - b.arrival || a.order - b.order);
      if (!ready.length) {
        const next = Math.min(...work.filter((p) => p.remaining > 0).map((p) => p.arrival));
        pushSegment(timeline, "Idle", time, next);
        time = next;
        continue;
      }
      pushSegment(timeline, ready[0].id, time, time + 1);
      ready[0].remaining -= 1;
      time += 1;
    }
    return completeSchedule(processes, timeline);
  }

  function roundRobin(input, quantum) {
    const q = Number(quantum);
    if (!Number.isFinite(q) || q < 1) throw new Error("Time quantum must be at least 1.");
    const processes = cleanProcesses(input);
    const work = processes.map((p) => ({ ...p })).sort((a, b) => a.arrival - b.arrival || a.order - b.order);
    const ready = [];
    const timeline = [];
    let index = 0;
    let time = work[0].arrival;
    while (index < work.length || ready.length) {
      while (index < work.length && work[index].arrival <= time) ready.push(work[index++]);
      if (!ready.length) {
        const next = work[index].arrival;
        pushSegment(timeline, "Idle", time, next);
        time = next;
        continue;
      }
      const selected = ready.shift();
      const slice = Math.min(q, selected.remaining);
      pushSegment(timeline, selected.id, time, time + slice);
      selected.remaining -= slice;
      time += slice;
      while (index < work.length && work[index].arrival <= time) ready.push(work[index++]);
      if (selected.remaining > 0) ready.push(selected);
    }
    return completeSchedule(processes, timeline);
  }

  function multilevelQueue(input) {
    const processes = cleanProcesses(input);
    const work = processes.map((p) => ({ ...p })).sort((a, b) => a.arrival - b.arrival || a.order - b.order);
    const queues = { high: [], normal: [], background: [] };
    const quantums = { high: 2, normal: 3, background: Number.POSITIVE_INFINITY };
    const timeline = [];
    let index = 0;
    let time = work[0].arrival;
    const addArrivals = () => {
      while (index < work.length && work[index].arrival <= time) {
        const name = queues[work[index].queue] ? work[index].queue : "normal";
        queues[name].push(work[index++]);
      }
    };
    while (index < work.length || queues.high.length || queues.normal.length || queues.background.length) {
      addArrivals();
      const name = queues.high.length ? "high" : queues.normal.length ? "normal" : queues.background.length ? "background" : null;
      if (!name) {
        const next = work[index].arrival;
        pushSegment(timeline, "Idle", time, next);
        time = next;
        continue;
      }
      const selected = queues[name].shift();
      const slice = Math.min(quantums[name], selected.remaining);
      pushSegment(timeline, selected.id, time, time + slice);
      selected.remaining -= slice;
      time += slice;
      addArrivals();
      if (selected.remaining > 0) queues[name].push(selected);
    }
    return completeSchedule(processes, timeline);
  }

  function multilevelFeedbackQueue(input) {
    const processes = cleanProcesses(input);
    const work = processes.map((p) => ({ ...p })).sort((a, b) => a.arrival - b.arrival || a.order - b.order);
    const queues = [[], [], []];
    const quantums = [2, 4, Number.POSITIVE_INFINITY];
    const timeline = [];
    let index = 0;
    let time = work[0].arrival;
    const addArrivals = () => {
      while (index < work.length && work[index].arrival <= time) {
        work[index].level = 0;
        queues[0].push(work[index++]);
      }
    };
    while (index < work.length || queues.some((q) => q.length)) {
      addArrivals();
      const level = queues[0].length ? 0 : queues[1].length ? 1 : queues[2].length ? 2 : -1;
      if (level < 0) {
        const next = work[index].arrival;
        pushSegment(timeline, "Idle", time, next);
        time = next;
        continue;
      }
      const selected = queues[level].shift();
      const slice = Math.min(quantums[level], selected.remaining);
      pushSegment(timeline, selected.id, time, time + slice);
      selected.remaining -= slice;
      time += slice;
      addArrivals();
      if (selected.remaining > 0) {
        selected.level = Math.min(2, level + 1);
        queues[selected.level].push(selected);
      }
    }
    return completeSchedule(processes, timeline);
  }

  function schedule(name, input, quantum) {
    const methods = {
      FCFS: () => fcfs(input),
      SJF: () => sjf(input),
      SRTF: () => srtf(input),
      PRIORITY: () => priority(input),
      RR: () => roundRobin(input, quantum),
      MLQ: () => multilevelQueue(input),
      MLFQ: () => multilevelFeedbackQueue(input)
    };
    if (!methods[name]) throw new Error("Unknown scheduling algorithm.");
    return methods[name]();
  }

  function pageReplacement(name, references, frameCount) {
    const refs = references.map(Number);
    const count = Number(frameCount);
    if (!refs.length || refs.some((n) => !Number.isInteger(n) || n < 0)) throw new Error("Enter a valid page-reference string.");
    if (!Number.isInteger(count) || count < 1) throw new Error("Frame count must be at least 1.");
    const frames = [];
    const steps = [];
    const lastUsed = new Map();
    const frequency = new Map();
    const loadedAt = new Map();
    let pointer = 0;
    let faults = 0;
    refs.forEach((page, index) => {
      const hit = frames.includes(page);
      if (!hit) {
        faults += 1;
        if (frames.length < count) {
          frames.push(page);
          loadedAt.set(page, index);
        } else {
          let victimIndex = 0;
          if (name === "FIFO") {
            victimIndex = pointer;
            pointer = (pointer + 1) % count;
          } else if (name === "LRU") {
            victimIndex = frames.reduce((best, value, i) => (lastUsed.get(value) ?? -1) < (lastUsed.get(frames[best]) ?? -1) ? i : best, 0);
          } else if (name === "Optimal") {
            const nextUses = frames.map((value) => {
              const next = refs.slice(index + 1).indexOf(value);
              return next < 0 ? Number.POSITIVE_INFINITY : next;
            });
            victimIndex = nextUses.indexOf(Math.max(...nextUses));
          } else if (name === "LFU") {
            victimIndex = frames.reduce((best, value, i) => {
              const f1 = frequency.get(value) || 0;
              const f2 = frequency.get(frames[best]) || 0;
              if (f1 !== f2) return f1 < f2 ? i : best;
              return (loadedAt.get(value) || 0) < (loadedAt.get(frames[best]) || 0) ? i : best;
            }, 0);
          } else throw new Error("Unknown page-replacement algorithm.");
          loadedAt.delete(frames[victimIndex]);
          frames[victimIndex] = page;
          loadedAt.set(page, index);
        }
      }
      frequency.set(page, (frequency.get(page) || 0) + 1);
      lastUsed.set(page, index);
      steps.push({ page, frames: [...frames, ...Array(count - frames.length).fill("-")], fault: !hit });
    });
    return { name, faults, hits: refs.length - faults, faultRate: faults / refs.length, steps };
  }

  function bankersAlgorithm(allocation, maximum, available) {
    if (!allocation.length || allocation.length !== maximum.length) throw new Error("Allocation and maximum matrices must have the same rows.");
    const resources = available.length;
    if (!resources || allocation.some((r) => r.length !== resources) || maximum.some((r) => r.length !== resources)) throw new Error("Every matrix row must match the available-resource count.");
    const need = maximum.map((row, i) => row.map((value, j) => value - allocation[i][j]));
    if (need.some((row) => row.some((value) => value < 0))) throw new Error("Maximum demand cannot be smaller than allocation.");
    const work = [...available];
    const finish = Array(allocation.length).fill(false);
    const sequence = [];
    const snapshots = [];
    let progress = true;
    while (sequence.length < allocation.length && progress) {
      progress = false;
      for (let i = 0; i < allocation.length; i += 1) {
        if (!finish[i] && need[i].every((value, j) => value <= work[j])) {
          const before = [...work];
          for (let j = 0; j < resources; j += 1) work[j] += allocation[i][j];
          finish[i] = true;
          sequence.push(`P${i}`);
          snapshots.push({ process: `P${i}`, before, after: [...work] });
          progress = true;
        }
      }
    }
    return { safe: finish.every(Boolean), sequence, need, snapshots, remaining: finish.map((done, i) => done ? null : `P${i}`).filter(Boolean) };
  }

  function movement(route) {
    return route.slice(1).reduce((sum, value, index) => sum + Math.abs(value - route[index]), 0);
  }

  function diskScheduling(name, queue, head, maxCylinder) {
    const requests = queue.map(Number);
    const start = Number(head);
    const max = Number(maxCylinder);
    if (!requests.length || requests.some((n) => !Number.isInteger(n) || n < 0 || n > max)) throw new Error("Disk requests must be valid cylinder numbers.");
    if (!Number.isInteger(start) || start < 0 || start > max) throw new Error("Initial head must be inside the disk range.");
    let route = [start];
    if (name === "FCFS") route.push(...requests);
    else if (name === "SSTF") {
      const pending = [...requests];
      let current = start;
      while (pending.length) {
        pending.sort((a, b) => Math.abs(a - current) - Math.abs(b - current) || a - b);
        current = pending.shift();
        route.push(current);
      }
    } else {
      const up = requests.filter((n) => n >= start).sort((a, b) => a - b);
      const downAsc = requests.filter((n) => n < start).sort((a, b) => a - b);
      const down = [...downAsc].reverse();
      if (name === "SCAN") {
        route.push(...up);
        if (down.length) {
          if (route[route.length - 1] !== max) route.push(max);
          route.push(...down);
        }
      } else if (name === "C-SCAN") {
        route.push(...up);
        if (downAsc.length) {
          if (route[route.length - 1] !== max) route.push(max);
          route.push(0, ...downAsc);
        }
      } else if (name === "LOOK") route.push(...up, ...down);
      else throw new Error("Unknown disk-scheduling algorithm.");
    }
    return { name, route, totalMovement: movement(route) };
  }

  return {
    schedule,
    fcfs,
    sjf,
    srtf,
    priority,
    roundRobin,
    multilevelQueue,
    multilevelFeedbackQueue,
    pageReplacement,
    bankersAlgorithm,
    diskScheduling
  };
});
