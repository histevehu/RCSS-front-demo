/**
 * Three.js 3D 地图渲染器
 */

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// 常量配置
const Z_SCALE = 3 // 楼层高度缩放
const OBSTACLE_THRESHOLD = 200 // 灰度值小于此值视为障碍物
const WALL_HEIGHT = 1.5 // 墙体高度（米）
const SAMPLE_RATE = 1 // 像素采样率（每 N 个像素采样一次）

/**
 * 3D 渲染器类
 */
export class Map3DRenderer {
  constructor(container, { showCrossMapLinks = true } = {}) {
    this.showCrossMapLinks = showCrossMapLinks
    this.container = container
    this.scene = null
    this.camera = null
    this.renderer = null
    this.controls = null
    this.animationId = null
    this.mapGroups = new Map() // mapName -> THREE.Group
    this.allMaps = []
  }

  /**
   * 初始化 3D 场景
   */
  init() {
    const width = this.container.clientWidth || 800
    const height = this.container.clientHeight || 600

    // 场景 - 深色背景匹配主题
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0a0e14)
    this.scene.fog = new THREE.Fog(0x0a0e14, 100, 280)

    // 相机
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    this.camera.position.set(30, 40, 50)
    this.camera.lookAt(0, 0, 0)

    // 渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    })
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.container.appendChild(this.renderer.domElement)

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.minDistance = 5
    this.controls.maxDistance = 200

    // 灯光
    this.setupLights()

    // 坐标轴辅助
    const axesHelper = new THREE.AxesHelper(10)
    this.scene.add(axesHelper)

    // 网格
    const gridHelper = new THREE.GridHelper(100, 100, 0x444444, 0x222222)
    this.scene.add(gridHelper)

    // 开始动画循环
    this.animate()

    // 窗口大小变化处理
    this.resizeHandler = () => this.onResize()
    window.addEventListener('resize', this.resizeHandler)
  }

  /**
   * 设置灯光 - 明亮自然光
   */
  setupLights() {
    // 强环境光
    const ambient = new THREE.AmbientLight(0xffffff, 1.0)
    this.scene.add(ambient)

    // 主光源
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8)
    mainLight.position.set(20, 40, 20)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 2048
    mainLight.shadow.mapSize.height = 2048
    mainLight.shadow.camera.near = 0.5
    mainLight.shadow.camera.far = 500
    this.scene.add(mainLight)

    // 补光
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4)
    fillLight.position.set(-20, 30, -20)
    this.scene.add(fillLight)
  }

  /**
   * 动画循环
   */
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate())
    this.onFrame?.()
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  /**
   * 窗口大小变化
   */
  onResize() {
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  /**
   * 设置地图数据并渲染
   * @param {Array} allMaps 地图数据数组
   */
  setData(allMaps) {
    this.allMaps = allMaps
    this.render()
  }

  /**
   * 渲染所有地图
   */
  render() {
    // 清除旧的地图组
    this.mapGroups.forEach(group => this.scene.remove(group))
    this.mapGroups.clear()

    // 计算全局室内地图（按楼层分组）
    const globalIndoorMaps = this.calculateGlobalIndoorMaps()

    // 渲染每个地图
    for (const map of this.allMaps) {
      if (!map.visible) continue

      const mapGroup = new THREE.Group()
      mapGroup.name = map.mapName

      // 设置地图组的世界变换
      mapGroup.position.set(
        map.offset.x,
        map.offset.z * Z_SCALE,
        -map.offset.y
      )
      mapGroup.rotation.y = map.rotation

      // 楼梯地图不渲染 PGM（墙体和地板），只渲染导航点
      const isStairMap = map.mapName.toLowerCase().includes('stair')
      
      if (!isStairMap) {
        // 渲染 3D 障碍物
        this.renderObstacles(mapGroup, map)

        // 渲染地板（使用全局室内地图）
        const floorKey = Math.round(map.offset.z * 10) / 10 // 四舍五入到0.1精度
        const globalIndoorMap = globalIndoorMaps.get(floorKey)
        this.renderFloor(mapGroup, map, globalIndoorMap)
      }

      // 渲染导航点
      this.renderWaypoints(mapGroup, map)

      // 渲染同图连线
      this.renderTopoLines(mapGroup, map)

      this.scene.add(mapGroup)
      this.mapGroups.set(map.mapName, mapGroup)
    }

    // 渲染跨地图连线
    if (this.showCrossMapLinks) this.renderCrossMapLinks()

    // 自动调整相机
    this.fitCamera()
  }

  /**
   * 计算全局室内地图（按楼层分组）
   * 将同一楼层的所有地图障碍物合并，然后进行洪水填充
   */
  calculateGlobalIndoorMaps() {
    const globalMaps = new Map()
    
    // 按楼层分组
    const floorGroups = new Map()
    for (const map of this.allMaps) {
      if (!map.visible || !map.pgmPixels || !map.mapConfig) continue
      if (map.mapName.toLowerCase().includes('stair')) continue
      
      const floorKey = Math.round(map.offset.z * 10) / 10
      if (!floorGroups.has(floorKey)) {
        floorGroups.set(floorKey, [])
      }
      floorGroups.get(floorKey).push(map)
    }
    
    // 为每个楼层计算全局室内地图
    for (const [floorKey, maps] of floorGroups) {
      const indoorMap = this.computeGlobalIndoorMapForFloor(maps)
      if (indoorMap) {
        globalMaps.set(floorKey, indoorMap)
      }
    }
    
    return globalMaps
  }
  
  /**
   * 计算单个楼层的全局室内地图
   */
  computeGlobalIndoorMapForFloor(maps) {
    if (maps.length === 0) return null
    
    // 1. 找到该楼层所有地图的边界
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity
    
    for (const map of maps) {
      const { resolution, origin } = map.mapConfig
      const width = map.pgmWidth * resolution
      const height = map.pgmHeight * resolution
      
      const cosR = Math.cos(map.rotation)
      const sinR = Math.sin(map.rotation)
      
      // 地图四个角点
      const corners = [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: 0, y: height },
        { x: width, y: height }
      ]
      
      for (const corner of corners) {
        const localX = origin[0] + corner.x
        const localY = origin[1] + corner.y
        const rotatedX = localX * cosR - localY * sinR
        const rotatedY = localX * sinR + localY * cosR
        const worldX = map.offset.x + rotatedX
        const worldY = map.offset.y + rotatedY
        
        minX = Math.min(minX, worldX)
        maxX = Math.max(maxX, worldX)
        minY = Math.min(minY, worldY)
        maxY = Math.max(maxY, worldY)
      }
    }
    
    // 2. 创建全局栅格地图
    const globalResolution = 0.05
    const gridWidth = Math.ceil((maxX - minX) / globalResolution)
    const gridHeight = Math.ceil((maxY - minY) / globalResolution)
    
    if (gridWidth <= 0 || gridHeight <= 0) return null
    
    // 3. 合并所有地图的障碍物到全局栅格
    const globalObstacles = new Array(gridWidth * gridHeight).fill(false)
    
    for (const map of maps) {
      const { pgmPixels, pgmWidth, pgmHeight, mapConfig } = map
      const { resolution, origin } = mapConfig
      const cosR = Math.cos(map.rotation)
      const sinR = Math.sin(map.rotation)
      
      for (let py = 0; py < pgmHeight; py++) {
        for (let px = 0; px < pgmWidth; px++) {
          const gray = pgmPixels[py * pgmWidth + px]
          
          // 如果是障碍物
          if (gray < OBSTACLE_THRESHOLD) {
            const localX = origin[0] + (px + 0.5) * resolution
            const localY = origin[1] + (pgmHeight - py - 0.5) * resolution
            
            const rotatedX = localX * cosR - localY * sinR
            const rotatedY = localX * sinR + localY * cosR
            const worldX = map.offset.x + rotatedX
            const worldY = map.offset.y + rotatedY
            
            const gx = Math.floor((worldX - minX) / globalResolution)
            const gy = Math.floor((worldY - minY) / globalResolution)
            
            if (gx >= 0 && gx < gridWidth && gy >= 0 && gy < gridHeight) {
              globalObstacles[gy * gridWidth + gx] = true
            }
          }
        }
      }
    }
    
    // 4. 形态学膨胀（封闭小缺口）
    const dilationRadius = 3
    const dilatedObstacles = new Array(gridWidth * gridHeight).fill(false)
    
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        if (globalObstacles[y * gridWidth + x]) {
          for (let dy = -dilationRadius; dy <= dilationRadius; dy++) {
            for (let dx = -dilationRadius; dx <= dilationRadius; dx++) {
              const nx = x + dx
              const ny = y + dy
              if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
                const distance = Math.sqrt(dx * dx + dy * dy)
                if (distance <= dilationRadius) {
                  dilatedObstacles[ny * gridWidth + nx] = true
                }
              }
            }
          }
        }
      }
    }
    
    // 5. 洪水填充：从边缘标记室外区域
    const visited = new Array(gridWidth * gridHeight).fill(0)
    const queue = []
    
    // 从四条边缘开始
    for (let x = 0; x < gridWidth; x++) {
      if (!dilatedObstacles[0 * gridWidth + x]) {
        queue.push({ x, y: 0 })
        visited[0 * gridWidth + x] = 1
      }
      if (!dilatedObstacles[(gridHeight - 1) * gridWidth + x]) {
        queue.push({ x, y: gridHeight - 1 })
        visited[(gridHeight - 1) * gridWidth + x] = 1
      }
    }
    
    for (let y = 0; y < gridHeight; y++) {
      if (!dilatedObstacles[y * gridWidth + 0]) {
        queue.push({ x: 0, y })
        visited[y * gridWidth + 0] = 1
      }
      if (!dilatedObstacles[y * gridWidth + (gridWidth - 1)]) {
        queue.push({ x: gridWidth - 1, y })
        visited[y * gridWidth + (gridWidth - 1)] = 1
      }
    }
    
    // BFS
    const directions = [{ dx: -1, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: -1 }, { dx: 0, dy: 1 }]
    
    while (queue.length > 0) {
      const { x, y } = queue.shift()
      
      for (const { dx, dy } of directions) {
        const nx = x + dx
        const ny = y + dy
        
        if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
          const idx = ny * gridWidth + nx
          if (visited[idx] === 0 && !dilatedObstacles[idx]) {
            visited[idx] = 1
            queue.push({ x: nx, y: ny })
          }
        }
      }
    }
    
    return {
      minX,
      minY,
      gridWidth,
      gridHeight,
      resolution: globalResolution,
      indoorMap: visited  // 0=室内，1=室外
    }
  }

  /**
   * 渲染障碍物（墙体）
   */
  renderObstacles(group, map) {
    const { pgmPixels, pgmWidth, pgmHeight, mapConfig } = map
    const { resolution, origin } = mapConfig

    // 收集障碍物位置
    const obstacles = []
    for (let y = 0; y < pgmHeight; y += SAMPLE_RATE) {
      for (let x = 0; x < pgmWidth; x += SAMPLE_RATE) {
        const idx = y * pgmWidth + x
        const gray = pgmPixels[idx]
        if (gray < OBSTACLE_THRESHOLD) {
          obstacles.push({ x, y })
        }
      }
    }

    if (obstacles.length === 0) return

    // 使用 InstancedMesh 批量渲染
    const boxSize = resolution * SAMPLE_RATE
    const geometry = new THREE.BoxGeometry(boxSize, WALL_HEIGHT, boxSize)
    // 半透明墙体材质 - 让路线更清晰
    const material = new THREE.MeshStandardMaterial({
      color: 0xB0C4DE,
      emissive: 0x87CEEB,
      emissiveIntensity: 0.1,
      roughness: 0.6,
      metalness: 0.1,
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    })

    const mesh = new THREE.InstancedMesh(geometry, material, obstacles.length)
    mesh.castShadow = true
    mesh.receiveShadow = true

    const matrix = new THREE.Matrix4()
    const color = new THREE.Color()

    obstacles.forEach((obs, i) => {
      // 像素坐标 -> 地图坐标（米）
      const worldX = origin[0] + (obs.x + 0.5) * resolution
      const worldY = origin[1] + (pgmHeight - obs.y - 0.5) * resolution

      // 地图坐标 -> Three.js 坐标
      matrix.setPosition(worldX, WALL_HEIGHT / 2, -worldY)
      mesh.setMatrixAt(i, matrix)
    })

    mesh.instanceMatrix.needsUpdate = true

    group.add(mesh)
  }

  /**
   * 渲染地板 - 基于全局室内地图判定室内外
   * @param {THREE.Group} group - 地图组
   * @param {Object} map - 地图数据
   * @param {Object} globalIndoorMap - 全局室内地图
   */
  renderFloor(group, map, globalIndoorMap) {
    const { pgmPixels, pgmWidth, pgmHeight, mapConfig } = map
    const { resolution, origin } = mapConfig

    const sampleRate = SAMPLE_RATE
    const tileSize = resolution * sampleRate
    const floorThickness = 0.02

    // 收集室内地板位置
    const floorPositions = []
    
    const cosR = Math.cos(map.rotation)
    const sinR = Math.sin(map.rotation)

    for (let py = 0; py < pgmHeight; py += sampleRate) {
      for (let px = 0; px < pgmWidth; px += sampleRate) {
        const gray = pgmPixels[py * pgmWidth + px]
        
        // 如果是自由空间（白色）
        if (gray >= 200) {
          // 计算该像素在局部坐标系中的位置
          const localX = origin[0] + (px + 0.5) * resolution
          const localY = origin[1] + (pgmHeight - py - 0.5) * resolution
          
          // 如果有全局室内地图，使用全局判定
          if (globalIndoorMap) {
            // 应用地图的rotation和offset得到世界坐标
            const rotatedX = localX * cosR - localY * sinR
            const rotatedY = localX * sinR + localY * cosR
            const worldX = map.offset.x + rotatedX
            const worldY = map.offset.y + rotatedY
            
            // 转换为全局栅格坐标
            const gx = Math.floor((worldX - globalIndoorMap.minX) / globalIndoorMap.resolution)
            const gy = Math.floor((worldY - globalIndoorMap.minY) / globalIndoorMap.resolution)
            
            // 查询全局室内外地图
            if (gx >= 0 && gx < globalIndoorMap.gridWidth && gy >= 0 && gy < globalIndoorMap.gridHeight) {
              const globalIdx = gy * globalIndoorMap.gridWidth + gx
              
              if (globalIndoorMap.indoorMap[globalIdx] === 0) {
                // 全局判定为室内，创建地板（使用局部坐标）
                floorPositions.push({ x: localX, y: localY })
              }
            }
          } else {
            // 如果没有全局地图，所有自由空间都渲染地板
            floorPositions.push({ x: localX, y: localY })
          }
        }
      }
    }

    if (floorPositions.length === 0) return

    const geometry = new THREE.BoxGeometry(tileSize, floorThickness, tileSize)
    const material = new THREE.MeshStandardMaterial({
      color: 0xD6D3CC,
      emissive: 0xE8E6E0,
      emissiveIntensity: 0.08,
      roughness: 0.8,
      metalness: 0.1
    })

    const mesh = new THREE.InstancedMesh(geometry, material, floorPositions.length)
    const matrix = new THREE.Matrix4()

    floorPositions.forEach((pos, i) => {
      matrix.setPosition(pos.x, -0.01, -pos.y)
      mesh.setMatrixAt(i, matrix)
    })

    mesh.instanceMatrix.needsUpdate = true
    mesh.receiveShadow = true
    group.add(mesh)
  }

  /**
   * 渲染导航点
   */
  renderWaypoints(group, map) {
    const wpGroup = new THREE.Group()
    wpGroup.name = 'waypoints'

    for (const wp of map.waypoints) {
      if (wp.renderMarker === false) continue
      const marker = this.createWaypointMarker(wp)
      marker.userData = {
        isWaypoint: true,
        waypoint: wp,
        mapName: map.mapName
      }
      wpGroup.add(marker)
    }

    group.add(wpGroup)
  }

  /**
   * 创建导航点标记 - 增强视觉效果
   */
  createWaypointMarker(wp) {
    const markerGroup = new THREE.Group()

    // 颜色根据点类型
    let color = 0x00b894 // 中间点-绿色
    if (wp.pointType === '1') color = 0x0984e3 // 起点-蓝色
    else if (wp.pointType === '2') color = 0xd63031 // 终点-红色

    // Optional semantic colours supplied by the conference scene.
    if (wp.linkedMapName) color = 0xa29bfe
    if (wp.markerColor !== undefined) color = wp.markerColor

    // 底部阴影圆盘
    const shadowGeometry = new THREE.CircleGeometry(0.3, 32)
    const shadowMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.3
    })
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial)
    shadow.rotation.x = -Math.PI / 2
    shadow.position.y = 0.01
    markerGroup.add(shadow)

    // 主体圆柱
    const cylinderGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 16)
    const cylinderMaterial = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.4,
      metalness: 0.6,
      roughness: 0.3
    })
    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial)
    cylinder.position.y = 0.3
    cylinder.castShadow = true
    markerGroup.add(cylinder)

    // 发光环
    const ringGeometry = new THREE.TorusGeometry(0.2, 0.02, 8, 16)
    const ringMaterial = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.8,
      metalness: 0.8,
      roughness: 0.1
    })
    const ring = new THREE.Mesh(ringGeometry, ringMaterial)
    ring.position.y = 0.55
    ring.rotation.x = Math.PI / 2
    markerGroup.add(ring)

    // 方向箭头
    if (wp.heading !== undefined) {
      const arrowGeometry = new THREE.ConeGeometry(0.08, 0.25, 8)
      const arrowMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xfdcb6e,
        emissive: 0xfdcb6e,
        emissiveIntensity: 0.5
      })
      const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial)
      arrow.rotation.x = Math.PI / 2
      arrow.position.set(0.35, 0.3, 0)
      
      const arrowPivot = new THREE.Group()
      arrowPivot.add(arrow)
      arrowPivot.rotation.y = -wp.heading
      markerGroup.add(arrowPivot)
    }

    // 位置
    markerGroup.position.set(
      wp.x,
      (wp.z || 0) * Z_SCALE,
      -wp.y
    )

    return markerGroup
  }

  /**
   * 渲染同图内 TOPO 连线
   */
  renderTopoLines(group, map) {
    const wpByCode = {}
    map.waypoints.forEach(wp => { wpByCode[wp.code] = wp })

    const lineGroup = new THREE.Group()
    lineGroup.name = 'topoLines'

    const processed = new Set()

    for (const wp of map.waypoints) {
      for (const relatedCode of (wp.relatedPoints || [])) {
        const key = [wp.code, relatedCode].sort().join('-')
        if (processed.has(key)) continue
        processed.add(key)

        const target = wpByCode[relatedCode]
        if (!target) continue

        const line = this.createTubeConnection(wp, target, 0x74b9ff, 0.05)
        lineGroup.add(line)
      }
    }

    group.add(lineGroup)
  }

  /**
   * 创建管道连线
   */
  createTubeConnection(wp1, wp2, color, radius) {
    const start = new THREE.Vector3(wp1.x, (wp1.z || 0) * Z_SCALE + 0.2, -wp1.y)
    const end = new THREE.Vector3(wp2.x, (wp2.z || 0) * Z_SCALE + 0.2, -wp2.y)

    // 计算弧线中点（略微抬高）
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
    mid.y += 0.3

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
    const geometry = new THREE.TubeGeometry(curve, 16, radius, 8, false)
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.8
    })

    return new THREE.Mesh(geometry, material)
  }

  /**
   * 渲染跨地图连线
   */
  renderCrossMapLinks() {
    const mapByName = {}
    this.allMaps.forEach(m => { mapByName[m.mapName] = m })

    const linkGroup = new THREE.Group()
    linkGroup.name = 'crossMapLinks'

    const processed = new Set()

    for (const map of this.allMaps) {
      for (const wp of map.waypoints) {
        if (!wp.linkedMapName || !wp.linkedWaypointCode) continue

        const key = [map.mapName, wp.code, wp.linkedMapName, wp.linkedWaypointCode].sort().join('-')
        if (processed.has(key)) continue
        processed.add(key)

        const targetMap = mapByName[wp.linkedMapName]
        if (!targetMap) continue

        const targetWp = targetMap.waypoints.find(w => w.code === wp.linkedWaypointCode)
        if (!targetWp) continue

        // 计算世界坐标
        const sourceWorld = this.waypointToWorld(wp, map)
        const targetWorld = this.waypointToWorld(targetWp, targetMap)

        // 创建连线
        const start = new THREE.Vector3(sourceWorld.x, sourceWorld.y + 0.3, sourceWorld.z)
        const end = new THREE.Vector3(targetWorld.x, targetWorld.y + 0.3, targetWorld.z)
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
        mid.y += Math.abs(end.y - start.y) * 0.3 + 1

        const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
        const geometry = new THREE.TubeGeometry(curve, 32, 0.08, 8, false)
        const material = new THREE.MeshStandardMaterial({
          color: 0xa29bfe,
          emissive: 0xa29bfe,
          emissiveIntensity: 0.4,
          transparent: true,
          opacity: 0.9
        })

        linkGroup.add(new THREE.Mesh(geometry, material))
      }
    }

    this.scene.add(linkGroup)
  }

  /**
   * Waypoint 坐标转世界坐标
   */
  waypointToWorld(wp, map) {
    // 与 renderWaypoints 中的坐标系保持一致：local=(x, z*Z_SCALE, -y)
    const v = new THREE.Vector3(wp.x, (wp.z || 0) * Z_SCALE, -wp.y)
    v.applyAxisAngle(new THREE.Vector3(0, 1, 0), map.rotation)
    v.add(new THREE.Vector3(map.offset.x, map.offset.z * Z_SCALE, -map.offset.y))

    return { x: v.x, y: v.y, z: v.z }
  }

  /**
   * 自动调整相机以包含所有内容
   * 说明：不要依赖 three.js 的 expandByObject 来算 instanced mesh 的包围盒（会偏小），
   * 我们用地图的 PGM 尺寸/分辨率/原点来估算每张地图的边界，再统一 fit。
   */
  fitCamera() {
    if (this.allMaps.length === 0) return

    const box = new THREE.Box3()
    box.makeEmpty()

    const p = new THREE.Vector3()
    let hasPoint = false

    // 1) 用地图元数据计算整体包围盒（更稳定）
    for (const map of this.allMaps) {
      if (!map?.visible) continue
      if (!map?.mapConfig || !map?.pgmWidth || !map?.pgmHeight) continue

      const resolution = map.mapConfig.resolution || 0.05
      const origin = map.mapConfig.origin || [0, 0, 0]
      const width = map.pgmWidth * resolution
      const height = map.pgmHeight * resolution

      const corners = [
        { x: origin[0], y: origin[1] },
        { x: origin[0] + width, y: origin[1] },
        { x: origin[0], y: origin[1] + height },
        { x: origin[0] + width, y: origin[1] + height },
      ]

      for (const c of corners) {
        const w = this.waypointToWorld({ x: c.x, y: c.y, z: 0 }, map)

        // 地面点
        p.set(w.x, w.y, w.z)
        box.expandByPoint(p)
        hasPoint = true

        // 给一点高度，确保相机视角不会太贴地
        p.set(w.x, w.y + WALL_HEIGHT + 0.8, w.z)
        box.expandByPoint(p)
      }
    }

    // 兜底：如果没有算出任何点，退回旧逻辑
    if (!hasPoint) {
      this.mapGroups.forEach(group => {
        box.expandByObject(group)
      })
    }

    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)

    // 2) 默认稍微拉远一点（更接近你想要的“第二张图”效果）
    const distance = maxDim * 2.0

    // 放宽 OrbitControls 的 maxDistance，避免大场景被 clamp 导致视角不生效
    if (this.controls) {
      this.controls.maxDistance = Math.max(this.controls.maxDistance || 0, distance * 2)
    }

    // 相机位置
    this.camera.position.set(
      center.x + distance * 0.5,
      center.y + distance * 0.6,
      center.z + distance * 0.5
    )

    // 3) 让视线“看向中心点的下方”，让建筑在屏幕里整体上移（避开底部 UI）
    const adjustedCenter = center.clone()
    const uiOffsetY = Math.min(distance * 0.18, 20) // 更强的下移量，让建筑在屏幕中更靠上（避开底部 UI）
    adjustedCenter.y -= uiOffsetY

    this.controls.target.copy(adjustedCenter)
    this.controls.update()
  }

  /**
   * 切换地图可见性
   */
  toggleMapVisibility(mapName, visible) {
    const map = this.allMaps.find(m => m.mapName === mapName)
    if (map) {
      map.visible = visible
      this.render()
    }
  }

  /**
   * 销毁渲染器
   */
  dispose() {
    window.removeEventListener('resize', this.resizeHandler)
    this.onFrame = null
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }

    this.mapGroups.forEach(group => {
      this.disposeGroup(group)
    })

    if (this.renderer) {
      this.renderer.dispose()
      this.container.removeChild(this.renderer.domElement)
    }

    if (this.controls) {
      this.controls.dispose()
    }
  }

  /**
   * 递归销毁 Group
   */
  disposeGroup(group) {
    group.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose())
        } else {
          obj.material.dispose()
        }
      }
    })
  }
}
