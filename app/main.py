from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import analize
from app.visualization.router import router as viz_router

app = FastAPI(title="Legal Design Analiza API", version="0.1.0")
app.include_router(analize.router)
app.include_router(viz_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # tighten this in production
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}
