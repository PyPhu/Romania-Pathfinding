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

const STEP_MS = 450;

// Animated vertical "tree" that reveals one node at a time
function PathTree({
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

  return (
    <div className="tree-wrapper">
      <div className="tree-trunk">
        {path.map((city, index) => {
          const isRevealed = index < revealed;
          const isCurrent = index === revealed - 1 && isAnimating;
          const isLast = index === path.length - 1;
          const side = index % 2 === 0 ? "left" : "right";

          return (
            <div className="tree-row" key={`${city}-${index}`}>
              {index > 0 && (
                <div
                  className={`tree-connector ${
                    isRevealed ? "connector-active" : ""
                  }`}
                  style={{ ["--accent" as string]: accentColor }}
                />
              )}
              <div
                className={`tree-node-line side-${side} ${
                  isRevealed ? "node-revealed" : ""
                } ${isCurrent ? "node-current" : ""}`}
              >
                <div
                  className="tree-dot"
                  style={{
                    backgroundColor: isRevealed ? accentColor : undefined,
                    boxShadow: isCurrent
                      ? `0 0 0 6px ${accentColor}33`
                      : "none",
                  }}
                />
                <div
                  className="tree-card"
                  style={{
                    borderColor: isRevealed ? accentColor : undefined,
                    color: isRevealed ? accentColor : undefined,
                  }}
                >
                  {index === 0 && <span className="tree-tag">START</span>}
                  {isLast && index !== 0 && (
                    <span className="tree-tag">GOAL</span>
                  )}
                  <span className="tree-city">{city}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
            <PathTree path={result.astar.path} accentColor="#2563eb" />
          </div>

          {/* BFS */}
          <div className="card" style={{ borderTopColor: "#64748b" }}>
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
            <PathTree path={result.bfs.path} accentColor="#64748b" />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;