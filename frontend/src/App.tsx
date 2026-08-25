import { useState, useEffect } from "react";
import "./App.css";

const cities = [
  "Arad",
  "Bucharest",
  "Craiova",
  "Drobeta",
  "Eforie",
  "Fagaras",
  "Giurgiu",
  "Hirsova",
  "Iasi",
  "Lugoj",
  "Mehadia",
  "Neamt",
  "Oradea",
  "Pitesti",
  "Rimnicu Vilcea",
  "Sibiu",
  "Timisoara",
  "Urziceni",
  "Vaslui",
];

// Coordinates roughly matching the reference map image, on a 1000x600 canvas
const cityCoords: Record<string, { x: number; y: number }> = {
  Oradea: { x: 239, y: 115 },
  Zerind: { x: 209, y: 172 },
  Arad: { x: 184, y: 231 },
  Timisoara: { x: 189, y: 347 },
  Lugoj: { x: 287, y: 393 },
  Mehadia: { x: 287, y: 448 },
  Drobeta: { x: 287, y: 506 },
  Sibiu: { x: 346, y: 281 },
  "Rimnicu Vilcea": { x: 380, y: 347 },
  Craiova: { x: 400, y: 523 },
  Fagaras: { x: 480, y: 291 },
  Pitesti: { x: 501, y: 409 },
  Bucharest: { x: 610, y: 467 },
  Giurgiu: { x: 574, y: 547 },
  Urziceni: { x: 686, y: 434 },
  Hirsova: { x: 792, y: 434 },
  Eforie: { x: 831, y: 514 },
  Neamt: { x: 617, y: 166 },
  Iasi: { x: 709, y: 212 },
  Vaslui: { x: 752, y: 297 },
};

// All roads on the map (undirected), with their real distances
const allEdges: [string, string, number][] = [
  ["Oradea", "Zerind", 71],
  ["Oradea", "Sibiu", 151],
  ["Zerind", "Arad", 75],
  ["Arad", "Sibiu", 140],
  ["Arad", "Timisoara", 118],
  ["Timisoara", "Lugoj", 111],
  ["Lugoj", "Mehadia", 70],
  ["Mehadia", "Drobeta", 75],
  ["Drobeta", "Craiova", 120],
  ["Craiova", "Rimnicu Vilcea", 146],
  ["Craiova", "Pitesti", 138],
  ["Rimnicu Vilcea", "Sibiu", 80],
  ["Rimnicu Vilcea", "Pitesti", 97],
  ["Sibiu", "Fagaras", 99],
  ["Fagaras", "Bucharest", 211],
  ["Pitesti", "Bucharest", 101],
  ["Bucharest", "Giurgiu", 90],
  ["Bucharest", "Urziceni", 85],
  ["Urziceni", "Hirsova", 98],
  ["Urziceni", "Vaslui", 142],
  ["Hirsova", "Eforie", 86],
  ["Vaslui", "Iasi", 92],
  ["Iasi", "Neamt", 87],
];

// โครงสร้างผลลัพธ์ของแต่ละอัลกอริทึม
interface AlgorithmResult {
  path: string[];
  cost: number | null;
  visited?: string[];
}

// โครงสร้าง Response รวมที่ Backend ส่งกลับมา
interface PathfindingResponse {
  astar: AlgorithmResult;
  bfs: AlgorithmResult;
}

const STEP_MS = 500;

// Renders the full Romania map, with the given path animated on top of it
function RomaniaMap({
  path,
  accentColor,
}: {
  path: string[];
  accentColor: string;
}) {
  const [revealed, setRevealed] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const runAnimation = (length: number) => {
    setRevealed(0);
    setIsAnimating(true);
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setRevealed(i);
      if (i >= length) {
        clearInterval(interval);
        setIsAnimating(false);
      }
    }, STEP_MS);
    return interval;
  };

  useEffect(() => {
    if (!path || path.length === 0) {
      setRevealed(0);
      return;
    }
    const interval = runAnimation(path.length);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  if (!path || path.length === 0) {
    return <div className="empty-path">No path found</div>;
  }

  const pathSet = new Set(path);

  return (
    <div className="map-wrapper">
      <svg viewBox="0 0 1000 600" className="romania-map">
        {/* Base road network */}
        {allEdges.map(([a, b, w]) => {
          const p1 = cityCoords[a];
          const p2 = cityCoords[b];
          if (!p1 || !p2) return null;
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          return (
            <g key={`${a}-${b}`}>
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                className="base-edge"
              />
              <text x={midX} y={midY} className="edge-weight">
                {w}
              </text>
            </g>
          );
        })}

        {/* Highlighted path edges, drawn in sequence */}
        {path.slice(0, -1).map((city, i) => {
          const next = path[i + 1];
          const p1 = cityCoords[city];
          const p2 = cityCoords[next];
          if (!p1 || !p2) return null;
          const isDrawn = revealed > i + 1;
          return (
            <line
              key={`path-${city}-${next}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              className="path-edge"
              pathLength={1}
              style={{
                stroke: accentColor,
                strokeDashoffset: isDrawn ? 0 : 1,
              }}
            />
          );
        })}

        {/* Base city nodes */}
        {cities.map((city) => {
          const p = cityCoords[city];
          if (!p || pathSet.has(city)) return null;
          return (
            <g key={city}>
              <circle cx={p.x} cy={p.y} r={6} className="base-node" />
              <text x={p.x + 10} y={p.y + 4} className="city-label">
                {city}
              </text>
            </g>
          );
        })}

        {/* Path city nodes (drawn on top, highlighted as revealed) */}
        {path.map((city, i) => {
          const p = cityCoords[city];
          if (!p) return null;
          const isRevealed = i < revealed;
          const isCurrent = i === revealed - 1 && isAnimating;
          const isStart = i === 0;
          const isGoal = i === path.length - 1;
          return (
            <g key={`${city}-${i}`}>
              {isCurrent && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={12}
                  className="pulse-ring"
                  style={{ stroke: accentColor }}
                />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={isStart || isGoal ? 9 : 7}
                className="path-node"
                style={{
                  fill: isRevealed ? accentColor : undefined,
                }}
              />
              <text
                x={p.x + 12}
                y={p.y + 4}
                className={`city-label path-city-label ${
                  isRevealed ? "label-active" : ""
                }`}
                style={{ color: isRevealed ? accentColor : undefined }}
              >
                {city}
                {isStart && <tspan className="tag-tspan"> (start)</tspan>}
                {isGoal && <tspan className="tag-tspan"> (goal)</tspan>}
              </text>
            </g>
          );
        })}
      </svg>

      <button
        className="replay-btn"
        onClick={() => runAnimation(path.length)}
        disabled={isAnimating}
        style={{ borderColor: accentColor, color: accentColor }}
      >
        {isAnimating ? "Walking..." : "↺ Replay"}
      </button>
    </div>
  );
}

function App() {
  const [start, setStart] = useState("");
  const [goal, setGoal] = useState("");

  const [result, setResult] = useState<PathfindingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const findPath = async () => {
    if (!start || !goal) {
      setError("Please select both start and goal cities.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/path", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start: start,
          goal: goal,
        }),
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data: PathfindingResponse = await response.json();
      setResult(data);
    } catch (error) {
      setError("cant connect backend!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <button
        className="theme-toggle"
        onClick={() => setIsDark((d) => !d)}
        aria-label="Toggle dark mode"
      >
        {isDark ? "☀️ Light" : "🌙 Dark"}
      </button>

      <h1>Romania Pathfinding</h1>
      <p className="subtitle">Hierarchical A* Search</p>

      <div className="controls">
        <div className="input-group">
          <label>Start City</label>
          <select value={start} onChange={(e) => setStart(e.target.value)}>
            <option value="" disabled>
              -- Select Start City --
            </option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>Goal City</label>
          <select value={goal} onChange={(e) => setGoal(e.target.value)}>
            <option value="" disabled>
              -- Select Goal City --
            </option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <button onClick={findPath} disabled={loading}>
          {loading ? "Searching..." : "Find Path"}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className="results-container">
          {/* Hierarchical A* */}
          <div className="card" style={{ borderTopColor: "#2563eb" }}>
            <div className="card-header">
              <h3 style={{ color: "#2563eb" }}>Hierarchical A*</h3>
              <div className="card-stats">
                <span>
                  <strong>Cost:</strong> {result.astar.cost ?? "No path"}
                </span>
                <span>
                  <strong>Hops:</strong>{" "}
                  {result.astar.path.length > 0
                    ? result.astar.path.length - 1
                    : 0}
                </span>
              </div>
            </div>
            <RomaniaMap path={result.astar.path} accentColor="#2563eb" />
          </div>

          {/* BFS */}
          <div className="card" style={{ borderTopColor: "#64748b" }}>
            <div className="card-header">
              <h3 style={{ color: "#64748b" }}>BFS (Uninformed)</h3>
              <div className="card-stats">
                <span>
                  <strong>Cost:</strong> {result.bfs.cost ?? "No path"}
                </span>
                <span>
                  <strong>Hops:</strong>{" "}
                  {result.bfs.path.length > 0 ? result.bfs.path.length - 1 : 0}
                </span>
              </div>
            </div>
            <RomaniaMap path={result.bfs.path} accentColor="#64748b" />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;