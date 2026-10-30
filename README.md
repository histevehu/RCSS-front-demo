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
2. Click **New Task**, name the delivery and choose `floot_1 · p1` → `floot_2 · p3`. Submit.
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
- The packaged scene contains one stale portal (`floot_1:p1` → nonexistent `floot4_inner:p6`), reported in `/demo/scene.warnings` and ignored. Its valid `floot4_inner:p5` connection remains. No elevator links are invented.
- Movement follows the scheduler's topology and timetable, including pickup/delivery holds; it does not demonstrate physical navigation or collision safety on real robots. Unsupported conflict-efficiency and elevator metrics show `—`.

## Verification

```sh
npm test
npm run build
```

Backend regressions and API tests are documented in its `demo/README.md`. The original `public/maps` assets remain as historical source; the running demo loads its versioned scene and map assets exclusively from the backend.
