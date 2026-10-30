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
2. Click **New Task**, name the delivery and choose `4F · P1` → `5F · P3`. Submit.
3. The selected order shows its assigned robot, execution duration, planned start/finish, full algorithm route and remaining time. The route includes the staircase between floors.
4. Pause to explain the assignment; robot motion, progress and waiting counters stop together. Resume and switch to **5×** or **10×** to finish within the presentation.
5. Use **Task Panel** to show task filters, **Task Timeline (Gantt)** and **Task Logs**. Submit orders repeatedly to demonstrate queued work. Waiting orders display their reason, elapsed wait and expected start; they leave the queue when execution begins.
6. Return to **Dashboard** to show completion count, completion rate, average completion time and robot utilization changing with the same orders. Completed robots remain at their destinations.
7. Reset to repeat. Refreshing the browser restores the current backend session; restarting the backend creates a new empty session.

The time shown is the simulation's clock in Asia/Shanghai. Remaining time is in simulated seconds; at 10×, ten simulated seconds take one real second. Average completion includes queue time. Completion rate is completed orders divided by all accepted orders, including failed orders. Utilization is the current fraction of executing robots. Task metrics and the waiting queue are grouped on the left; robots and their current utilization are on the right.

## Failure and recovery

- Scheduling failures have a reason code, appear under **Failed**, and can be retried. They are not kept in Waiting Queue.
- The form retains inputs and a request ID after a transport failure; retrying an unchanged order does not create another task.
- On disconnection the displayed clock/motion freeze and a reconnect notice appears. After reconnection the UI adopts the backend's authoritative state.
- Reset invalidates older requests and responses. One backend process maintains one shared demonstration for all connected browser tabs; it is not a multi-user production task service.
- Scene diagnostics remain in `/demo/scene.warnings` for operators. They are not shown to end users.
- Movement follows the scheduler's topology and timetable, including pickup/delivery holds; it does not demonstrate physical navigation or collision safety on real robots. Uncollected conflict-efficiency and elevator metrics are omitted from the dashboard.

## Verification

```sh
npm test
npm run build
```

Backend regressions and API tests are documented in its `demo/README.md`. The `public/maps` assets use the same sequential zone names as the backend; the running demo loads its versioned scene and map assets exclusively from the backend.

## Reading locations

Orders, robot positions, routes and hover details use **Floor · Point**, such as `4F · P1`. Each floor has its own continuous numbering: 4F has P1–P11 and 5F has P1–P5. Start and End options are grouped by floor and sorted numerically. One physical location appears only once, including shared connection points. Moving robots show the points they are travelling between.

The staircase between floors is shown as `Stairs 4F–5F`, with internal waypoints S1–S5. It is not an extra floor or an order destination. **All Floors** includes the stairway; a single-floor view shows that floor and its landing.

The legend uses green navigation points, purple stair waypoints, yellow robots and cyan selected routes. Hover for the location, adjacent places, robot state, current task, remaining time and physical position in metres. Hidden objects cannot trigger a tooltip. The visual height exaggeration does not change reported physical coordinates.

Internal map/node identifiers remain in API data for planning and resource loading. The public `locations` catalogue and `nodeLocations` mapping supply the names displayed in the UI. The frontend never falls back to showing raw identifiers for an unknown location.
