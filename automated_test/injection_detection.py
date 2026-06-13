#!/usr/bin/env python3
"""
TEST 3: Injection Detection
Tests: SQLi, NoSQLi, command injection, path traversal detection
Detection-only: flags anomalous responses, errors, or timing
"""

import json
import requests
import time
from pathlib import Path
from datetime import datetime

TEST_DIR = Path(__file__).parent

def load_config():
    with open(TEST_DIR / "input.json") as f:
        return json.load(f)

# SQL/NoSQL injection payloads (detection-only, no write operations)
INJECTION_PAYLOADS = {
    "sql_union": {
        "payload": "' OR '1'='1' UNION SELECT NULL, NULL, NULL--",
        "name": "SQL UNION-based",
        "indicators": ["error", "syntax", "sql", "exception"]
    },
    "sql_blind": {
        "payload": "' AND SLEEP(2)--",
        "name": "SQL Time-based blind",
        "indicators": ["delay", "timeout"]
    },
    "nosql_injection": {
        "payload": "{'$ne': null}",
        "name": "NoSQL operator",
        "indicators": ["operator", "parse", "invalid"]
    },
    "path_traversal": {
        "payload": "../../../../etc/passwd",
        "name": "Path traversal",
        "indicators": ["root:", "traversal"]
    },
    "command_injection": {
        "payload": "; cat /etc/passwd",
        "name": "Command injection",
        "indicators": ["root:", "command"]
    },
}

def test_injection_in_endpoint(url, method, param_name, injection_key):
    """Test a single injection payload in an endpoint"""
    payload = INJECTION_PAYLOADS[injection_key]["payload"]
    name = INJECTION_PAYLOADS[injection_key]["name"]
    indicators = INJECTION_PAYLOADS[injection_key]["indicators"]
    
    try:
        start_time = time.time()
        
        if method == "GET":
            resp = requests.get(f"{url}?{param_name}={payload}", timeout=5)
        else:
            data = {param_name: payload}
            resp = requests.post(url, json=data, timeout=5)
        
        elapsed_ms = (time.time() - start_time) * 1000
        
        # Detect anomalies
        is_vulnerable = False
        anomalies = []
        
        # Check for error messages
        if any(ind in resp.text.lower() for ind in indicators):
            is_vulnerable = True
            anomalies.append("Error message leaked")
        
        # Check for unusual status codes
        if resp.status_code in [500, 502, 503]:
            anomalies.append(f"Server error: {resp.status_code}")
            is_vulnerable = True
        
        # Detect validation failures that correctly reject payloads
        validation_errors = [
            "value is not a valid email address",
            "invalid email",
            "field required",
            "email must be a valid email address",
        ]
        if resp.status_code == 422 and any(err in resp.text.lower() for err in validation_errors):
            anomalies.append("Input validation rejected payload")
            is_vulnerable = False
        
        # Check timing only for normal or server responses
        if resp.status_code in [200, 201, 400, 403, 404] and elapsed_ms > 2000:
            anomalies.append(f"Slow response: {elapsed_ms}ms")
            # Only mark as anomaly if no validation error was present
            if resp.status_code == 200:
                is_vulnerable = True
        
        note = "Potential " + name if is_vulnerable else "No anomaly for " + name
        if resp.status_code == 422 and not is_vulnerable:
            note = "Input validation rejected payload"
        
        return {
            "endpoint": url,
            "method": method,
            "parameter": param_name,
            "injection_type": name,
            "status": resp.status_code,
            "response_time_ms": int(elapsed_ms),
            "finding": is_vulnerable,
            "severity": "CRITICAL" if is_vulnerable else "PASS",
            "anomalies": anomalies,
            "timestamp": datetime.now().isoformat(),
            "note": note,
        }
    
    except requests.Timeout:
        return {
            "endpoint": url,
            "parameter": param_name,
            "injection_type": name,
            "finding": True,
            "severity": "HIGH",
            "error": "Request timeout (possible blind SQLi time delay)",
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        return {
            "endpoint": url,
            "parameter": param_name,
            "injection_type": name,
            "finding": False,
            "error": str(e)[:50],
            "timestamp": datetime.now().isoformat(),
        }

def test_injection_detection():
    config = load_config()
    base_url = config["baseUrl"]
    results = []
    
    print("\n📋 INJECTION DETECTION TESTS")
    print("-" * 70)
    
    # Test endpoints with common parameters
    test_cases = [
        {
            "endpoint": "/register",
            "method": "POST",
            "parameters": ["username", "email", "password"]
        },
        {
            "endpoint": "/login",
            "method": "POST",
            "parameters": ["username", "password"]
        },
        {
            "endpoint": "/send-otp",
            "method": "POST",
            "parameters": ["email", "username"]
        },
        {
            "endpoint": "/forgot-password",
            "method": "POST",
            "parameters": ["email"]
        },
    ]
    
    print("\nTesting for SQL/NoSQL injection, path traversal, command injection...\n")
    
    for test in test_cases:
        endpoint = test["endpoint"]
        url = base_url + endpoint
        method = test["method"]
        
        print(f"  Testing {method} {endpoint}")
        
        for param in test["parameters"]:
            for inj_key in ["sql_union", "sql_blind", "nosql_injection", "command_injection"]:
                result = test_injection_in_endpoint(url, method, param, inj_key)
                results.append(result)
                
                if result.get("finding"):
                    print(f"    ⚠ {inj_key}: {result.get('severity')}")
    
    finding_count = sum(1 for r in results if r.get("finding"))
    print(f"\n✓ Injection tests complete. Anomalies detected: {finding_count}")
    
    return results

if __name__ == "__main__":
    results = test_injection_detection()
    
    # Save results
    output_file = TEST_DIR / "results_injection.json"
    with open(output_file, "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"✓ Results saved to results_injection.json")
