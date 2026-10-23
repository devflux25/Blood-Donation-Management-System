import pytest
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings

def test_password_hashing():
    raw = "SecureHospital@2026"
    hashed = get_password_hash(raw)
    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_cors_config_parser():
    origins = settings.cors_origins_list
    assert len(origins) >= 1
    assert any("localhost" in o for o in origins)

def test_token_creation():
    token = create_access_token(subject=1)
    assert isinstance(token, str)
    assert len(token) > 20
