/**
 * 地图数据加载器
 * 负责扫描 maps 目录，加载 PGM 和 YAML 文件
 */

import { parsePGM, pixelsToCanvas } from './pgmParser.js'
import yaml from 'js-yaml'

// 已知地图列表（由于浏览器无法扫描目录，需要预定义）
const MAP_LIST = [
  { name: 'zone_1', folder: 'zone_1' },
  { name: 'zone_2', folder: 'zone_2' },
  { name: 'zone_3', folder: 'zone_3' },
  { name: 'stairs_1', folder: 'stairs_1', mapType: 'stair' }
]

/**
 * 加载所有地图数据
 * @param {string} basePath 地图根目录路径，如 './maps'
 * @returns {Promise<Array>} 地图数据数组
 */
export async function loadAllMaps(basePath = './maps') {
  const maps = []

  for (const mapInfo of MAP_LIST) {
    try {
      const map = await loadSingleMap(basePath, mapInfo)
      maps.push(map)
      console.log(`✓ 已加载地图: ${mapInfo.name}`)
    } catch (err) {
      console.error(`✗ 加载地图失败: ${mapInfo.name}`, err)
    }
  }

  return maps
}

/**
 * 加载单个地图
 */
async function loadSingleMap(basePath, mapInfo) {
  const { name, folder, mapType } = mapInfo
  const pgmUrl = `${basePath}/${folder}/${name}.pgm`
  const mapYamlUrl = `${basePath}/${folder}/${name}.yaml`
  const topoYamlUrl = `${basePath}/${folder}/${name}_topo.yaml`

  // 并行加载 PGM 和 YAML 文件
  const [pgmResponse, mapYamlResponse, topoYamlResponse] = await Promise.all([
    fetch(pgmUrl),
    fetch(mapYamlUrl),
    fetch(topoYamlUrl)
  ])

  if (!pgmResponse.ok) throw new Error(`PGM 文件加载失败: ${pgmUrl}`)
  if (!mapYamlResponse.ok) throw new Error(`地图 YAML 文件加载失败: ${mapYamlUrl}`)
  if (!topoYamlResponse.ok) throw new Error(`Topo YAML 文件加载失败: ${topoYamlUrl}`)

  // 解析 PGM
  const pgmArrayBuffer = await pgmResponse.arrayBuffer()
  const pgmData = parsePGM(pgmArrayBuffer)
  const pgmCanvas = pixelsToCanvas(pgmData.pixels, pgmData.width, pgmData.height)

  // 解析地图配置 YAML (resolution, origin)
  const mapYamlText = await mapYamlResponse.text()
  const mapConfig = yaml.load(mapYamlText)

  // 解析 Topo YAML
  const topoYamlText = await topoYamlResponse.text()
  const topoData = yaml.load(topoYamlText)

  // 转换 waypoints
  const waypoints = parseWaypoints(topoData.node_list || [])

  // 确定楼层
  let floor = 0
  if (waypoints.length > 0) {
    floor = waypoints[0].floor || 0
  }

  return {
    mapName: name,
    floor,
    mapType: mapType || 'normal',
    mapConfig: {
      resolution: mapConfig.resolution || 0.05,
      origin: mapConfig.origin || [0, 0, 0]
    },
    pgmCanvas,
    pgmWidth: pgmData.width,
    pgmHeight: pgmData.height,
    pgmPixels: pgmData.pixels,
    waypoints,
    // 运行时字段（由对齐算法填充）
    offset: { x: 0, y: 0, z: 0 },
    rotation: 0,
    visible: true
  }
}

/**
 * 解析导航点数据
 * param 格式: [x, y, z, heading, relatedPoints]
 */
function parseWaypoints(nodeList) {
  return nodeList.map(node => {
    const param = node.param || []
    const relatedStr = param[4] || ''

    const waypoint = {
      code: node.node_name,
      name: node.node_name,
      x: param[0] || 0,
      y: param[1] || 0,
      z: param[2] || 0,
      heading: param[3] || 0,
      pointType: node.node_type || '3',
      floor: node.floor || 0,
      relatedPoints: relatedStr ? relatedStr.split(',').filter(s => s) : []
    }

    // 跨地图连接 - 保存所有连接
    if (node.connect && node.connect.length > 0) {
      waypoint.connections = node.connect.map(conn => ({
        mapName: conn.map_name,
        waypointCode: conn.target_node,
        reverse: conn.reverse || false
      }))
      // 兼容旧代码，取第一个连接
      waypoint.linkedMapName = node.connect[0].map_name
      waypoint.linkedWaypointCode = node.connect[0].target_node
      waypoint.reverse = node.connect[0].reverse || false
    }

    return waypoint
  })
}

/**
 * 计算多地图对齐偏移（BFS 算法）
 * 跨地图连接点是同一物理位置，通过这些点计算地图间的偏移和旋转
 * @param {Array} allMaps 所有地图数组
 * @param {string} mainMapName 主地图名称（作为原点）
 */
export function calculateMapOffsets(allMaps, mainMapName) {
  const mapByName = {}
  allMaps.forEach(m => { mapByName[m.mapName] = m })

  // 重置所有地图的 offset 和 rotation
  allMaps.forEach(m => {
    m.offset = { x: 0, y: 0, z: 0 }
    m.rotation = 0
    m._aligned = false
  })

  // 主地图
  const mainMap = mapByName[mainMapName]
  if (!mainMap) {
    console.warn(`主地图 ${mainMapName} 不存在，使用第一个地图作为主地图`)
    if (allMaps.length > 0) {
      allMaps[0]._aligned = true
    }
    return
  }
  mainMap._aligned = true

  console.log(`地图对齐: 主地图=${mainMapName}`)

  // BFS 队列
  const queue = [mainMap]

  while (queue.length > 0) {
    const currentMap = queue.shift()

    // 遍历当前地图所有 waypoint，找跨地图连接
    for (const wp of currentMap.waypoints) {
      // 获取所有连接
      const connections = wp.connections || (wp.linkedMapName ? [{
        mapName: wp.linkedMapName,
        waypointCode: wp.linkedWaypointCode
      }] : [])
      
      if (connections.length === 0) continue

      // 尝试每个连接，找到有效的
      for (const conn of connections) {
        const targetMap = mapByName[conn.mapName]
        if (!targetMap || targetMap._aligned) continue

        // 找目标点
        const targetWp = targetMap.waypoints.find(w => w.code === conn.waypointCode)
        if (!targetWp) {
          console.warn(`跨图连接目标点不存在: ${conn.mapName}:${conn.waypointCode}`)
          continue
        }

        console.log(`对齐: ${currentMap.mapName}:${wp.code} -> ${targetMap.mapName}:${targetWp.code}`)

      // 计算旋转角度差：目标地图需要旋转多少才能让两个关联点的方向对齐
      const sourceHeading = wp.heading || 0
      const targetHeading = targetWp.heading || 0
      // 连接点的朝向应该相反（一个指向另一个）
      const rotationDiff = sourceHeading - targetHeading
      targetMap.rotation = currentMap.rotation + rotationDiff

      // 计算源点的世界坐标（考虑当前地图的旋转）
      const sourceCosR = Math.cos(currentMap.rotation)
      const sourceSinR = Math.sin(currentMap.rotation)
      const sourceRotatedX = wp.x * sourceCosR - wp.y * sourceSinR
      const sourceRotatedY = wp.x * sourceSinR + wp.y * sourceCosR
      const sourceWorldX = currentMap.offset.x + sourceRotatedX
      const sourceWorldY = currentMap.offset.y + sourceRotatedY

      // 计算目标点旋转后的位置（相对于目标地图原点）
      const targetCosR = Math.cos(targetMap.rotation)
      const targetSinR = Math.sin(targetMap.rotation)
      const rotatedTargetX = targetWp.x * targetCosR - targetWp.y * targetSinR
      const rotatedTargetY = targetWp.x * targetSinR + targetWp.y * targetCosR

      // 计算偏移：目标地图需要平移多少才能让两个关联点重合
      targetMap.offset = {
        x: sourceWorldX - rotatedTargetX,
        y: sourceWorldY - rotatedTargetY,
        z: currentMap.offset.z + ((wp.z || 0) - (targetWp.z || 0))
      }

        console.log(`  目标地图 offset=(${targetMap.offset.x.toFixed(2)}, ${targetMap.offset.y.toFixed(2)}, ${targetMap.offset.z.toFixed(2)}), rotation=${(targetMap.rotation * 180 / Math.PI).toFixed(1)}°`)

        targetMap._aligned = true
        queue.push(targetMap)
        break // 已找到有效连接，跳出循环
      }
    }
  }

  // 对于未连接的地图，按楼层垂直排列
  let unalignedIndex = 0
  allMaps.forEach((map) => {
    if (!map._aligned) {
      console.warn(`地图 ${map.mapName} 未连接到主地图，单独放置`)
      map.offset = {
        x: 30 * (unalignedIndex % 3),
        y: 0,
        z: -30 * Math.floor(unalignedIndex / 3)
      }
      map.rotation = 0
      unalignedIndex++
    }
  })

  // 清理临时字段
  allMaps.forEach(m => delete m._aligned)
}
