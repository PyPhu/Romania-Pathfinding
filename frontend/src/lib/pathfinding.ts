// Geographic bounds match the supplied Romania topographic map: 20–30° E, 43.4–48.5° N.
// The road weights are the classic educational Romania graph, not live driving distances.
export type CityName =
  | "Arad" | "Bucharest" | "Craiova" | "Drobeta" | "Eforie"
  | "Fagaras" | "Giurgiu" | "Hirsova" | "Iasi" | "Lugoj"
  | "Mehadia" | "Neamt" | "Oradea" | "Pitesti" | "Rimnicu Vilcea"
  | "Sibiu" | "Timisoara" | "Urziceni" | "Vaslui" | "Zerind";

export interface CitySpec {
  name: CityName;
  label: string;
  landmark: string;
  asset: string;
  longitude: number;
  latitude: number;
  x: number;
  y: number;
  size: number;
}

export const citySpecs: CitySpec[] = [
  { name: "Oradea", label: "Oradea", landmark: "Black Eagle Palace", asset: "oradea", longitude: 21.918, latitude: 47.046, x: 349, y: 371, size: 164 },
  { name: "Zerind", label: "Zerind", landmark: "Historic Reformed Church", asset: "zerind", longitude: 21.52, latitude: 46.63, x: 277, y: 478, size: 164 },
  { name: "Arad", label: "Arad", landmark: "Administrative Palace", asset: "arad", longitude: 21.316, latitude: 46.183, x: 240, y: 592, size: 164 },
  { name: "Timisoara", label: "Timișoara", landmark: "Metropolitan Cathedral", asset: "timisoara", longitude: 21.226, latitude: 45.754, x: 223, y: 702, size: 164 },
  { name: "Lugoj", label: "Lugoj", landmark: "Iron Bridge", asset: "lugoj", longitude: 21.903, latitude: 45.688, x: 347, y: 718, size: 164 },
  { name: "Mehadia", label: "Mehadia", landmark: "Medieval Fortress Ruin", asset: "mehadia", longitude: 22.364, latitude: 44.904, x: 431, y: 919, size: 146 },
  { name: "Drobeta", label: "Drobeta", landmark: "Trajan's Bridge Pier", asset: "drobeta", longitude: 22.653, latitude: 44.627, x: 483, y: 990, size: 146 },
  { name: "Sibiu", label: "Sibiu", landmark: "Council Tower", asset: "sibiu", longitude: 24.152, latitude: 45.798, x: 756, y: 690, size: 146 },
  { name: "Rimnicu Vilcea", label: "Râmnicu Vâlcea", landmark: "Anton Pann Memorial House", asset: "rimnicu-valcea", longitude: 24.369, latitude: 45.1, x: 796, y: 869, size: 146 },
  { name: "Craiova", label: "Craiova", landmark: "Romanescu Park Suspension Bridge", asset: "craiova", longitude: 23.796, latitude: 44.318, x: 692, y: 1068, size: 164 },
  { name: "Fagaras", label: "Făgăraș", landmark: "Făgăraș Fortress", asset: "fagaras", longitude: 24.973, latitude: 45.842, x: 906, y: 679, size: 146 },
  { name: "Pitesti", label: "Pitești", landmark: "Saint George Princely Church", asset: "pitesti", longitude: 24.869, latitude: 44.857, x: 887, y: 931, size: 146 },
  { name: "Bucharest", label: "Bucharest", landmark: "Romanian Athenaeum", asset: "bucharest", longitude: 26.103, latitude: 44.426, x: 1112, y: 1041, size: 164 },
  { name: "Giurgiu", label: "Giurgiu", landmark: "Clock Tower", asset: "giurgiu", longitude: 25.969, latitude: 43.904, x: 1088, y: 1174, size: 164 },
  { name: "Urziceni", label: "Urziceni", landmark: "Holy Voivodes Church", asset: "urziceni", longitude: 26.642, latitude: 44.717, x: 1210, y: 967, size: 164 },
  { name: "Hirsova", label: "Hârșova", landmark: "Carsium Fortress Ruin", asset: "hirsova", longitude: 27.945, latitude: 44.69, x: 1448, y: 973, size: 164 },
  { name: "Eforie", label: "Eforie", landmark: "Black Sea promenade", asset: "eforie", longitude: 28.632, latitude: 44.06, x: 1573, y: 1134, size: 164 },
  { name: "Neamt", label: "Neamț", landmark: "Neamț Fortress", asset: "neamt", longitude: 26.367, latitude: 47.207, x: 1160, y: 330, size: 164 },
  { name: "Iasi", label: "Iași", landmark: "Palace of Culture", asset: "iasi", longitude: 27.588, latitude: 47.158, x: 1383, y: 343, size: 164 },
  { name: "Vaslui", label: "Vaslui", landmark: "Stephen the Great Monument", asset: "vaslui", longitude: 27.728, latitude: 46.64, x: 1408, y: 475, size: 164 },
];

export const cityByName = Object.fromEntries(citySpecs.map((city) => [city.name, city])) as Record<CityName, CitySpec>;

export const allEdges: [CityName, CityName, number][] = [
  ["Oradea", "Zerind", 71], ["Oradea", "Sibiu", 151], ["Zerind", "Arad", 75],
  ["Arad", "Sibiu", 140], ["Arad", "Timisoara", 118], ["Timisoara", "Lugoj", 111],
  ["Lugoj", "Mehadia", 70], ["Mehadia", "Drobeta", 75], ["Drobeta", "Craiova", 120],
  ["Craiova", "Rimnicu Vilcea", 146], ["Craiova", "Pitesti", 138],
  ["Rimnicu Vilcea", "Sibiu", 80], ["Rimnicu Vilcea", "Pitesti", 97],
  ["Sibiu", "Fagaras", 99], ["Fagaras", "Bucharest", 211],
  ["Pitesti", "Bucharest", 101], ["Bucharest", "Giurgiu", 90],
  ["Bucharest", "Urziceni", 85], ["Urziceni", "Hirsova", 98],
  ["Urziceni", "Vaslui", 142], ["Hirsova", "Eforie", 86],
  ["Vaslui", "Iasi", 92], ["Iasi", "Neamt", 87],
];

interface AlgorithmResult { path: CityName[]; cost: number | null; visited?: CityName[]; visited_nodes?: CityName[]; }
interface BenchmarkMetrics { execution_time_ms: number; peak_memory_kb: number | null; }
export interface PathfindingResponse {
  astar: AlgorithmResult;
  bfs: AlgorithmResult;
  benchmarks: { astar: BenchmarkMetrics; bfs: BenchmarkMetrics };
  source?: "backend" | "local";
}
export type Algorithm = "astar" | "bfs";

const adjacency = new Map<CityName, { city: CityName; distance: number }[]>();
for (const city of citySpecs) adjacency.set(city.name, []);
for (const [a, b, distance] of allEdges) {
  adjacency.get(a)?.push({ city: b, distance });
  adjacency.get(b)?.push({ city: a, distance });
}

export const edgeDistance = (a: CityName, b: CityName) =>
  allEdges.find(([left, right]) => (left === a && right === b) || (left === b && right === a))?.[2] ?? 0;

function reconstructPath(previous: Map<CityName, CityName>, goal: CityName) {
  const path: CityName[] = [goal];
  let current = goal;
  while (previous.has(current)) {
    current = previous.get(current)!;
    path.unshift(current);
  }
  return path;
}

function runLocalAStar(start: CityName, goal: CityName): AlgorithmResult {
  const open = new Set<CityName>([start]);
  const previous = new Map<CityName, CityName>();
  const g = new Map<CityName, number>([[start, 0]]);
  const visited: CityName[] = [];
  const safeScale = Math.min(...allEdges.map(([a, b, distance]) => {
    const p1 = cityByName[a];
    const p2 = cityByName[b];
    return distance / Math.hypot((p2.longitude - p1.longitude) * 0.7, p2.latitude - p1.latitude);
  }));
  const heuristic = (city: CityName) => {
    const here = cityByName[city];
    const end = cityByName[goal];
    return Math.hypot((end.longitude - here.longitude) * 0.7, end.latitude - here.latitude) * safeScale;
  };

  while (open.size > 0) {
    const current = [...open].reduce((best, city) =>
      (g.get(city) ?? Infinity) + heuristic(city) < (g.get(best) ?? Infinity) + heuristic(best) ? city : best,
    );
    visited.push(current);
    if (current === goal) return { path: reconstructPath(previous, goal), cost: g.get(goal) ?? null, visited };
    open.delete(current);
    for (const neighbor of adjacency.get(current) ?? []) {
      const candidate = (g.get(current) ?? Infinity) + neighbor.distance;
      if (candidate >= (g.get(neighbor.city) ?? Infinity)) continue;
      previous.set(neighbor.city, current);
      g.set(neighbor.city, candidate);
      open.add(neighbor.city);
    }
  }
  return { path: [], cost: null, visited };
}

function runLocalBfs(start: CityName, goal: CityName): AlgorithmResult {
  const queue: CityName[] = [start];
  const seen = new Set<CityName>([start]);
  const previous = new Map<CityName, CityName>();
  const visited: CityName[] = [];
  while (queue.length) {
    const current = queue.shift()!;
    visited.push(current);
    if (current === goal) {
      const path = reconstructPath(previous, goal);
      return {
        path,
        cost: path.slice(0, -1).reduce((sum, city, index) => sum + edgeDistance(city, path[index + 1]), 0),
        visited,
      };
    }
    for (const neighbor of adjacency.get(current) ?? []) {
      if (seen.has(neighbor.city)) continue;
      seen.add(neighbor.city);
      previous.set(neighbor.city, current);
      queue.push(neighbor.city);
    }
  }
  return { path: [], cost: null, visited };
}

export function localPathfinding(start: CityName, goal: CityName): PathfindingResponse {
  const astarStart = performance.now();
  const astar = runLocalAStar(start, goal);
  const astarTime = performance.now() - astarStart;
  const bfsStart = performance.now();
  const bfs = runLocalBfs(start, goal);
  const bfsTime = performance.now() - bfsStart;
  return {
    astar,
    bfs,
    benchmarks: {
      astar: { execution_time_ms: astarTime, peak_memory_kb: null },
      bfs: { execution_time_ms: bfsTime, peak_memory_kb: null },
    },
    source: "local",
  };
}


