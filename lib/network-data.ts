import { getImagePath as getOptimizedImagePath } from './image-utils'

// Helper para agregar basePath a las rutas de imágenes (usa WebP optimizado)
const getImagePath = (path: string) => {
  return getOptimizedImagePath(path)
}

export const events = [
  // XARXES (1-13)
  { id: 1, title: "1", category: "xarxes", image: getImagePath("/XARXES/1.webp") },
  { id: 2, title: "2", category: "xarxes", image: getImagePath("/XARXES/2.webp") },
  { id: 3, title: "3", category: "xarxes", image: getImagePath("/XARXES/3.webp") },
  { id: 4, title: "4", category: "xarxes", image: getImagePath("/XARXES/4.webp") },
  { id: 5, title: "5", category: "xarxes", image: getImagePath("/XARXES/5.webp") },
  { id: 6, title: "6", category: "xarxes", image: getImagePath("/XARXES/6.webp") },
  { id: 7, title: "7", category: "xarxes", image: getImagePath("/XARXES/7.webp") },
  { id: 8, title: "8", category: "xarxes", image: getImagePath("/XARXES/8.webp") },
  { id: 9, title: "9", category: "xarxes", image: getImagePath("/XARXES/9.webp") },
  { id: 10, title: "10", category: "xarxes", image: getImagePath("/XARXES/10.webp") },
  { id: 11, title: "11", category: "xarxes", image: getImagePath("/XARXES/11.webp") },
  { id: 12, title: "12", category: "xarxes", image: getImagePath("/XARXES/12.webp") },
  { id: 13, title: "13", category: "xarxes", image: getImagePath("/XARXES/13.webp") },
  // IA (14-26)
  { id: 14, title: "14", category: "ia", image: getImagePath("/IA/16.webp") },
  { id: 15, title: "15", category: "ia", image: getImagePath("/IA/17.webp") },
  { id: 16, title: "16", category: "ia", image: getImagePath("/IA/18.webp") },
  { id: 17, title: "17", category: "ia", image: getImagePath("/IA/19.webp") },
  { id: 18, title: "18", category: "ia", image: getImagePath("/IA/20.webp") },
  { id: 19, title: "19", category: "ia", image: getImagePath("/IA/21.webp") },
  { id: 20, title: "20", category: "ia", image: getImagePath("/IA/22.webp") },
  { id: 21, title: "21", category: "ia", image: getImagePath("/IA/23.webp") },
  { id: 22, title: "22", category: "ia", image: getImagePath("/IA/24.webp") },
  { id: 23, title: "23", category: "ia", image: getImagePath("/IA/25.webp") },
  { id: 24, title: "24", category: "ia", image: getImagePath("/IA/26.webp") },
  { id: 25, title: "25", category: "ia", image: getImagePath("/IA/ia.webp") },
  // PODER (27-36)
  { id: 27, title: "27", category: "poder", image: getImagePath("/PODER/27.webp") },
  { id: 28, title: "28", category: "poder", image: getImagePath("/PODER/28.webp") },
  { id: 29, title: "29", category: "poder", image: getImagePath("/PODER/29.webp") },
  { id: 30, title: "30", category: "poder", image: getImagePath("/PODER/30.webp") },
  { id: 31, title: "31", category: "poder", image: getImagePath("/PODER/31.webp") },
  { id: 32, title: "32", category: "poder", image: getImagePath("/PODER/32.webp") },
  { id: 33, title: "33", category: "poder", image: getImagePath("/PODER/33.webp") },
  { id: 34, title: "34", category: "poder", image: getImagePath("/PODER/34.webp") },
  { id: 35, title: "35", category: "poder", image: getImagePath("/PODER/35.webp") },
  { id: 36, title: "36", category: "poder", image: getImagePath("/PODER/36.webp") },
  // CONTRAIMATGES (37-45)
  { id: 37, title: "37", category: "contraimatges", image: getImagePath("/CONTRAIMATGES/37.webp") },
  { id: 38, title: "38", category: "contraimatges", image: getImagePath("/CONTRAIMATGES/38.webp") },
  { id: 39, title: "39", category: "contraimatges", image: getImagePath("/CONTRAIMATGES/39.webp") },
  { id: 40, title: "40", category: "contraimatges", image: getImagePath("/CONTRAIMATGES/40.webp") },
  { id: 41, title: "41", category: "contraimatges", image: getImagePath("/CONTRAIMATGES/41.webp") },
  { id: 42, title: "42", category: "contraimatges", image: getImagePath("/CONTRAIMATGES/42.webp") },
  { id: 43, title: "43", category: "contraimatges", image: getImagePath("/CONTRAIMATGES/43.webp") },
  { id: 44, title: "44", category: "contraimatges", image: getImagePath("/CONTRAIMATGES/44.webp") },
  { id: 45, title: "45", category: "contraimatges", image: getImagePath("/CONTRAIMATGES/45.webp") },
]

export const initialNodePositions = [
  { x: 65, y: 40 },
  { x: 74, y: 49 },
  { x: 83, y: 54 },
  { x: 86, y: 62 },
  { x: 92, y: 82 },
  { x: 60, y: 59 },
  { x: 65, y: 67 },
  { x: 64, y: 77 },
  { x: 63, y: 92 },
  { x: 59, y: 96 },
  { x: 47, y: 70 },
  { x: 42, y: 77 },
  { x: 35, y: 84 },
  { x: 28, y: 96 },
  { x: 18, y: 96 },
  { x: 28, y: 61 },
  { x: 23, y: 67 },
  { x: 14, y: 71 },
  { x: 6, y: 71 },
  { x: 2, y: 69 },
  { x: 18, y: 50 },
  { x: 9, y: 55 },
  { x: 4, y: 48 },
  { x: 2, y: 39 },
  { x: 2, y: 29 },
  { x: 19, y: 34 },
  { x: 15, y: 26 },
  { x: 13, y: 22 },
  { x: 8, y: 13 },
  { x: 10, y: 2 },
  { x: 33, y: 21 },
  { x: 31, y: 8 },
  { x: 34, y: 5 },
  { x: 38, y: 2 },
  { x: 42, y: 2 },
  { x: 46, y: 16 },
  { x: 50, y: 10 },
  { x: 61, y: 10 },
  { x: 69, y: 4 },
  { x: 78, y: 2 },
  { x: 59, y: 27 },
  { x: 70, y: 22 },
  { x: 77, y: 26 },
  { x: 84, y: 25 },
  { x: 84, y: 42 },
]

export const generateConnectionsByCategory = (): number[][] => {
  const connections: number[][] = []
  
  // Agrupar eventos por categoría
  const eventsByCategory = new Map<string, number[]>()
  events.forEach(event => {
    if (!eventsByCategory.has(event.category)) {
      eventsByCategory.set(event.category, [])
    }
    eventsByCategory.get(event.category)!.push(event.id)
  })
  
  // Generar todas las conexiones dentro de cada categoría (grafo completo)
  eventsByCategory.forEach((ids) => {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        connections.push([ids[i], ids[j]])
      }
    }
  })
  
  return connections
}

export const eventsById = new Map(events.map((e, idx) => [e.id, { event: e, idx }]))
