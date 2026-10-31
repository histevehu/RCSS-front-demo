/** 按行合并占用像素，再纵向合并相同区间；精确保留栅格，不做抽样或补洞。 */
export function mergeGridCells(cells) {
  const rows = new Map()
  for (const {x,y} of cells) {
    if (!rows.has(y)) rows.set(y, [])
    rows.get(y).push(x)
  }
  const result = [], active = new Map()
  let previous = -Infinity
  for (const [y, values] of [...rows].sort((a,b)=>a[0]-b[0])) {
    if (y !== previous + 1) active.clear()
    const xs = [...new Set(values)].sort((a,b)=>a-b), next = new Map()
    for (let i=0; i<xs.length;) {
      const x=xs[i];let end=x;i++
      while(i<xs.length && xs[i]===end+1) end=xs[i++]
      const width=end-x+1,key=`${x}:${width}`
      const rect=active.get(key)
      if(rect) rect.height++
      else result.push({x,y,width,height:1})
      next.set(key,rect || result.at(-1))
    }
    active.clear();for(const [key,rect] of next) active.set(key,rect)
    previous=y
  }
  return result
}
