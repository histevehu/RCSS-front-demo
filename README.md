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

The legend uses green navigation points, purple stair waypoints, blue idle robots, red executing robots and bright yellow selected routes. Hover for the location, adjacent places, robot state, current task, remaining time and physical position in metres. Hidden objects cannot trigger a tooltip. The visual height exaggeration does not change reported physical coordinates.

Internal map/node identifiers remain in API data for planning and resource loading. The public `locations` catalogue and `nodeLocations` mapping supply the names displayed in the UI. The frontend never falls back to showing raw identifiers for an unknown location.

## Unified workspace and preferences

The application defaults to **Chinese** and the **light theme**. The header switches Chinese / English and light / dark; the theme also updates the 3D scene, grid, points, routes and robot labels. These controls change frontend presentation only. User-entered names/notes and robot/location identifiers are preserved. **Log messages and log timestamps always remain English**, including when the surrounding interface is Chinese; planner failure diagnostics are displayed as safe English reason summaries. The backend API and log format are unchanged.

The single scheduling workspace lives at `/`. Legacy `/tasks` links redirect to it with query parameters and hash preserved; there are no duplicate page tabs. The workspace keeps exactly two left panels: **Task overview / 任务概览** and **Task records / 任务记录**. Records default to all orders. Five compact status controls show live counts; Urgent and Today remain in More filters. Overview counts filter the records in place, highlight the active status and clear it when clicked again. Empty filtered results offer Show all tasks. Timeline and log actions remain in the records panel. Filter changes preserve the map, camera and selected task. Selecting an order opens a compact inspector above the bottom map toolbar; expand it for the schedule and route, or close it to clear the selection. Selection never inserts content into the left rail or moves the records panel.

The task card combines state counts, completion rate, session total, average completion and failed count. Robot utilization is a percentage only. Desktop rails have fixed viewport boundaries and never scroll as a whole. Only task records and, when the viewport truly cannot fit the roster, the robot list scroll internally; filters and utilization remain fixed. The robot panel fills the available height and shows all eight robots without scrolling at normal desktop heights. Each card header collapses its contents; labelled edge buttons hide an entire rail. A collapsed rail keeps its card titles and live counts visible; clicking a title restores the rail and expands that card. **专注地图 / Focus map** hides both rails temporarily; exiting restores their previous state. New Task stays accessible at the bottom left. Floor/object controls, Reset View and the initially closed legend are at the bottom of the map.

Language, theme, card folds and desktop rail visibility are remembered locally in this browser (`rcss-ui-v1`). Invalid or unavailable storage falls back to Chinese/light and in-memory preferences. Resetting the demonstration clears tasks and simulation state but preserves these interface choices. On phones the map remains full screen and bottom Task / Robot buttons open mutually exclusive drawers with the same panel-local scrolling; both start closed. The New Task form is keyboard accessible, traps modal focus and closes with Escape.

### UI verification

`npm test` additionally checks preference recovery, translation coverage, safe location/error display, English-only log rendering and in-place 3D theme changes. Browser validation covers the same-floor and cross-floor order loop from both views, queued tasks, clock freeze/reconnect, preserved map/camera across view switches, four language/theme combinations, card/rail folding, and desktop/mobile layouts.

### Map camera controls

Drag to orbit, right-drag to pan freely along a horizontal plane, and scroll to zoom around the mouse pointer (pinch around the fingers on touch screens). Panning and cursor zoom do not pull the view back towards the scene centre. Orbit elevation stays between 15° and 85° above the map. Zoom distance limits scale with the visible map bounds, keeping the camera above the highest visible floor. Switching floors updates these limits without resetting the viewing direction. Reset View restores the overview and clears remaining drag inertia so the camera stops drifting.

Robots and navigation markers use translucent materials so overlapping objects are easier to distinguish. Selecting a task recolours its existing topology edges to solid bright yellow in both themes, preserving their original shape and thickness. No translucent overlay or glow tube is added; deselection restores the original edge colours. Click/tap the map away from the highlighted route to deselect its task; route clicks, camera drags, right-drag panning and multi-touch gestures retain the selection. Sidebar and toolbar controls do not deselect tasks.

Selecting a task first checks every planned curve sample against the current unobscured viewport (including the selected-task inspector and marker padding). If the full route is already visible, camera position, orientation, zoom and floor selection stay unchanged; only a partially hidden or off-screen route triggers framing. The camera compares multiple safe overhead directions and chooses a close-fitting view, accounting for side panels, header and bottom tools. Floor selection is preserved while it includes the route; a hidden same-floor route selects its floor, and a hidden cross-floor route switches to All Floors. On phones, selecting an order closes the task drawer so the full route is visible. Newly assigned orders focus once their planned path is available, and reselecting the same order restores framing only if manual navigation has moved its route out of view. Polling and theme changes do not repeatedly move the camera; free pan, orbit and pointer-centred zoom remain available after focusing.


### Capability-based demo allocation

Task type now derives its required capability from the backend scene catalogue. The order form shows that requirement and the currently capable robots; this is eligibility, not a promise of allocation. The robot roster and map hover show each robot's supported capabilities. Expanded selected-task details show the requirement, assignment-time capabilities and the real matching result. These virtual profiles do not describe physical robot models.

Delivery: R1/R2/R7; Pickup: R3/R4/R7; Sample: R5/R8; Document: R6/R8. Other requires Special operation, which no demo robot currently supports: submitting it demonstrates a failed allocation with NO_CAPABLE_ROBOT. Retry retains the same requirement. UI names follow the selected language; event logs remain English. Explicit API capability overrides must match task type.


Map navigation allows a 5°–75° polar-angle range (15°–85° elevation), closer overhead inspection and a wider zoom-out range. Camera height is protected dynamically at the current angle rather than reserving distance for the shallowest angle. Horizontal panning and cursor-centred zoom remain free. Pale translucent architecture and a quiet grid give priority to navigation points, topology, yellow planned routes and robot state. Hiding Robots hides unselected robots; the robot assigned to the selected task remains visible on its visible floor, including for queued or completed tasks. Deselecting returns to the global visibility setting. Red indicates actual execution state, not merely selection.


Navigation markers show user-facing labels (Floor · Point; S1–S5 on stairs). Label text uses the same node/stair colours as the legend and updates with the theme. Shared locations have one label. Labels maintain a readable screen size; overlapping text is suppressed when zoomed out and recovers automatically when zoomed in, without hiding the marker itself. Robot label text follows the blue idle / red executing colours. Floor visibility also hides its labels.
