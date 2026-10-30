# RCSS Conference Demo

Vue 3 / Pinia / Three.js frontend for **live algorithm scheduling and simulated execution**. Run it with the independent conference backend in `Robot_Cluster_Scheduling_System`; it does not require a database, MQTT or physical robots.

## Local startup

Backend, in the `Robot_Cluster_Scheduling_System` checkout (Python dependencies from its `requirements.txt` must already be installed):

```sh
.venv/bin/python -m uvicorn demo.main:app --host 127.0.0.1 --port 8001
```

Frontend, in this checkout (Node.js 20+):

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

Open <http://127.0.0.1:3000>. Vite forwards `/api` to `http://127.0.0.1:8001`. To use another backend, set `DEMO_API_URL` before starting Vite. `npm run build` and `npm run preview -- --host 127.0.0.1` also support that proxy; a separately deployed static server must forward `/api` to the backend and fall back to `index.html` for `/tasks`.

## Repeatable presentation

1. Click **Reset Demo**. The scene starts with eight idle robots and no historical tasks.
2. Click **New Task**, name the delivery and choose `zone_1 · p1` → `zone_2 · p3`. Submit.
3. The selected order shows its assigned robot, execution duration, planned start/finish, full algorithm route and remaining time. The route includes the staircase between floors.
4. Pause to explain the assignment; robot motion, progress and waiting counters stop together. Resume and switch to **5×** or **10×** to finish within the presentation.
5. Use **Task Panel** to show task filters, **Task Timeline (Gantt)** and **Task Logs**. Submit orders repeatedly to demonstrate queued work. Waiting orders display their reason, elapsed wait and expected start; they leave the queue when execution begins.
6. Return to **Dashboard** to show completion count, completion rate, average completion time and robot utilization changing with the same orders. Completed robots remain at their destinations.
7. Reset to repeat. Refreshing the browser restores the current backend session; restarting the backend creates a new empty session.

The time shown is the simulation's clock in Asia/Shanghai. Remaining time is in simulated seconds; at 10×, ten simulated seconds take one real second. Average completion includes queue time. Completion rate is completed orders divided by all accepted orders, including failed orders. Utilization is the current fraction of executing robots. Distribution counts accepted orders by destination map/node.

## Failure and recovery

- Scheduling failures have a reason code, appear under **Failed**, and can be retried. They are not kept in Waiting Queue.
- The form retains inputs and a request ID after a transport failure; retrying an unchanged order does not create another task.
- On disconnection the displayed clock/motion freeze and a reconnect notice appears. After reconnection the UI adopts the backend's authoritative state.
- Reset invalidates older requests and responses. One backend process maintains one shared demonstration for all connected browser tabs; it is not a multi-user production task service.
- The packaged scene contains one stale portal (`zone_1:p1` → nonexistent `zone_3:p6`), reported in `/demo/scene.warnings` and ignored. Its valid `zone_3:p5` connection remains. No elevator links are invented.
- Movement follows the scheduler's topology and timetable, including pickup/delivery holds; it does not demonstrate physical navigation or collision safety on real robots. Unsupported conflict-efficiency and elevator metrics show `—`.

## Verification

```sh
npm test
npm run build
```

Backend regressions and API tests are documented in its `demo/README.md`. The `public/maps` assets use the same sequential zone names as the backend; the running demo loads its versioned scene and map assets exclusively from the backend.

## Reading the map

Robot positions use **Floor · Map ID · Node**. `4F · zone_1 · p1` means node `p1` in map `zone_1` on floor 4. While travelling, the list shows the departure and arrival nodes (`p1 → p7`), rather than implying the robot remains at its last visited node. Each map has its own node numbers; `zone_1:p1` and `zone_2:p1` are different nodes.

The `zone_1`, `zone_2` and `zone_3` strings are sequential map IDs, not floor numbers: `zone_1` and `zone_3` belong to 4F; `zone_2` belongs to 5F. `stairs_1` is the staircase between them, represented as 4.5F. Zone numbering follows the scene loading order; floor membership is specified separately.

Both map views include a collapsible legend: green markers are navigation nodes, purple markers are valid map connections, yellow bodies are robots, and the cyan line is the selected task route with start/end markers. These colours describe the demonstration's topology; raw numeric node types do not imply an elevator or a task endpoint. Hover over a marker or robot for its floor, map, node/route, task and position. Position coordinates are physical metres before the visual 3× height exaggeration. Hidden floors/robots cannot trigger tooltips.
