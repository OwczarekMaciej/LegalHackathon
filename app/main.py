from fastapi import FastAPI

from app.routers import analize

app = FastAPI(title="Legal Design Analiza API", version="0.1.0")
app.include_router(analize.router)


@app.get("/health")
def health():
    return {"status": "ok"}
