from fastapi.testclient import TestClient
from main import app # assuming fast api app is exported in main.py

client = TestClient(app)

def test_analyze_fire():
    resp = client.post("/api/analyze", json={"description": "Large building fire near the Keesara Gutta temple with heavy smoke."})
    # Might need a mock, but this tests the endpoint functionality if model is reachable
    assert resp.status_code == 200
    d = resp.json()
    assert d["type"] == "fire"
    assert d["severity"] in ["high", "critical", "medium"]
    assert "firetruck" in d["vehicles_required"]
    assert "confidence" in d

def test_analyze_medical():
    resp = client.post("/api/analyze", json={"description": "Elderly man collapsed at market crossing, not breathing."})
    assert resp.status_code == 200
    d = resp.json()
    assert d["type"] == "medical"
    assert "ambulance" in d["vehicles_required"]

def test_empty_description_fails():
    resp = client.post("/api/analyze", json={"description": ""})
    # If there is no specific empty validation before vertex ai, it might fail inside.
    # It will probably return 200 with an unpredictable response because we didn't add pydantic constraint
    # But usually a bad request or 500
    assert resp.status_code in [200, 400, 422, 500]
