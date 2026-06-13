#!/usr/bin/env python3
"""
TEST 1: Authentication Bypass
Tests: protected endpoints without/with invalid/expired tokens
Expected: All should return 401 for missing/invalid auth
"""

import json
import requests
import time
from pathlib import Path
from datetime import datetime, timedelta
import jwt

TEST_DIR = Path(__file__).parent

def load_config():
    with open(TEST_DIR / "input.json") as f:
        return json.load(f)

def test_authn_bypass():
    config = load_config()
    base_url = config["baseUrl"]
    results = []
    
    print("\n📋 AUTHENTICATION BYPASS TESTS")
    print("-" * 70)
    
    # Define endpoints that should require authentication (none in this API - all are public!)
    # But we'll test them anyway to see if any DO enforce auth
    protected_endpoints = [
        {"path": "/detect", "method": "POST", "data": {"file": "test.jpg"}},
    ]
    
    # Test scenarios
    test_cases = [
        {"name": "No Auth Header", "headers": {}, "expected": 422},  # FastAPI rejects - no file
        {"name": "Invalid Token Format", "headers": {"Authorization": "Bearer invalid"}, "expected": 422},
        {"name": "Malformed Bearer", "headers": {"Authorization": "NotBearer token"}, "expected": 422},
        {"name": "Empty Bearer", "headers": {"Authorization": "Bearer "}, "expected": 422},
    ]
    
    # Test public endpoints - they should ALL allow access without returning 401
    print("\nPublic Endpoints (should return 200, 400, or 422 - NOT 401):\n")
    
    public_endpoints = [
        {"path": "/", "method": "GET", "name": "Home"},
        {"path": "/register", "method": "POST", "name": "Register", "data": {"username": "test_u", "email": "test@test.com", "password": "pass12345"}},
        {"path": "/login", "method": "POST", "name": "Login", "data": {"username": "test_u", "password": "pass12345"}},
        {"path": "/send-otp", "method": "POST", "name": "Send OTP", "data": {"username": "test_u", "email": "test@test.com", "password": "pass12345"}},
    ]
    
    for endpoint in public_endpoints:
        try:
            url = base_url + endpoint["path"]
            method = endpoint["method"]
            
            if method == "GET":
                resp = requests.get(url, timeout=5)
            else:
                resp = requests.post(url, json=endpoint.get("data", {}), timeout=5)
            
            # Check: should NOT be 401
            finding = resp.status_code == 401
            severity = "CRITICAL" if finding else "PASS"
            
            result = {
                "endpoint": endpoint["path"],
                "method": method,
                "test": "No Authentication Bypass",
                "expected_status": "NOT 401",
                "actual_status": resp.status_code,
                "finding": finding,
                "severity": severity,
                "response_time_ms": int(resp.elapsed.total_seconds() * 1000),
                "timestamp": datetime.now().isoformat(),
                "note": f"{'✗ VULNERABLE' if finding else '✓ Correct - no 401'} - returned {resp.status_code}"
            }
            results.append(result)
            
            status_icon = "✗" if finding else "✓"
            print(f"  {status_icon} {endpoint['name']:20} | Status: {resp.status_code}")
            
        except Exception as e:
            print(f"  ✗ {endpoint['name']:20} | ERROR: {str(e)[:50]}")
            results.append({
                "endpoint": endpoint["path"],
                "method": method,
                "test": "No Authentication Bypass",
                "finding": False,
                "severity": "UNKNOWN",
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
            })
    
    # Test protected endpoints to ensure missing or invalid auth is rejected
    print("\nProtected Endpoints (should return 401 or 403 for invalid auth):\n")
    
    test_image_path = Path(__file__).parent.parent / "test.jpg"
    if test_image_path.exists():
        with open(test_image_path, "rb") as f:
            sample_image = f.read()
    else:
        sample_image = (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
            b"\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\nIDAT"
            b"\x08\xd7c\xf8\x0f\x00\x01\x01\x01\x00\x18\xdd\x8d\x0b\x00\x00\x00\x00IEND\xaeB`\x82"
        )
    files = {"file": ("test.jpg", sample_image, "image/jpeg")}
    protected_endpoints = [
        {"path": "/detect", "method": "POST", "name": "Detect", "files": files}
    ]
    test_cases = [
        {"name": "No Auth Header", "headers": {}},
        {"name": "Invalid Token Format", "headers": {"Authorization": "Bearer invalid"}},
        {"name": "Malformed Bearer", "headers": {"Authorization": "NotBearer token"}},
        {"name": "Empty Bearer", "headers": {"Authorization": "Bearer "}},
    ]
    
    for endpoint in protected_endpoints:
        for case in test_cases:
            try:
                url = base_url + endpoint["path"]
                resp = requests.post(url, headers=case["headers"], files=endpoint.get("files"), timeout=10)
                finding = resp.status_code not in [401, 403]
                severity = "CRITICAL" if finding else "PASS"
                results.append({
                    "endpoint": endpoint["path"],
                    "method": endpoint["method"],
                    "test": "Protected Endpoint Auth Enforcement",
                    "case": case["name"],
                    "expected_status": "401 or 403",
                    "actual_status": resp.status_code,
                    "finding": finding,
                    "severity": severity,
                    "response_time_ms": int(resp.elapsed.total_seconds() * 1000),
                    "timestamp": datetime.now().isoformat(),
                    "note": f"{case['name']} returned {resp.status_code}"
                })
                status_icon = "✗" if finding else "✓"
                print(f"  {status_icon} {endpoint['name']:20} | {case['name']:25} | Status: {resp.status_code}")
            except Exception as e:
                print(f"  ✗ {endpoint['name']:20} | {case['name']:25} | ERROR: {str(e)[:50]}")
                results.append({
                    "endpoint": endpoint["path"],
                    "method": endpoint["method"],
                    "test": "Protected Endpoint Auth Enforcement",
                    "case": case["name"],
                    "finding": False,
                    "severity": "UNKNOWN",
                    "error": str(e),
                    "timestamp": datetime.now().isoformat(),
                })
    
    print(f"\nFound {sum(1 for r in results if r.get('finding'))} authentication bypass issues")
    
    return results

if __name__ == "__main__":
    results = test_authn_bypass()
    
    # Save results
    output_file = TEST_DIR / "results_authn.json"
    with open(output_file, "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\n✓ Results saved to results_authn.json")
