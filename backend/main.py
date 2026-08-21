from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from hierarchical_astar import hierarchy_astar
from bfs_BlindSearch import bfs

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PathfindingRequest(BaseModel):
    start: str
    goal: str

@app.get("/")
def root():
    return {"message": "Romania Pathfinding API" }

@app.post("/path")
def find_path(request: PathfindingRequest):
    AStar_result = hierarchy_astar(
        request.start,
        request.goal
    )
    
    bfs_result = bfs(
        request.start,
        request.goal
    )

    return {"astar": AStar_result, "bfs": bfs_result}
