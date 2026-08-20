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

interface PathResult {
  path: string[];
  cost: number;
}

function App() {
  const [start, setStart] = useState("");
  const [goal, setGoal] = useState("");

  const [result, setResult] = useState<PathResult | null>(null);
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

      const data: PathResult = await response.json();

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
        <div className="result">

          <h2>Result</h2>

          <div className="path">
            {result.path.map((city, index) => (
              <span key={city}>
                {city}

                {index < result.path.length - 1 && (
                  <span className="arrow">
                    →
                  </span>
                )}
              </span>
            ))}
          </div>

          <div className="cost">
            Total Cost: <strong>{result.cost}</strong>
          </div>

        </div>
      )}
    </div>
  );
}

export default App;