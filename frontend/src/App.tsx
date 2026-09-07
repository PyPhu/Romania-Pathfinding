import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { allEdges, cityByName, citySpecs, edgeDistance, localPathfinding, type Algorithm, type CityName, type PathfindingResponse } from "./lib/pathfinding";
import "./App.css";

const MAP_WIDTH = 1822;
const MAP_HEIGHT = 1303;
const STEP_MS = 480;
const sortedCities = [...citySpecs].sort((a, b) => a.label.localeCompare(b.label, "ro"));

function Icon({ name, ...props }: { name: "compass" | "arrow" | "swap" | "reset" | "play" | "pin" } & React.SVGProps<SVGSVGElement>) {
  const paths = {
    compass: <><circle cx="12" cy="12" r="9" /><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    swap: <><path d="M8 3v16m-4-4 4 4 4-4M16 21V5m-4 4 4-4 4 4" /></>,
    reset: <><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6" /></>,
    play: <path d="m9 5 10 7-10 7Z" />,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}

function validResponse(data: PathfindingResponse, start: CityName, goal: CityName) {
  return ["astar", "bfs"].every((key) => {
    const route = data?.[key as Algorithm];
    if (!route || !Array.isArray(route.path) || route.path[0] !== start || route.path.at(-1) !== goal) return false;
    if (!route.path.every((city) => city in cityByName)) return false;
    const distances = route.path.slice(1).map((city, i) => edgeDistance(route.path[i], city));
    return distances.every((d) => d > 0) && distances.reduce((a, b) => a + b, 0) === route.cost
      && Number.isFinite(data.benchmarks?.[key as Algorithm]?.execution_time_ms);
  });
}

function App() {
  const [start, setStart] = useState<CityName | "">("");
  const [goal, setGoal] = useState<CityName | "">("");
  const [result, setResult] = useState<PathfindingResponse | null>(null);
  const [algorithm, setAlgorithm] = useState<Algorithm>("astar");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [revealed, setRevealed] = useState(0);
  const [replayKey, setReplayKey] = useState(0);
  const [showRoads, setShowRoads] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [hovered, setHovered] = useState<CityName | null>(null);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const animationTimer = useRef<number | undefined>(undefined);
  const request = useRef<AbortController | null>(null);
  const mapViewport = useRef<HTMLDivElement>(null);
  const activeResult = result?.[algorithm] ?? null;
  const activePath = useMemo(() => activeResult?.path ?? [], [activeResult]);
  const isAnimating = activePath.length > 1 && revealed < activePath.length;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    media.addEventListener("change", update);
    return () => { media.removeEventListener("change", update); request.current?.abort(); };
  }, []);

  useEffect(() => {
    if (!activePath.length) return;
    let step = 0;
    const timer = window.setInterval(() => {
      step = reducedMotion ? activePath.length : step + 1;
      setRevealed(step);
      if (step >= activePath.length) window.clearInterval(timer);
    }, reducedMotion ? 0 : STEP_MS);
    animationTimer.current = timer;
    return () => window.clearInterval(timer);
  }, [activePath, replayKey, reducedMotion]);

  const clearRoute = () => {
    request.current?.abort();
    request.current = null;
    setLoading(false);
    setResult(null);
    setRevealed(0);
    setError("");
  };
  const updateStart = (city: CityName | "") => { clearRoute(); setStart(city); if (city && city === goal) setGoal(""); };
  const updateGoal = (city: CityName | "") => { clearRoute(); setGoal(city); if (city && city === start) setStart(""); };
  const pickCity = (city: CityName) => {
    if (!start) updateStart(city);
    else if (city === start) updateStart("");
    else if (city === goal) updateGoal("");
    else updateGoal(city);
  };
  const findPath = async (event?: FormEvent, from = start, to = goal) => {
    event?.preventDefault();
    if (!from || !to || from === to) { setError("Choose two different cities to plan your route."); return; }
    clearRoute();
    setStart(from); setGoal(to); setLoading(true); setAlgorithm("astar");
    const controller = new AbortController();
    request.current = controller;
    const timer = window.setTimeout(() => controller.abort(), 3500);
    try {
      const isLocalHost = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
      const apiUrl = import.meta.env.VITE_API_URL
        ?? (import.meta.env.DEV || isLocalHost ? `http://${window.location.hostname}:8000` : undefined);
      let data = localPathfinding(from, to);
      if (apiUrl) {
        try {
          const response = await fetch(`${apiUrl.replace(/\/$/, "")}/path`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ start: from, goal: to }), signal: controller.signal,
          });
          if (!response.ok) throw new Error("Service unavailable");
          const remote = await response.json() as PathfindingResponse;
          if (!validResponse(remote, from, to)) throw new Error("Invalid route");
          data = { ...remote, source: "backend" };
        } catch { /* The complete graph is available locally when the service is unavailable. */ }
      }
      if (request.current !== controller) return;
      setResult(data); setReplayKey((key) => key + 1);
    } finally {
      window.clearTimeout(timer);
      if (request.current === controller) { request.current = null; setLoading(false); }
    }
  };
  const reset = () => { clearRoute(); setStart(""); setGoal(""); setHovered(null); };
  const swap = () => { clearRoute(); setStart(goal); setGoal(start); };
  const chooseAlgorithm = (next: Algorithm) => {
    if (next !== algorithm) { setRevealed(0); setAlgorithm(next); }
  };
  const fitMap = () => { setZoom(1); mapViewport.current?.scrollTo({ left: 0, top: 0, behavior: "instant" }); };
  const activeColor = algorithm === "astar" ? "#f2c66d" : "#86dcd1";
  const selectionHint = !start ? "Choose your starting city" : !goal ? "Now choose a destination" : result ? `${cityByName[start].label} to ${cityByName[goal].label}` : "Your journey is ready to plan";
  const distanceDifference = result ? (result.bfs.cost ?? 0) - (result.astar.cost ?? 0) : 0;
  const visitedCities = activeResult?.visited ?? activeResult?.visited_nodes;
  const visitedCount = visitedCities ? new Set(visitedCities).size : null;
  const searchCountLabel = result?.source === "backend"
    ? algorithm === "bfs" ? "Cities discovered" : "Cities in search log"
    : "Cities examined";
  const searchCountNote = result?.source === "backend"
    ? algorithm === "bfs"
      ? "Counts all cities added to the search queue, including cities outside your route."
      : "Counts unique cities in the partial search log. The full exploration count is unavailable."
    : "Counts unique cities examined during the search, including cities outside your route.";
  const activeBenchmark = result?.benchmarks[algorithm];
  const searchTime = activeBenchmark?.execution_time_ms;
  const searchTimeLabel = searchTime == null ? "Unavailable"
    : searchTime <= 0 ? "Below timer precision"
    : searchTime < 0.001 ? "< 0.001 ms" : `${searchTime.toFixed(3)} ms`;

  return (
    <div className="app-shell" style={{ "--route-color": activeColor } as CSSProperties}>
      <a className="skip-link" href="#journey">Skip to route planner</a>
      <header className="topbar">
        <div className="brand-mark"><Icon name="compass" width="28" height="28" /></div>
        <div><div className="brand-kicker">An interactive road atlas</div><h1>Romanian Pathfinder<span>.</span></h1></div>
        <div className="topbar-note"><span className="status-dot" />20 cities <span className="note-divider">/</span> 23 connections</div>
      </header>

      <main className="workspace">
        <section className="map-panel" aria-label="Interactive Romania map">
          <div className="map-heading">
            <div><span className="eyebrow">Explore Romania</span><h2>{selectionHint}</h2></div>
            <label className="road-toggle"><input type="checkbox" checked={showRoads} onChange={(e) => setShowRoads(e.target.checked)} /><span>Road network</span></label>
          </div>
          <div className="map-wrap">
            <div className="map-viewport" ref={mapViewport} tabIndex={0} aria-label="Scrollable map. Use arrow keys to pan, or select cities in the route planner.">
              <div className="map-stage" style={{ "--map-zoom": zoom } as CSSProperties}>
                <img className="terrain-map" src="/assets/map/romania-geographic.png" alt="Illustrated geographic map of Romania: the Carpathian arc, Transylvanian plateau, Danube plain, and Black Sea coast in the southeast." draggable="false" />
                <div className="map-shade" />
                <svg className="route-network" viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} aria-hidden="true">
                  {showRoads && allEdges.map(([a,b]) => <line key={`${a}-${b}`} x1={cityByName[a].x} y1={cityByName[a].y} x2={cityByName[b].x} y2={cityByName[b].y} className="road-line" />)}
                  {activePath.slice(0, Math.max(0, revealed - 1)).map((a,index) => {
                    const b = activePath[index + 1], p1 = cityByName[a], p2 = cityByName[b];
                    return <g key={`${a}-${b}`}>
                      <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} className="route-line-shadow" />
                      <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} className="route-line-active" />

                    </g>;
                  })}
                  {isAnimating && revealed > 0 && <circle key={`${replayKey}-${revealed}`} className="journey-pulse" cx={cityByName[activePath[revealed-1]].x} cy={cityByName[activePath[revealed-1]].y} r="17" />}
                </svg>
                <div className="region-label transylvania">Transylvania</div>
                <div className="region-label wallachia">Wallachian plain</div>
                <div className="region-label black-sea">Black<br />Sea</div>
                {citySpecs.map((city) => {
                  const routeIndex = activePath.indexOf(city.name), isStart = start === city.name, isGoal = goal === city.name;
                  return <button key={city.name} data-city={city.name} type="button"
                    className={`city-node${isStart ? " is-start" : ""}${isGoal ? " is-goal" : ""}${routeIndex >= 0 && routeIndex < revealed ? " is-route-city" : ""}`}
                    style={{ "--city-x": city.x, "--city-y": city.y, "--city-size": city.size, zIndex: hovered === city.name ? 2000 : isStart || isGoal ? 1800 : 20+city.y } as CSSProperties}
                    onClick={() => pickCity(city.name)} onMouseEnter={() => setHovered(city.name)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(city.name)} onBlur={() => setHovered(null)}
                    aria-label={`${city.label}, ${city.landmark}${isStart ? ", selected as start" : isGoal ? ", selected as destination" : ""}`} aria-pressed={isStart || isGoal}>
                    <span className="city-ground" />
                    <img className="city-landmark" src={`/assets/cities/${city.asset}.png`} alt="" draggable="false" />
                    {(isStart || isGoal) && <span className="city-marker">{isStart ? "A" : "B"}</span>}
                    <span className="city-name">{city.label}</span>
                  </button>;
                })}
              </div>
            </div>
            <div className="map-compass" aria-hidden="true"><span>N</span><Icon name="compass" width="32" height="32" /></div>
            <div className="map-controls" aria-label="Map zoom">
              <button type="button" onClick={() => setZoom((z) => Math.min(2, z + .25))} disabled={zoom >= 2} aria-label="Zoom in">+</button>
              <button type="button" onClick={() => setZoom((z) => Math.max(1, z - .25))} disabled={zoom <= 1} aria-label="Zoom out">−</button>
              <button type="button" onClick={fitMap} aria-label="Reset map view">Reset</button>
            </div>
            {hovered && <div className="landmark-caption"><Icon name="pin" /><span><strong>{cityByName[hovered].label}</strong><small>{cityByName[hovered].landmark}</small></span></div>}
          </div>
          <div className="map-footer">
            <div className="map-legend"><span><i className="legend-marker start-marker">A</i>Start</span><span><i className="legend-marker goal-marker">B</i>Destination</span><span><i className="legend-route" />Route</span></div>
            <span className="map-tip">Select a landmark to plan your journey</span><span className="mobile-map-tip">Swipe to explore the map</span>
          </div>
        </section>

        <aside className="route-panel" id="journey">
          <div className="panel-heading"><span className="eyebrow">Your itinerary</span><h2>Plan your journey</h2><p>Choose two cities. Discover the roads between them.</p></div>
          <form onSubmit={findPath}>
            <div className="field-group"><label htmlFor="start-city"><span className="field-dot start-dot" />Starting city</label>
              <select id="start-city" value={start} onChange={(e) => updateStart(e.target.value as CityName | "")}><option value="">Where from?</option>{sortedCities.map((c) => <option key={c.name} value={c.name} disabled={c.name === goal}>{c.label}</option>)}</select>
            </div>
            <div className="journey-divider"><span /><button type="button" className="swap-button" onClick={swap} disabled={!start && !goal} aria-label="Swap start and destination" title="Swap start and destination"><Icon name="swap" /></button><span /></div>
            <div className="field-group"><label htmlFor="goal-city"><span className="field-dot goal-dot" />Destination</label>
              <select id="goal-city" value={goal} onChange={(e) => updateGoal(e.target.value as CityName | "")}><option value="">Where to?</option>{sortedCities.map((c) => <option key={c.name} value={c.name} disabled={c.name === start}>{c.label}</option>)}</select>
            </div>
            <div className="panel-actions"><button className="find-button" disabled={loading || !start || !goal}><span>{loading ? "Finding your route…" : "Find route"}</span><Icon name="arrow" /></button><button type="button" className="reset-button" onClick={reset} aria-label="Reset journey" title="Reset journey"><Icon name="reset" /></button></div>
            {error && <p className="error-message" role="alert">{error}</p>}
          </form>
          <div className="sr-only" role="status">{loading ? "Calculating route" : result ? `${algorithm === "astar" ? "Hierarchy A star" : "Breadth first"} route: ${activeResult?.cost} kilometres, ${activePath.length} cities.` : selectionHint}</div>
          {result ? <section className="route-result" aria-label="Route results">
            <div className="algorithm-tabs" role="group" aria-label="Route algorithm"><button className={algorithm === "astar" ? "active" : ""} onClick={() => chooseAlgorithm("astar")} aria-pressed={algorithm === "astar"}>Hierarchy A* <span>Shortest distance</span></button><button className={algorithm === "bfs" ? "active" : ""} onClick={() => chooseAlgorithm("bfs")} aria-pressed={algorithm === "bfs"}>Breadth first <span>Fewest connections</span></button></div>
            <div className="result-summary"><div><span>Total distance</span><strong>{activeResult?.cost ?? "—"}<small> km</small></strong></div><div><span>Connections</span><strong>{Math.max(0,activePath.length-1)}</strong></div></div>
            <p className="comparison-note">{distanceDifference === 0 ? "Both algorithms find the same distance." : algorithm === "astar" ? `${distanceDifference} km shorter than breadth first.` : `${distanceDifference} km longer than the shortest route.`}</p>
            <div className="itinerary-heading"><h3>Your route</h3><span>{activePath.length} cities</span></div>
            <ol className="route-list">{activePath.map((city,index) => <li key={`${algorithm}-${city}`} className={index < revealed ? "revealed" : ""}>
              <span className={`stop-number${index === 0 ? " first" : index === activePath.length-1 ? " last" : ""}`}>{index === 0 ? "A" : index === activePath.length-1 ? "B" : index}</span>
              <div><strong>{cityByName[city].label}</strong><small>{cityByName[city].landmark}</small></div><span className="leg-distance">{index ? `${edgeDistance(activePath[index-1],city)} km` : "Start"}</span>
            </li>)}</ol>
            <button className="replay-button" onClick={() => { if (isAnimating) { window.clearInterval(animationTimer.current); setRevealed(activePath.length); } else { setRevealed(0); setReplayKey((k) => k+1); } }}><Icon name="play" width="16" height="16" />{isAnimating ? "Show full route" : "Replay journey"}</button>
            <details className="search-details"><summary>Search details</summary><dl><div><dt>Search time</dt><dd>{searchTimeLabel}</dd></div><div><dt>Peak memory</dt><dd>{activeBenchmark?.peak_memory_kb != null ? `${activeBenchmark.peak_memory_kb.toFixed(2)} KB` : "Unavailable"}</dd></div><div><dt>{searchCountLabel}</dt><dd>{visitedCount ?? "Unavailable"}</dd></div></dl>{visitedCount != null && <p>{searchCountNote}</p>}{result.source === "local" && <p>Using browser calculations. Memory measurements require the route service.</p>}<p>{algorithm === "astar" ? "Hierarchy A* uses distance estimates to guide the route search." : "Breadth-first search minimizes the number of connections, regardless of their distances."}</p></details>
          </section> : <div className="empty-state"><div className="empty-icon"><Icon name="compass" width="32" height="32" /></div><h3>Every journey starts somewhere.</h3><p>Select landmarks on the map, or try the classic route.</p><button className="example-button" onClick={() => void findPath(undefined,"Arad","Bucharest")}>Arad <span>→</span> Bucharest <Icon name="arrow" width="16" height="16" /></button></div>}
          <p className="atlas-note">An exploration of the classic 20-city search problem. Distances follow the teaching graph; connections are schematic.</p>
        </aside>
      </main>
      <footer className="page-footer"><span>From the Carpathians to the Black Sea.</span></footer>
    </div>
  );
}
export default App;
