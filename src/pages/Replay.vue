<template>
  <main class="replay-page">
    <header>
      <h1>{{ text("独立模拟复盘", "Independent replay") }}</h1>
      <span
        >{{ job?.status }} {{ job?.processed || 0 }} /
        {{ job?.total || "—" }}</span
      ><button @click="cancel">
        {{ text("取消 / 释放", "Cancel / release") }}
      </button>
    </header>
    <p v-if="error" role="alert">{{ error }}</p>
    <template v-if="job?.status === 'completed'"
      ><nav>
        <button @click="original = !original">
          {{
            original
              ? text("查看当前结果", "Current results")
              : text("查看原始结果", "Original results")
          }}</button
        ><button @click="paused = !paused">
          {{ paused ? text("播放", "Play") : text("暂停", "Pause") }}</button
        ><select v-model="speed">
          <option v-for="s in [1, 2, 5, 10]" :value="s">
            {{ s }}×
          </option></select
        ><button
          @click="
            now = 0;
            paused = true;
          "
        >
          {{ text("从头播放", "Restart playback") }}</button
        ><button @click="rerun">{{ text("再次重算", "Re-run again") }}</button
        ><button @click="download">
          {{ text("导出重跑记录", "Export replay") }}</button
        ><span>{{ now.toFixed(1) }}s</span>
      </nav>
      <p>
        {{
          text(
            "3D 始终播放当前算法的新计划；原始记录仅作结果对比。配置变化也可能影响结果。",
            "3D always plays the new plan; original records are compared as snapshots. Configuration changes may affect results.",
          )
        }}
      </p>
      <div class="replay-layout">
        <div ref="mapElement" class="replay-map"></div>
        <section>
          <h2>
            {{
              original
                ? text("原始快照", "Original snapshot")
                : text("当前算法结果", "Current algorithm results")
            }}
          </h2>
          <article v-for="pair in job.mapping" :key="pair.inputIndex">
            <strong>{{ pair.sourceTaskId }} → {{ pair.taskId }}</strong>
            <p>{{ task(pair).name }} · {{ ui.t(task(pair).status) }}</p>
            <p>
              {{ task(pair).robotId || "—" }} ·
              {{ task(pair).reasonCode || "assigned" }}
            </p>
            <p>{{ ui.display((task(pair).route || []).join(" → ")) }}</p>
            <p>
              {{ text("原调度 / 新调度", "Old / new scheduling") }}:
              {{ oldTask(pair)?.reasonCode || "assigned" }} /
              {{ newTask(pair)?.reasonCode || "assigned" }}
            </p>
            <dl
              v-for="[label, value] in [
                [
                  text(
                    '原执行耗时 / 新执行耗时',
                    'Old / new execution duration',
                  ),
                  `${ui.duration(oldTask(pair)?.estimatedTime)} / ${ui.duration(newTask(pair)?.estimatedTime)}`,
                ],
                [
                  text('原计划开始 / 新计划开始', 'Old / new planned start'),
                  `${oldTask(pair)?.startTime?.toFixed(1) || '—'}s / ${newTask(pair)?.startTime?.toFixed(1) || '—'}s`,
                ],
                [
                  text('原计划完成 / 新计划完成', 'Old / new planned finish'),
                  `${oldTask(pair)?.finishTime?.toFixed(1) || '—'}s / ${newTask(pair)?.finishTime?.toFixed(1) || '—'}s`,
                ],
              ]"
            >
              <dt>{{ label }}</dt>
              <dd>{{ value }}</dd>
            </dl>
            <p>{{ oldTask(pair)?.reason }}</p>
            <p>{{ newTask(pair)?.reason }}</p>
          </article>
        </section>
      </div></template
    >
  </main>
</template>
<script setup>
import { ref, shallowRef, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useRoute } from "vue-router";
import * as THREE from "three";
import yaml from "js-yaml";
import { createWaypointLabel } from "../utils/mapLabels.js";
import { Map3DRenderer } from "../utils/map3dRenderer.js";
import { api, interpolate } from "../utils/demo.js";
import { downloadTaskRecords } from "../utils/taskRecords.js";
import { useUiStore } from "../stores/uiStore.js";
const route = useRoute(),
  ui = useUiStore(),
  job = shallowRef(null),
  error = ref(""),
  original = ref(false),
  paused = ref(true),
  speed = ref(1),
  now = ref(0),
  mapElement = ref(null);
watch(
  () => ui.preferences.theme,
  (theme) => renderer?.setTheme(theme),
);
const text = (zh, en) => (ui.preferences.locale === "zh-CN" ? zh : en);
const oldTask = (p) =>
    job.value.original.state.tasks.find((t) => t.id === p.sourceTaskId),
  newTask = (p) => job.value.record.state.tasks.find((t) => t.id === p.taskId),
  task = (p) => {
    if (original.value) return oldTask(p);
    const t = newTask(p);
    return {
      ...t,
      status:
        t.scheduleStage === "assigned"
          ? now.value < t.startTime
            ? "waiting"
            : now.value < t.finishTime
              ? "executing"
              : "completed"
          : t.status,
    };
  };
let poll,
  raf,
  renderer,
  worker,
  closed = false,
  building = false,
  last,
  robots = [];
async function load() {
  try {
    job.value = await api(`replays/${route.params.id}`);
    if (job.value.status === "completed") {
      clearInterval(poll);
      await nextTick();
      await build();
    } else if (job.value.status === "failed") error.value = job.value.error;
  } catch (e) {
    clearInterval(poll);
    error.value = e.message;
  }
}
async function build() {
  if (renderer || closed || building) return;
  building = true;
  try {
    const maps = await Promise.all(
      job.value.scene.maps.map(async (m) => {
        const [pgm, yml] = await Promise.all([
          fetch(`/api${m.assetBase}.pgm`),
          fetch(`/api${m.assetBase}.yaml`),
        ]);
        if (!pgm.ok || !yml.ok) throw Error("Map resources unavailable");
        return {
          ...m,
          explicitNavigation: true,
          waypoints: m.waypoints.map((w) => {
            const n = job.value.scene.nodes.find((n) => n.id === w.nodeId);
            return {
              ...w,
              connections: [],
              displayLabel: n?.label,
              displayKind: n?.displayKind,
              renderMarker: n?.isLocationRepresentative === true,
              markerColor: n?.displayKind === "stairs" ? 0xa29bfe : 0x00b894,
            };
          }),
          reconstructDemoWalls: job.value.scene.campusId === "demo-campus",
          mapConfig: yaml.load(await yml.text()),
          buffer: await pgm.arrayBuffer(),
        };
      }),
    );
    const prepared = await new Promise((resolve, reject) => {
      worker = new Worker(
        new URL("../utils/mapPreparation.worker.js", import.meta.url),
        { type: "module" },
      );
      worker.onmessage = ({ data }) =>
        data.error ? reject(Error(data.error)) : resolve(data);
      worker.onerror = (e) => reject(Error(e.message));
      worker.postMessage(
        maps,
        maps.map((m) => m.buffer),
      );
    });
    worker.terminate();
    if (closed) return;
    renderer = new Map3DRenderer(mapElement.value, {
      showCrossMapLinks: false,
    });
    renderer.init();
    renderer.allMaps = prepared.maps;
    renderer.preparedIndoor = prepared.indoor;
    await renderer.render(true);
    if (closed) return;
    renderer.setTheme(ui.preferences.theme);
    const nodes = Object.fromEntries(
      job.value.scene.nodes.map((n) => [n.id, n]),
    );
    const vector = (p) => new THREE.Vector3(p.x, p.z * 3 + 0.4, -p.y);
    for (const t of job.value.record.state.tasks) {
      if (!t.trajectory?.length) continue;
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(t.trajectory.map(vector)),
        new THREE.LineBasicMaterial({ color: 0xfacc15 }),
      );
      renderer.scene.add(line);
    }
    for (const r of job.value.scene.robots) {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 0.7, 12),
        new THREE.MeshBasicMaterial({ color: 0x2299dc }),
      );
      const label = createWaypointLabel(r.name, 0x2299dc, ui.preferences.theme);
      label.scale.set(0.04, 0.025, 1);
      mesh.add(label);
      renderer.scene.add(mesh);
      robots.push({ mesh, robot: r, initial: nodes[r.nodeId].position });
    }
    function frame(stamp) {
      if (closed) return;
      if (last && !paused.value)
        now.value = Math.min(
          job.value.record.state.clock.now,
          now.value + ((stamp - last) / 1000) * speed.value,
        );
      last = stamp;
      for (const { mesh, robot, initial } of robots) {
        const tasks = job.value.record.state.tasks
            .filter(
              (t) => t.robotNumber === robot.id && t.startTime <= now.value,
            )
            .sort((a, b) => a.startTime - b.startTime),
          t = tasks.at(-1),
          p = t ? interpolate(t.trajectory, now.value) : initial;
        mesh.position.copy(vector(p));
        mesh.material.color.set(
          t && now.value < t.finishTime ? 0xff5364 : 0x2299dc,
        );
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  } catch (e) {
    error.value = e.message;
  }
}
async function cancel() {
  closed = true;
  cancelAnimationFrame(raf);
  worker?.terminate();
  renderer?.dispose();
  renderer = null;
  await fetch(`/api/demo/replays/${route.params.id}`, { method: "DELETE" });
  clearInterval(poll);
  job.value = { status: "cancelled" };
}
async function rerun() {
  try {
    const preview = await api("replays/preview", job.value.original, 60000);
    const next = await api("replays", {
      requestId: crypto.randomUUID(),
      sceneVersion: preview.sceneVersion,
      record: job.value.original,
    });
    window.location.href = `/replays/${next.id}`;
  } catch (e) {
    error.value = e.message;
  }
}
function download() {
  downloadTaskRecords(job.value.record);
}
onMounted(() => {
  load();
  poll = setInterval(load, 1000);
});
onUnmounted(() => {
  closed = true;
  clearInterval(poll);
  cancelAnimationFrame(raf);
  worker?.terminate();
  renderer?.dispose();
});
</script>
<style scoped>
.replay-page {
  height: 100dvh;
  overflow: auto;
  background: var(--bg);
  color: var(--text);
  padding: 16px;
}
header,
nav {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  padding: 10px 0;
}
header {
  border-bottom: 1px solid var(--border);
}
header > span {
  margin-left: auto;
  color: var(--muted);
  font-size: 12px;
}
nav button,
nav select {
  min-height: 34px;
}
h1 {
  font-weight: 600;
}
section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
}
.replay-map {
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
article strong {
  display: block;
  margin-bottom: 8px;
}
article dl {
  margin: 8px 0;
}
article dt {
  color: var(--muted);
}
article dd {
  margin: 2px 0;
  font-variant-numeric: tabular-nums;
}
h1 {
  font-size: 18px;
}
h2 {
  font-size: 15px;
}
.replay-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 16px;
  height: 75dvh;
}
.replay-map {
  min-height: 400px;
}
section {
  overflow: auto;
}
article {
  border-bottom: 1px solid var(--border);
  padding: 12px;
  font-size: 12px;
}
@media (max-width: 768px) {
  .replay-layout {
    display: flex;
    flex-direction: column;
    height: auto;
  }
  .replay-map {
    height: 55dvh;
    flex: none;
  }
}
</style>
