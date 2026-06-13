#!/usr/bin/env python3
"""
TEST 5: Token Tampering
Tests: Verify JWT validation - flip claims without re-signing
Expected: Server MUST reject tampered tokens (401/403)
"""

import json
import requests
import jwt
from pathlib import Path
from datetime import datetime
import base64
import time

TEST_DIR = Path(__file__).parent

def load_config():
    with open(TEST_DIR / "input.json") as f:
        return json.load(f)

def tamper_jwt_token(valid_token):
    """
    Tamper with JWT token by modifying claims without valid signature
    Returns an invalid JWT that should be rejected
    """
    try:
        # Decode without verification (to get structure)
        parts = valid_token.split('.')
        
        if len(parts) != 3:
            return None
        
        # Decode payload (with padding)
        payload_part = parts[1]
        # Add padding if needed
        padding = 4 - len(payload_part) % 4
        if padding != 4:
            payload_part += '=' * padding
        
        payload = json.loads(base64.urlsafe_b64decode(payload_part))
        
        # Tamper: change role or elevate privileges
        payload['role'] = 'admin'
        payload['admin'] = True
        
        # Re-encode
        tampered_payload = base64.urlsafe_b64encode(
            json.dumps(payload).encode()
        ).decode().rstrip('=')
        
        # Create invalid token with tampered payload but original signature
        tampered_token = f"{parts[0]}.{tampered_payload}.{parts[2]}"
        return tampered_token
        
    except Exception as e:
        print(f"Could not tamper token: {e}")
        return None

def test_token_tampering():
    config = load_config()
    base_url = config["baseUrl"]
    results = []
    
    print("\n📋 TOKEN TAMPERING TESTS")
    print("-" * 70)
    
    # First, get a valid token by logging in
    print("\nStep 1: Obtaining a valid token via /login...\n")
    
    login_data = {
        "username": "tamperuser",
        "password": "TamperTest123!"
    }
    
    valid_token = None
    
    # Try to login
    try:
        resp = requests.post(f"{base_url}/login", json=login_data, timeout=5)
        
        if resp.status_code == 200:
            data = resp.json()
            valid_token = data.get("access_token")
            print(f"✓ Got valid token (length: {len(valid_token) if valid_token else 0})")
        else:
            print(f"⚠ Login returned {resp.status_code}. Attempting to register a test user...")
            unique_key = int(time.time()) % 100000
            username = f"tamperuser{unique_key:05d}"
            register_data = {
                "username": username,
                "email": f"{username}@example.com",
                "password": "TamperTest123!"
            }
            reg_resp = requests.post(f"{base_url}/register", json=register_data, timeout=5)
            if reg_resp.status_code == 200:
                valid_token = reg_resp.json().get("access_token")
                print(f"✓ Registered and obtained valid token (length: {len(valid_token) if valid_token else 0})")
            else:
                print(f"✗ Could not obtain a valid token via registration: {reg_resp.status_code}")
                print(f"  Response: {reg_resp.text}")
                valid_token = None

    except Exception as e:
        print(f"⚠ Could not obtain valid token: {e}")
        return results

    if not valid_token:
        print("✗ Unable to obtain valid JWT token. Aborting token tampering tests.")
        return results

    test_endpoints = [
        {
            "path": "/detect",
            "method": "POST",
            "name": "Detect (file upload)",
            "needs_file": True
        }
    ]
    
    # Prepare a valid sample image file for /detect uploads
    test_image_path = Path(__file__).parent.parent / "test.jpg"
    if test_image_path.exists():
        with open(test_image_path, "rb") as f:
            sample_image = f.read()
        files = {"file": ("test.jpg", sample_image, "image/jpeg")}
    else:
        dummy_png = (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
            b"\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\nIDAT"
            b"\x08\xd7c\xf8\x0f\x00\x01\x01\x01\x00\x18\xdd\x8d\x0b\x00\x00\x00\x00IEND\xaeB`\x82"
        )
        files = {"file": ("dummy.png", dummy_png, "image/png")}

    for endpoint in test_endpoints:
        url = base_url + endpoint["path"]
        method = endpoint["method"]
        
        print(f"  Testing {method} {endpoint['path']}")
        
        # Test 1: With valid token
        headers_valid = {"Authorization": f"Bearer {valid_token}"}
        
        try:
            if method == "POST" and endpoint.get("needs_file"):
                resp = requests.post(url, headers=headers_valid, files=files, timeout=10)
                print(f"    • Valid token upload: {resp.status_code}")
            elif method == "POST":
                resp = requests.post(url, headers=headers_valid, timeout=10)
                print(f"    • Valid token: {resp.status_code}")
        except Exception as e:
            print(f"    • Valid token: ERROR - {str(e)[:60]}")
        
        # Test 2: With tampered token
        tampered_token = tamper_jwt_token(valid_token)
        
        if tampered_token:
            headers_tampered = {"Authorization": f"Bearer {tampered_token}"}
            
            try:
                if method == "POST" and endpoint.get("needs_file"):
                    resp = requests.post(url, headers=headers_tampered, files=files, timeout=10)
                elif method == "POST":
                    resp = requests.post(url, headers=headers_tampered, timeout=10)
                else:
                    resp = requests.get(url, headers=headers_tampered, timeout=10)
                    
                is_vulnerable = resp.status_code not in [401, 403]
                severity = "CRITICAL" if is_vulnerable else "PASS"
                
                print(f"    • Tampered token: {resp.status_code} ({'VULNERABLE' if is_vulnerable else 'Correctly rejected'})")
                
                results.append({
                    "endpoint": endpoint["path"],
                    "method": method,
                    "test": "Token Tampering",
                    "tampered_token_status": resp.status_code,
                    "expected_status": "401 or 403",
                    "finding": is_vulnerable,
                    "severity": severity,
                    "timestamp": datetime.now().isoformat(),
                    "note": f"Tampered JWT should be rejected - got {resp.status_code}",
                })
            except Exception as e:
                print(f"    • Tampered token: ERROR - {str(e)[:40]}")
    
    # Check if the API even validates JWT at all
    print("\nStep 3: Testing JWT validation enforcement...\n")
    
    random_token = "eyJhbGciOiJub25lIn0.eyJzdWIiOiIgIn0.invalid"
    headers_random = {"Authorization": f"Bearer {random_token}"}
    
    try:
        resp = requests.post(f"{base_url}/detect", headers=headers_random, files=files, timeout=10)
        
        if resp.status_code == 401 or resp.status_code == 403:
            print(f"  ✓ Random token correctly rejected: {resp.status_code}")
        else:
            print(f"  ✗ Random token accepted: {resp.status_code} (VULNERABLE)")
            results.append({
                "endpoint": "/detect",
                "method": "POST",
                "test": "JWT Validation",
                "status": resp.status_code,
                "finding": True,
                "severity": "CRITICAL",
                "note": "Random/invalid JWT was accepted - no validation",
                "timestamp": datetime.now().isoformat(),
            })
    except Exception as e:
        print(f"  ⚠ Test error: {str(e)[:50]}")
    
    return results

if __name__ == "__main__":
    results = test_token_tampering()
    
    # Save results
    output_file = TEST_DIR / "results_token_tampering.json"
    with open(output_file, "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\n✓ Results saved to results_token_tampering.json")
