from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import time

router = APIRouter()

class ThreatEntry(BaseModel):
    id: str
    url: str
    risk_level: str
    score: float
    scam_type: str
    explanation: str
    signals: List[str]
    user_proceeded: bool
    blocked: bool
    timestamp: str

# In-memory storage for MVP
threats_db: List[ThreatEntry] = []

@router.get("/threats/stats")
async def get_stats():
    # Simple stats based on in-memory db
    total_detected = len(threats_db)
    # This is a naive implementation for today_detected 
    # (assuming all non-cleared threats are today's, or just returning total for now)
    today_detected = len(threats_db) 
    total_blocked = sum(1 for t in threats_db if t.blocked)
    
    return {
        "total_detected": total_detected,
        "today_detected": today_detected,
        "total_blocked": total_blocked
    }

@router.get("/threats")
async def get_threats(limit: int = 50, risk_level: Optional[str] = None):
    results = threats_db
    if risk_level:
        results = [t for t in results if t.risk_level == risk_level]
    
    # Return latest threats first
    results = list(reversed(results))[:limit]
    return {"threats": results, "total": len(threats_db)}

@router.delete("/threats")
async def clear_threats():
    threats_db.clear()
    return {"message": "Threats cleared successfully"}

@router.post("/threats")
async def add_threat(threat: ThreatEntry):
    # Skip duplicates by id
    if any(t.id == threat.id for t in threats_db):
        return {"message": "Already exists"}
    threats_db.append(threat)
    return {"message": "Threat added successfully"}
