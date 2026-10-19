"""Integration API tests for DevPilot FastAPI backend."""
import pytest
import os
import tempfile
from fastapi.testclient import TestClient

# Use temporary SQLite DB for testing
test_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
os.environ["DATABASE_PATH"] = test_db.name

from app.main import app
from app.database import db

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    db.init_db(test_db.name)
    yield
    # Cleanup


def test_health_check():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "DevPilot" in data["service"]


def test_analyze_empty_code_rejected():
    res = client.post("/api/analyze", json={"code": ""})
    assert res.status_code == 422


def test_analyze_syntax_error():
    code = "def sample(\n    print('error'"
    res = client.post("/api/analyze", json={"code": code, "request_ai": False})
    assert res.status_code == 200
    data = res.json()
    assert "id" in data
    assert data["summary"]["syntax_valid"] is False
    assert data["summary"]["error_count"] >= 1
    assert len(data["findings"]) >= 1


def test_analyze_and_store_history():
    code = "x = 10\ny = x / 0\nprint(y)"
    res = client.post("/api/analyze", json={"code": code, "request_ai": False})
    assert res.status_code == 200
    data = res.json()
    analysis_id = data["id"]

    # Verify history retrieval
    hist_res = client.get("/api/history")
    assert hist_res.status_code == 200
    history_items = hist_res.json()
    assert any(item["id"] == analysis_id for item in history_items)

    # Verify single item fetch
    single_res = client.get(f"/api/history/{analysis_id}")
    assert single_res.status_code == 200
    single_data = single_res.json()
    assert single_data["id"] == analysis_id
    assert single_data["code"] == code

    # Verify dashboard metrics
    dash_res = client.get("/api/dashboard")
    assert dash_res.status_code == 200
    metrics = dash_res.json()
    assert metrics["total_analyses"] >= 1
    assert metrics["total_errors"] >= 1

    # Verify deletion
    del_res = client.delete(f"/api/history/{analysis_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # After deletion, fetching returns 404
    del_verify_res = client.get(f"/api/history/{analysis_id}")
    assert del_verify_res.status_code == 404


def test_verify_endpoint():
    res = client.post("/api/verify", json={
        "original_code": "x = 'test'\nif x is 'test': pass",
        "proposed_code": "x = 'test'\nif x == 'test': pass"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "verified"
    assert data["syntax_valid"] is True
