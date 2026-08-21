from collections import deque
from graphAstar import graph


def bfs(start, goal):

    queue = deque([start])

    visited = {start}

    parent = {
        start: None
    }

    while queue:

        current = queue.popleft()

        # เจอ goal
        if current == goal:
            break

        # ดูเมืองที่เชื่อมต่อกับ current
        for neighbor in graph[current]:

            if neighbor not in visited:

                visited.add(neighbor)

                parent[neighbor] = current

                queue.append(neighbor)

    # หา goal ไม่เจอ
    if goal not in visited:
        return {
            "path": [],
            "cost": None,
            "visited": list(visited)
        }

    # =========================
    # สร้าง path ย้อนกลับ
    # =========================

    path = []

    current = goal

    while current is not None:

        path.append(current)

        current = parent[current]

    path.reverse()

    # =========================
    # คำนวณระยะทางจริง
    # =========================

    cost = 0

    for i in range(len(path) - 1):

        current_city = path[i]
        next_city = path[i + 1]

        cost += graph[current_city][next_city]

    return {
        "path": path,
        "cost": cost,
        "visited": list(visited)
    }