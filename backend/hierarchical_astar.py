import heapq
from math import inf
from functools import lru_cache

from graphAstar import (
    graph,
    heuristic,
    groups,
    city_to_group,
    group_edges,
)

# ============================================================
# CACHING LAYER - Memoization for performance
# ============================================================

_group_graph_cache = None
_group_heuristics_cache = {}


# ============================================================
# 1. Find which group a city belongs to
# ============================================================

def find_city_group(city):
    """
    Find the group ID and group name of a city.

    Example:
        find_city_group("Arad")
        -> ("A", "West")
    """

    if city not in city_to_group:
        raise ValueError(f"Unknown city: {city}")

    group_id = city_to_group[city]
    group_name = groups[group_id]["name"]

    return group_id, group_name


# ============================================================
# 2. Validate city
# ============================================================

def validate_city(city):
    """
    Check whether the city exists in the graph.
    """

    if city not in graph:
        raise ValueError(f"Unknown city: {city}")


# ============================================================
# 3. Build abstract group graph
# ============================================================

def build_group_graph():
    """
    Convert group_edges into a simple graph between groups.
    Cached after first build for performance.

    Example:

        A -> B (111)
        A -> C (140)
        B -> C (146)
        C -> D (101)
        D -> E (142)

    If there are multiple connections between two groups,
    keep the cheapest one.
    """

    global _group_graph_cache

    if _group_graph_cache is not None:
        return _group_graph_cache

    group_graph = {
        group_id: {}
        for group_id in groups
    }

    for group_a, neighbors in group_edges.items():

        for group_b, connections in neighbors.items():

            # Find cheapest connection between two groups
            cheapest = min(
                connections,
                key=lambda x: x[2]
            )

            city_a, city_b, cost = cheapest

            group_graph[group_a][group_b] = {
                "cost": cost,
                "from_city": city_a,
                "to_city": city_b,
            }

    _group_graph_cache = group_graph
    return group_graph


# ============================================================
# 4. Calculate shortest distance between groups
# ============================================================

def calculate_group_distances(goal_group):
    """
    Calculate the shortest distance from every group
    to the goal group.

    This is used as the heuristic for the group-level A*.

    We calculate it using Dijkstra on the abstract group graph.

    Because this is the exact shortest group distance,
    it is admissible as a heuristic.

    Results are cached to avoid recalculation.
    """

    global _group_heuristics_cache

    if goal_group in _group_heuristics_cache:
        return _group_heuristics_cache[goal_group]

    group_graph = build_group_graph()

    distances = {
        group_id: inf
        for group_id in groups
    }

    distances[goal_group] = 0

    pq = [(0, goal_group)]

    while pq:

        current_distance, current_group = heapq.heappop(pq)

        if current_distance > distances[current_group]:
            continue

        # We need reverse edges because we want
        # distance FROM every group TO goal_group.
        for neighbor_group in group_graph:

            if current_group not in group_graph[neighbor_group]:
                continue

            edge_cost = group_graph[neighbor_group][current_group]["cost"]

            new_distance = current_distance + edge_cost

            if new_distance < distances[neighbor_group]:

                distances[neighbor_group] = new_distance

                heapq.heappush(
                    pq,
                    (new_distance, neighbor_group)
                )

    _group_heuristics_cache[goal_group] = distances
    return distances


# ============================================================
# 5. Group-level A*
# ============================================================

def group_astar(start_group, goal_group):
    """
    A* search between groups.

    Returns:

        group_path
        group_connections
        group_cost
        visited_groups
    """

    if start_group == goal_group:
        return {
            "group_path": [start_group],
            "group_connections": [],
            "group_cost": 0,
            "visited_groups": []
        }

    group_graph = build_group_graph()

    # Exact abstract distance to goal.
    group_h = calculate_group_distances(goal_group)

    open_set = []

    # (f, g, group)
    heapq.heappush(
        open_set,
        (
            group_h[start_group],
            0,
            start_group
        )
    )

    came_from = {}

    g_score = {
        group_id: inf
        for group_id in groups
    }

    g_score[start_group] = 0

    visited_groups = []

    while open_set:

        f, current_g, current_group = heapq.heappop(open_set)

        if current_g > g_score[current_group]:
            continue

        visited_groups.append(current_group)

        # Goal reached
        if current_group == goal_group:

            # Reconstruct group path
            group_path = []
            group_connections = []

            node = goal_group

            while node != start_group:

                group_path.append(node)

                previous_group, connection = came_from[node]

                group_connections.append(connection)

                node = previous_group

            group_path.append(start_group)

            group_path.reverse()
            group_connections.reverse()

            return {
                "group_path": group_path,
                "group_connections": group_connections,
                "group_cost": g_score[goal_group],
                "visited_groups": visited_groups
            }

        # Explore neighbors
        for neighbor_group, edge_data in group_graph[current_group].items():

            edge_cost = edge_data["cost"]

            new_g = current_g + edge_cost

            if new_g < g_score[neighbor_group]:

                g_score[neighbor_group] = new_g

                came_from[neighbor_group] = (
                    current_group,
                    edge_data
                )

                h = group_h[neighbor_group]

                f = new_g + h

                heapq.heappush(
                    open_set,
                    (
                        f,
                        new_g,
                        neighbor_group
                    )
                )

    raise ValueError(
        f"No group path found from {start_group} to {goal_group}"
    )


# ============================================================
# 6. A* inside one group (with caching)
# ============================================================

@lru_cache(maxsize=1024)
def _local_astar_cached(start_city, goal_city):
    """
    Cached version of local A* that returns tuple for hashability.
    
    Returns:
        (tuple(path), cost, tuple(visited_nodes))
    """

    if start_city == goal_city:
        return (
            (start_city,),
            0,
            ()
        )

    open_set = []

    heapq.heappush(
        open_set,
        (
            heuristic.get(start_city, 0),
            0,
            start_city
        )
    )

    came_from = {}

    g_score = {
        city: inf
        for city in graph
    }

    g_score[start_city] = 0

    visited_nodes = []

    while open_set:

        f, current_g, current_city = heapq.heappop(open_set)

        if current_g > g_score[current_city]:
            continue

        visited_nodes.append(current_city)

        if current_city == goal_city:

            path = []

            node = goal_city

            while node != start_city:

                path.append(node)

                node = came_from[node]

            path.append(start_city)

            path.reverse()

            return (
                tuple(path),
                g_score[goal_city],
                tuple(visited_nodes)
            )

        for neighbor, edge_cost in graph[current_city].items():

            new_g = current_g + edge_cost

            if new_g < g_score[neighbor]:

                g_score[neighbor] = new_g

                came_from[neighbor] = current_city

                h = heuristic.get(neighbor, 0)

                f = new_g + h

                heapq.heappush(
                    open_set,
                    (
                        f,
                        new_g,
                        neighbor
                    )
                )

    raise ValueError(
        f"No path found from {start_city} to {goal_city}"
    )


def local_astar(start_city, goal_city):
    """
    Normal A* search inside the city graph with automatic caching.

    This searches the whole graph, but is used to calculate
    the local path between two cities.
    
    Results are cached to avoid recalculation of the same paths.
    """

    path_tuple, cost, visited_nodes_tuple = _local_astar_cached(start_city, goal_city)

    return {
        "path": list(path_tuple),
        "cost": cost,
        "visited_nodes": list(visited_nodes_tuple)
    }


# ============================================================
# 7. Find connection between two groups (Upgraded)
# ============================================================

def find_best_group_connection(current_city, current_group, next_group, goal_city, goal_group):
    """
    Find the best connection between two groups using heuristic estimation.
    
    Instead of running full A* for each connection, we use heuristic distances
    to estimate the total cost, making this O(n) instead of O(n * A*).
    """
    if next_group not in group_edges.get(current_group, {}):
        raise ValueError(f"No connection between {current_group} and {next_group}")

    connections = group_edges[current_group][next_group]
    
    best_connection = None
    best_total_cost = inf
    
    for exit_city, entry_city, edge_cost in connections:
        
        # Use heuristic distance instead of full A* for estimation
        # This is much faster: O(1) lookup instead of O(E log V)
        heuristic_to_exit = heuristic.get(exit_city, 0)
        heuristic_from_entry = heuristic.get(entry_city, 0)
        
        # Estimate cost using heuristic difference
        estimated_cost_to_exit = heuristic.get(current_city, 0) - heuristic_to_exit
        
        estimated_cost_to_goal = 0
        if next_group == goal_group:
            estimated_cost_to_goal = heuristic_from_entry - heuristic.get(goal_city, 0)
        
        # Clamp negative values (heuristic can be lower in some cases)
        estimated_cost_to_exit = max(0, estimated_cost_to_exit)
        estimated_cost_to_goal = max(0, estimated_cost_to_goal)
        
        total_estimated_cost = estimated_cost_to_exit + edge_cost + estimated_cost_to_goal
        
        if total_estimated_cost < best_total_cost:
            best_total_cost = total_estimated_cost
            best_connection = {
                "from_city": exit_city,
                "to_city": entry_city,
                "cost": edge_cost
            }
            
    return best_connection

# ============================================================
# 8. Hierarchical A*
# ============================================================

def hierarchy_astar(start_city, goal_city):
    """
    Main Hierarchical A* algorithm.

    Steps:

        1. Find start group
        2. Find goal group
        3. Run A* on groups
        4. Find boundary cities between groups
        5. Run local A* inside each group
        6. Combine everything into final path
    """

    # --------------------------------------------------------
    # Validate cities
    # --------------------------------------------------------

    validate_city(start_city)
    validate_city(goal_city)

    # --------------------------------------------------------
    # Find groups
    # --------------------------------------------------------

    start_group, start_group_name = find_city_group(start_city)

    goal_group, goal_group_name = find_city_group(goal_city)

    # --------------------------------------------------------
    # Case: same city
    # --------------------------------------------------------

    if start_city == goal_city:

        return {
            "start": start_city,
            "goal": goal_city,

            "start_group": start_group,
            "start_group_name": start_group_name,

            "goal_group": goal_group,
            "goal_group_name": goal_group_name,

            "group_path": [start_group],
            "group_names": [start_group_name],

            "path": [start_city],

            "cost": 0,

            "visited_groups": [],
            "visited_nodes": []
        }

    # --------------------------------------------------------
    # Case: start and goal are in same group
    # --------------------------------------------------------

    if start_group == goal_group:

        local_result = local_astar(
            start_city,
            goal_city
        )

        return {
            "start": start_city,
            "goal": goal_city,

            "start_group": start_group,
            "start_group_name": start_group_name,

            "goal_group": goal_group,
            "goal_group_name": goal_group_name,

            "group_path": [start_group],
            "group_names": [start_group_name],

            "path": local_result["path"],

            "cost": local_result["cost"],

            "visited_groups": [],

            "visited_nodes": local_result["visited_nodes"]
        }

    # --------------------------------------------------------
    # Group-level A*
    # --------------------------------------------------------

    group_result = group_astar(
        start_group,
        goal_group
    )

    group_path = group_result["group_path"]

    group_connections = group_result["group_connections"]

    # --------------------------------------------------------
    # Build city-level path
    # --------------------------------------------------------

    final_path = []

    total_cost = 0

    visited_nodes = []

    # Current city where we are inside the current group
    current_city = start_city

    # --------------------------------------------------------
    # Traverse every group
    # --------------------------------------------------------

    for i in range(len(group_path) - 1):

        current_group = group_path[i]
        next_group = group_path[i + 1]

        connection = find_best_group_connection(
            current_city,
            current_group,
            next_group,
            goal_city,
            goal_group
        )

        exit_city = connection["from_city"]
        entry_city = connection["to_city"]

        # ----------------------------------------------------
        # Local A*:
        #
        # current city
        #       ↓
        # exit city
        # ----------------------------------------------------

        local_result = local_astar(
            current_city,
            exit_city
        )

        local_path = local_result["path"]

        local_cost = local_result["cost"]

        # Add path without duplicating current city
        if not final_path:

            final_path.extend(local_path)

        else:

            final_path.extend(
                local_path[1:]
            )

        total_cost += local_cost

        visited_nodes.extend(
            local_result["visited_nodes"]
        )

        # ----------------------------------------------------
        # Cross group edge
        # ----------------------------------------------------

        final_path.append(entry_city)

        total_cost += connection["cost"]

        current_city = entry_city

    # --------------------------------------------------------
    # Final local A*:
    #
    # entry city
    #       ↓
    # goal city
    # --------------------------------------------------------

    final_local_result = local_astar(
        current_city,
        goal_city
    )

    final_local_path = final_local_result["path"]

    if final_path:

        final_path.extend(
            final_local_path[1:]
        )

    else:

        final_path.extend(
            final_local_path
        )

    total_cost += final_local_result["cost"]

    visited_nodes.extend(
        final_local_result["visited_nodes"]
    )

    # --------------------------------------------------------
    # Group names
    # --------------------------------------------------------

    group_names = [
        groups[group_id]["name"]
        for group_id in group_path
    ]

    # --------------------------------------------------------
    # Return result
    # --------------------------------------------------------

    return {
        "start": start_city,
        "goal": goal_city,

        "start_group": start_group,
        "start_group_name": start_group_name,

        "goal_group": goal_group,
        "goal_group_name": goal_group_name,

        "group_path": group_path,
        "group_names": group_names,

        "path": final_path,

        "cost": total_cost,

        "visited_groups": group_result["visited_groups"],

        "visited_nodes": visited_nodes
    }


# ============================================================
# 9. Simple test
# ============================================================

if __name__ == "__main__":

    result = hierarchy_astar(
        "Arad",
        "Pitesti"
    )

    print("\n========== Hierarchy A* ==========")

    print(
        "Start:",
        result["start"]
    )

    print(
        "Start Group:",
        result["start_group"],
        "-",
        result["start_group_name"]
    )

    print(
        "Goal:",
        result["goal"]
    )

    print(
        "Goal Group:",
        result["goal_group"],
        "-",
        result["goal_group_name"]
    )

    print(
        "\nGroup Path:"
    )

    print(
        " -> ".join(result["group_names"])
    )

    print(
        "\nCity Path:"
    )

    print(
        " -> ".join(result["path"])
    )

    print(
        "\nTotal Cost:",
        result["cost"]
    )

    print(
        "\nVisited Groups:",
        result["visited_groups"]
    )

    print(
        "\nVisited Nodes:",
        result["visited_nodes"]
    )