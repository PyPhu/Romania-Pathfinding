import { useState } from "react";
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

function App() {
  const [start, setStart] = useState("");
  const [goal, setGoal] = useState("");

  const [result, setResult] = useState<PathfindingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const findPath = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    if (!start || !goal){
      setError("Please select both start and goal cities.");
      return;
    }

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
      <h1>Romania Pathfinding</h1>

      <p className="subtitle">
        Hierarchical A* Search
      </p>

      <div className="controls">

        <div className="input-group">
          <label>Start City</label>

          <select
            value={start}
            onChange={(e) => setStart(e.target.value)}
          >
            <option value="" disabled>-- Select Start City --</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>Goal City</label>

          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          >
            <option value="" disabled>-- Select Goal City --</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={findPath}
          disabled={loading}
        >
          {loading ? "Searching..." : "Find Path"}
        </button>

      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {result && (
  <div className="results-container" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "24px" }}>
    
    {/* Hierarchical A* */}
    <div className="card" style={{ border: "2px solid #2563eb", padding: "16px", borderRadius: "8px" }}>
      <h3 style={{ color: "#2563eb", marginTop: 0 }}>Hierarchical A*</h3>
      <p><strong>Total Cost:</strong> {result.astar.cost ?? "No path"}</p>
      <p><strong>Hops:</strong> {result.astar.path.length > 0 ? result.astar.path.length - 1 : 0}</p>
      <div className="path-display">
        <strong>Path:</strong> {result.astar.path.join(" → ") || "Not found"}
      </div>
    </div>

    {/* BFS */}
    <div className="card" style={{ border: "2px solid #64748b", padding: "16px", borderRadius: "8px" }}>
      <h3 style={{ color: "#64748b", marginTop: 0 }}>BFS (Uninformed)</h3>
      <p><strong>Total Cost:</strong> {result.bfs.cost ?? "No path"}</p>
      <p><strong>Hops:</strong> {result.bfs.path.length > 0 ? result.bfs.path.length - 1 : 0}</p>
      <div className="path-display">
        <strong>Path:</strong> {result.bfs.path.join(" → ") || "Not found"}
      </div>
    </div>

  </div>
)}
    </div>
  );
}

export default App;