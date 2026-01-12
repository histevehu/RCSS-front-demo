# 拓扑模式 3D 地图复现说明书（含：关系描述文件导出）
版本：v1.0

本文目标：把“拓扑模式的多地图 3D 可视化”从当前项目中抽离出来，让你在其它项目中**直接复现 3D 地图相关部分**（不包含任务编辑/模板/执行等业务）。

参考项目的位置 `/Users/wangxiaojiang/Documents/YHB/code_project/yhb_-mlcts/web`

参考实现代码位置（本项目）：
- 3D 主实现：`src/plugin/robot/components/go2W/TopologyNetworkDialog.vue`
- PGM 解析：`src/plugin/robot/utils/pgmParser.js`
- 文件 URL 处理（可选）：`src/plugin/robot/utils/fileUrl.js`

---

## 1. 范围与非范围

### 1.1 本文覆盖（你在其它项目需要复现的）
1. **多地图加载**：PGM + YAML + 导航点（waypoints）
2. **跨地图对齐**：通过跨地图连接点（linked waypoint）计算 offset/rotation
3. **3D 渲染**（Three.js）：
   - 平面模式：PGM 贴图 + 边框
   - 立体模式：PGM 障碍物（黑色像素）挤出为墙体 +（可选）地板
   - 导航点 3D marker
   - TOPO 连线（同图内 relatedPoints）
   - 跨地图连线（linkedMapName / linkedWaypointCode）
4. **交互**：OrbitControls、Raycaster 点击选点、详情卡片（可选）
5. **导出关系描述文件**：
   - 导出单地图 `topo_data`（兼容本项目后端结构）
   - 导出全网拓扑关系 `topology-network.json`（推荐跨项目复用）

### 1.2 明确不覆盖（按你的要求剔除）
- 任务编辑/任务配置对话框/模板/执行等一切业务（在参考文件中存在，但复现时不要带走）。

---

## 2. 依赖与技术栈

### 2.1 必需依赖
- `three`（本项目使用 `^0.180.0`）
- `three/examples/jsm/controls/OrbitControls.js`
- `axios`（拉取 YAML/PGM/JSON）
- `js-yaml`（解析 YAML）

### 2.2 可选依赖
- `file-saver`（用于导出 JSON 文件；本项目已包含）

---

## 3. 数据模型（最小字段定义）

为了在其它项目复现，你只需要保证输入的数据满足以下结构（字段可多不可少）。

### 3.1 Map 数据结构（建议 TypeScript 接口）

- `mapName: string` 地图名称（跨图链接的主键）
- `floor?: number` 楼层（可选；用于立体模式的分层展示/导出）
- `mapType?: string` 可选：例如 `stair`（楼梯地图）
- `yamlUrl?: string` 或 `yamlText?: string`
- `pgmUrl?: string` 或 `pgmArrayBuffer?: ArrayBuffer`
- `waypoints: Waypoint[]`

运行时派生字段（渲染器内部生成）：
- `mapConfig: { resolution: number; origin: [number, number, number?] }`（从 YAML 得到；至少需要 `resolution` 和 `origin`）
- `pgmCanvas: HTMLCanvasElement`（从 PGM 得到）
- `pgmWidth, pgmHeight: number`
- `offset: { x:number; y:number; z:number }`（跨图对齐算法输出，单位：米）
- `rotation: number`（跨图对齐算法输出，单位：弧度）
- `visible: boolean`（可选）

### 3.2 Waypoint 数据结构（最小字段）
- `name: string`
- `code: string`：点位编码（TOPO 关系引用用）
- `x: number, y: number, z?: number`：单位米，坐标系见后文
- `heading?: number`：航向角（建议：弧度）
- `pointType?: string`：'1' 起点 / '2' 终点 / '3' 中间点（仅用于显示/分类）
- `relatedPoints?: string[]`：同图内 TOPO 相邻点 code 列表
- `linkedMapName?: string`：跨地图连接的目标地图名
- `linkedWaypointCode?: string`：跨地图连接的目标点 code
- `reverse?: boolean`：跨图连接方向（用于业务/机器人端）

---

## 4. 坐标系与关键转换（非常重要）

你的 3D 可视化是否“对齐、方向正确”，99% 由坐标系转换是否一致决定。

### 4.1 三个坐标系
1. **PGM 像素坐标**：
   - x：从左到右增加
   - y：从上到下增加

2. **地图/导航点坐标（ROS Map frame 常见习惯）**：
   - x：向右
   - y：向上
   - 单位：米
   - YAML `origin` 和 `resolution` 用于将像素坐标转换为米

3. **Three.js 世界坐标**（本项目约定）：
   - X：沿用 map x
   - Y：作为高度（来自 map z，并乘以 Z_SCALE）
   - Z：使用 `-mapY`（把 map 的 y 映射到 three 的 -z）

### 4.2 本项目使用的核心变换公式

#### 4.2.1 像素 -> 地图坐标（米）
当你从 PGM 逐像素建障碍物/地板时，使用：
- `worldX = origin[0] + (x + 0.5) * resolution`
- `worldY = origin[1] + (height - y - 0.5) * resolution`

说明：`height - y - 0.5` 是因为像素 y 向下，而地图 y 向上，需要镜像。

#### 4.2.2 地图坐标（米）-> Three.js 坐标
- `threeX = mapX`
- `threeY = mapZ * Z_SCALE`（楼层高度视觉缩放）
- `threeZ = -mapY`

### 4.3 Z_SCALE（楼层视觉缩放）
参考实现中常量：`Z_SCALE = 3`。
- 含义：把“真实 z 高度（米）”在 three 中放大（或缩小），让楼层间距更容易看清。
- 注意：如果你的点位 z 本来就是“楼层号 * 某个间距”，你可能不需要太大的 Z_SCALE。

---

## 5. PGM/YAML 的加载与解析

### 5.1 解析 YAML
- 通过 `axios.get(yamlUrl, { responseType: 'text' })`
- 用 `js-yaml`：`yaml.load(text)`

你至少要拿到：
- `resolution: number`
- `origin: [x, y, yaw?]`

### 5.2 解析 PGM（浏览器端）
参考实现：`src/plugin/robot/utils/pgmParser.js`
- `parsePGM(arrayBuffer) -> {width,height,maxval,pixels}`
- `pixelsToCanvas(pixels,width,height) -> canvas`

建议在其它项目中直接复制 `parsePGM` + `pixelsToCanvas` 即可。

---

## 6. 多地图跨图对齐算法（核心：calculateMapOffsets）

目的：把多个地图放到同一个 3D 世界中，并保证“跨地图连接点”在空间上重合。

### 6.1 数据前提（否则无法对齐）
1. 每张地图至少有 1 个 waypoint 指向另一张地图：
   - `linkedMapName + linkedWaypointCode`
2. 被指向地图存在对应 code 的 waypoint。
3. 两个连接点描述的是**同一个实际位置**。
4. `heading` 需要一致的单位（建议：弧度）。

### 6.2 计算逻辑（广度优先 BFS）
以主地图为根（offset=0, rotation=0），逐张扩展。

对一条跨图连接：sourceMap 的 waypoint A 连接到 targetMap 的 waypoint B
1. 旋转对齐：
   - `rotationDiff = sourceHeading - targetHeading`
   - `targetMap.rotation = currentMap.rotation + rotationDiff`

2. 平移对齐：
   - 计算 A 在世界坐标的（x,y）：对 A(x,y) 施加 currentMap.rotation，再加 currentMap.offset
   - 计算 B 在 targetMap 旋转后的位置：对 B(x,y) 施加 targetMap.rotation
   - `targetMap.offset = sourceWorld - rotatedTarget`

3. 高度对齐（z）：
   - `targetMap.offset.z = currentMap.offset.z + (sourceWp.z - targetWp.z)`

> 这套逻辑在参考实现中已经写好，你在其它项目只要保持 waypoint 坐标系一致即可。

### 6.3 注意事项
- 如果一个地图存在多条跨图连接，BFS 只会用“第一次遇到的连接”来定位该地图；如果你希望多条约束都生效，需要做约束优化（非本文范围）。

---

## 7. Three.js 渲染器：初始化（init3DScene）

### 7.1 推荐配置（与参考实现一致）
- Scene：背景色 + Fog（雾化增强空间层次）
- Camera：`PerspectiveCamera(60, width/height, 0.1, 1000)`
- Renderer：
  - `antialias: true`
  - `powerPreference: 'high-performance'`
  - `precision: 'highp'`
  - `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`
  - `shadowMap.enabled = true`
- Controls：OrbitControls（阻尼 + 最小/最大距离）
- Lights：Ambient + 2 个 Directional（主光 + 补光）
- Raycaster：用于点击拾取 waypoint
- 动画循环：`requestAnimationFrame` + `controls.update()` + `renderer.render()`

### 7.2 容器尺寸
必须在 container（canvasWrapper）有明确宽高时初始化；否则会出现黑屏或视口为 0。

---

## 8. 场景渲染（render3DScene）

核心思想：每张地图对应一个 `mapGroup`，mapGroup 承担“世界变换”（offset、rotation、楼层高度），组内对象用地图局部坐标绘制。

### 8.1 mapGroup 世界变换
参考实现：
- `mapGroup.position = (offset.x, offset.z * Z_SCALE, -offset.y)`
- `mapGroup.rotation.y = map.rotation`

### 8.2 平面模式：PGM 贴图
1. `texture = new THREE.CanvasTexture(pgmCanvas)`
2. `PlaneGeometry(mapWidthWorld, mapHeightWorld)`
3. 材质：`MeshStandardMaterial({ map:texture, transparent:true, opacity:0.8 })`
4. 放到水平面：`mesh.rotation.x = -Math.PI/2`
5. 位置：
   - `mesh.position.x = origin[0] + mapWidthWorld / 2`
   - `mesh.position.z = -(origin[1] + mapHeightWorld / 2)`

### 8.3 立体模式：障碍物挤出 + 地板（可选）
#### 8.3.1 障碍物（墙体）
- 从 `pgmCanvas.getImageData()` 获取像素灰度
- 判定阈值：参考实现用 `gray < 200` 当成障碍（你可以按实际地图调整）
- 用 `InstancedMesh(BoxGeometry)` 批量渲染，性能远好于逐点 Mesh

#### 8.3.2 地板（自由空间）
参考实现做了“同楼层全局室内外判定”，再只在室内区域铺地板。
- 优点：不会把室外区域铺满地板，视觉更真实
- 缺点：计算开销较大（适合在加载/切换时计算，不要每帧算）

如果你想先快速复现：可以先不做室内外判定，直接把 `gray>=200` 当作地板即可。

### 8.4 导航点（Waypoints）
每个 waypoint 是一个 `THREE.Group()`，包含：
- 阴影圆盘
- 圆柱主体
- 发光环
- 方向箭头（根据 heading）

位置：
- `group.position.set(wp.x, (wp.z||0)*Z_SCALE, -wp.y)`

为了点击拾取：
- 给 group 加 `userData.isWaypoint = true`
- 并放入 `waypointData / mapData / waypointIndex`

### 8.5 TOPO 连线（同地图内部）
- 读取 `wp.relatedPoints`，找到同图内 `code` 对应的点
- 用 TubeGeometry 画一条轻微弧线（更好看）

### 8.6 跨地图连线（连接不同 mapGroup）
跨图线必须在“世界坐标”里算点：
1. 先把 source waypoint (x,y) 旋转到 sourceMap 世界坐标
2. 加 sourceMap.offset
3. 再映射到 three 坐标（y 用 zScale）

参考实现用 TubeGeometry（紫色发光管道）。

---

## 9. 交互（OrbitControls + Raycaster 点击拾取）

### 9.1 拾取流程
1. 由鼠标事件计算 NDC：
   - `mouse.x = (clientX - rect.left)/rect.width * 2 - 1`
   - `mouse.y = -((clientY - rect.top)/rect.height * 2 - 1)`
2. `raycaster.setFromCamera(mouse, camera)`
3. `intersectObjects(scene.children, true)`
4. 从 intersect.object 向上找父节点，直到命中 `userData.isWaypoint`

### 9.2 详情卡片（可选）
参考实现方式：
- 取选中点的 three world position
- `vector.project(camera)` 变换到屏幕
- 用 HTML 浮层显示详情
- 用一个 overlay canvas 画虚线连接（仅 UI，不影响 3D）

如果你只要 3D 地图，不需要详情卡片，可以完全去掉。

---

## 10. 关系描述文件（导出方案）

你提出的“可导出关系描述文件”，建议提供两种导出：
1. **兼容本项目后端/机器人端**的 `topo_data`（单地图级别）
2. **跨项目复用**的 `topology-network.json`（全网级别，推荐）

### 10.1 兼容结构：TopoData（单地图）
参考实现（在 `TopologyNetworkDialog.vue` 中保存时构建）：

```json
{
  "node_list": [
    {
      "node_name": "p1",
      "floor": 1,
      "param": [
        12.34,
        56.78,
        0,
        1.57,
        "p2,p3"
      ],
      "node_type": "3",
      "connect": [
        {
          "map_name": "mapB",
          "floor": -1000,
          "reverse": false,
          "target_node": "p9"
        }
      ]
    }
  ]
}
```

字段说明：
- `node_name`：waypoint.code
- `floor`：地图楼层（`map.floor`）
- `param`：数组（强约定）：
  - `param[0] = x`
  - `param[1] = y`
  - `param[2] = z`
  - `param[3] = heading`（建议弧度）
  - `param[4] = relatedPoints`（逗号拼接字符串）
  - `param[5...]`：历史兼容字段（可不填）
- `node_type`：点类型（'1'/'2'/'3'）
- `connect`：跨地图连接（可选）

> 注意：参考实现里 `relatedPoints` 在保存时写入 `param[4]`，在加载 topo_data 时再 split 回数组。

### 10.2 推荐结构：TopologyNetwork（全网）

为跨项目复现更友好，建议导出一个全网文件，包含：
- maps：每张地图的 offset/rotation（用于重建 3D 布局）
- nodes：每个点的完整信息
- edges：把 `relatedPoints` / `connect` 统一成边列表（方便其它项目使用图算法）

推荐 JSON 结构（可直接照抄）：

```json
{
  "schema": "topology-network@1",
  "generatedAt": "2026-01-12T00:00:00Z",
  "zScale": 3,
  "maps": [
    {
      "mapName": "mapA",
      "floor": 1,
      "mapType": "normal",
      "transform": {
        "offset": {"x": 0, "y": 0, "z": 0},
        "rotation": 0
      },
      "mapConfig": {"resolution": 0.05, "origin": [-10, -10, 0]},
      "pgm": {"width": 1000, "height": 800}
    }
  ],
  "nodes": [
    {
      "id": "mapA:p1",
      "mapName": "mapA",
      "code": "p1",
      "name": "点位1",
      "x": 1.0,
      "y": 2.0,
      "z": 0,
      "heading": 1.57,
      "pointType": "3"
    }
  ],
  "edges": [
    {"type": "topo", "from": "mapA:p1", "to": "mapA:p2"},
    {"type": "crossMap", "from": "mapA:p3", "to": "mapB:p9", "reverse": false}
  ]
}
```

### 10.3 导出实现（浏览器端下载 JSON）

你可以在任何页面/组件里加一个“导出”按钮，触发下载。

#### 10.3.1 构建单地图 topo_data
伪代码（从参考实现中抽离，去掉任务部分）：

```js
function buildTopoDataForMap(map) {
  return {
    node_list: (map.waypoints || []).map(wp => {
      const node = {
        node_name: wp.code,
        floor: map.floor || 0,
        param: [
          wp.x,
          wp.y,
          wp.z || 0,
          Number((wp.heading || 0).toFixed(2)),
          (wp.relatedPoints || []).join(',')
        ],
        node_type: wp.pointType || '3'
      }

      if (wp.linkedMapName && wp.linkedWaypointCode) {
        node.connect = [{
          map_name: wp.linkedMapName,
          floor: -1000,
          reverse: !!wp.reverse,
          target_node: wp.linkedWaypointCode
        }]
      }

      return node
    })
  }
}
```

#### 10.3.2 构建全网 topology-network.json

```js
function buildTopologyNetwork(allMaps, zScale) {
  const maps = allMaps.map(m => ({
    mapName: m.mapName,
    floor: m.floor ?? 0,
    mapType: m.mapType || 'normal',
    transform: {
      offset: { x: m.offset?.x || 0, y: m.offset?.y || 0, z: m.offset?.z || 0 },
      rotation: m.rotation || 0
    },
    mapConfig: m.mapConfig ? { resolution: m.mapConfig.resolution, origin: m.mapConfig.origin } : null,
    pgm: m.pgmWidth && m.pgmHeight ? { width: m.pgmWidth, height: m.pgmHeight } : null
  }))

  const nodes = []
  const edges = []

  for (const m of allMaps) {
    for (const wp of (m.waypoints || [])) {
      const id = `${m.mapName}:${wp.code}`
      nodes.push({
        id,
        mapName: m.mapName,
        code: wp.code,
        name: wp.name,
        x: wp.x,
        y: wp.y,
        z: wp.z || 0,
        heading: wp.heading || 0,
        pointType: wp.pointType || '3'
      })

      // topo edges（同图）
      for (const toCode of (wp.relatedPoints || [])) {
        edges.push({
          type: 'topo',
          from: id,
          to: `${m.mapName}:${toCode}`
        })
      }

      // cross-map edge
      if (wp.linkedMapName && wp.linkedWaypointCode) {
        edges.push({
          type: 'crossMap',
          from: id,
          to: `${wp.linkedMapName}:${wp.linkedWaypointCode}`,
          reverse: !!wp.reverse
        })
      }
    }
  }

  return {
    schema: 'topology-network@1',
    generatedAt: new Date().toISOString(),
    zScale,
    maps,
    nodes,
    edges
  }
}
```

#### 10.3.3 下载文件（两种方式）

方式 A：原生 Blob + a 标签

```js
function downloadJson(obj, filename) {
  const text = JSON.stringify(obj, null, 2)
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

方式 B：file-saver（更省事）

```js
import { saveAs } from 'file-saver'

function downloadJson(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json;charset=utf-8' })
  saveAs(blob, filename)
}
```

---

## 11. 在其它项目中“最小复现”的推荐拆分方式

> 建议你不要直接复制整个 `TopologyNetworkDialog.vue`（它包含大量任务 UI）。
> 你应该把 3D 相关逻辑提炼成一个“渲染器类 + 简洁组件”。

### 11.1 推荐文件拆分
1. `topology3d/types.ts`
   - Map/Waypoint 接口定义
2. `topology3d/pgmParser.ts`（或直接复制 `pgmParser.js`）
   - `parsePGM` / `pixelsToCanvas`
3. `topology3d/align.ts`
   - `calculateMapOffsets(allMaps)`
4. `topology3d/renderer.ts`
   - `initScene(container)`
   - `setData(allMaps)`
   - `render()`
   - `dispose()`
5. `components/Topology3DViewer.vue`
   - 只负责容器、按钮开关（显示地图/立体/坐标轴/连线/导出）

### 11.2 你最少要复制/实现哪些函数
从参考实现抽离（只复制以下“3D 相关函数”即可）：
- `init3DScene`
- `cleanup3DScene`
- `loadSingleMap`（去掉任务加载即可）
- `calculateMapOffsets`
- `render3DScene`
- `create3DObstaclesFromPGM`（立体模式）
- `create3DFloorFromPGM`（可选）
- `create3DWaypoint`
- `createTopoLine`
- `renderCrossMapLinks`
- `handleCanvasClick`（可选：拾取）

---

## 12. 性能建议与常见问题

### 12.1 性能建议
- **障碍物/地板必须使用 InstancedMesh**（否则点数一大就卡死）
- `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`
- 立体模式下尽量降低采样率（例如 `sampleRate = 2/4`）
- 避免在动画循环里做像素遍历（像素遍历应只在加载时执行）

### 12.2 常见问题排查
1. 黑屏
   - container 宽高为 0
   - camera aspect 未更新
   - renderer 未 append 到 DOM

2. 地图倒置/镜像
   - 你忘了 `threeZ = -mapY`
   - 像素转换时忘了 `height - y - 0.5`

3. 跨地图对不齐
   - linked waypoint 不是同一物理点
   - heading 单位不是弧度（需要 `deg * Math.PI/180`）

4. 内存上涨
   - 退出页面未调用 `dispose()`
   - geometry/material/texture 没有 dispose

---

## 13. 你可以直接复用的“最终交付物”清单

当你在其它项目复现完成后，建议最终交付 2 个导出文件：
1. `topo_data-<mapName>.json`：每张地图一份（兼容本项目 topo_data 结构）
2. `topology-network.json`：全网一份（包含 maps/nodes/edges + offset/rotation + zScale）

这样其它项目不需要依赖你的后端接口，也能直接加载并重建 3D 拓扑网络。
