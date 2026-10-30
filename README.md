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

1. Click **重置演示 / Reset Demo**. The scene starts with eight idle robots and no historical tasks.
2. Click **新建任务 / New Task**, name the delivery and choose `4F · P1` → `5F · P3`. Submit.
3. The selected order shows its assigned robot, execution duration, planned start/finish, full algorithm route and remaining time. The route includes the staircase between floors.
4. Pause to explain the assignment; robot motion, progress and waiting counters stop together. Resume and switch to **5×** or **10×** to finish within the presentation.
5. Switch to **任务 / Tasks** to show task filters, **Task Timeline (Gantt)** and **Task Logs**. Submit orders repeatedly to demonstrate queued work. Waiting orders display their reason, elapsed wait and expected start; they leave the queue when execution begins.
6. Switch to **总览 / Overview** to show completion count, completion rate, average completion time and robot utilization changing with the same orders. Completed robots remain at their destinations.
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

## Unified workspace and preferences

The application defaults to **Chinese** and the **light theme**. The header switches Chinese / English and light / dark; the theme also updates the 3D scene, grid, points, routes and robot labels. These controls change frontend presentation only. User-entered names/notes and robot/location identifiers are preserved. **Log messages and log timestamps always remain English**, including when the surrounding interface is Chinese; planner failure diagnostics are displayed as safe English reason summaries. The backend API and log format are unchanged.

Overview (`/`) and Tasks (`/tasks`, including `?filter=waiting`) share one mounted map, robot panel and bottom map toolbar. Switching views preserves the camera, floor/object visibility, selected task and simulation. Tasks adds the filterable list, timeline and log actions in the left rail. Selecting an order opens its detailed schedule and route in the left rail, leaving the centre of the map clear.

The task card combines state counts, completion rate, session total, average completion and failed count. Robot utilization is a percentage only. Each card header collapses its contents; edge arrows hide or restore an entire rail. **专注地图 / Focus map** hides both rails temporarily; exiting restores their previous state. New Task stays accessible at the bottom left. Floor/object controls, Reset View and the initially closed legend are at the bottom of the map.

Language, theme, card folds and desktop rail visibility are remembered locally in this browser (`rcss-ui-v1`). Invalid or unavailable storage falls back to Chinese/light and in-memory preferences. Resetting the demonstration clears tasks and simulation state but preserves these interface choices. On phones the map remains full screen and bottom Task / Robot buttons open mutually exclusive, internally scrollable drawers; both start closed. The New Task form is keyboard accessible, traps modal focus and closes with Escape.

### UI verification

`npm test` additionally checks preference recovery, translation coverage, safe location/error display, English-only log rendering and in-place 3D theme changes. Browser validation covers the same-floor and cross-floor order loop from both views, queued tasks, clock freeze/reconnect, preserved map/camera across view switches, four language/theme combinations, card/rail folding, and desktop/mobile layouts.

### Map camera controls

Drag to orbit, right-drag to pan freely along a horizontal plane, and scroll to zoom around the mouse pointer (pinch around the fingers on touch screens). Panning and cursor zoom do not pull the view back towards the scene centre. Orbit elevation stays between 25° and 75° above the map. Zoom distance limits scale with the visible map bounds, keeping the camera above the highest visible floor. Switching floors updates these limits without resetting the viewing direction. Reset View restores the overview and clears remaining drag inertia so the camera stops drifting.
