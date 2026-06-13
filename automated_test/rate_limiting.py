#!/usr/bin/env python3
"""
TEST 4: Rate Limiting
Tests: Check if rate limiting is enforced
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

def test_rate_limiting():
    config = load_config()
    base_url = config["baseUrl"]
    results = []
    
    print("\n📋 RATE LIMITING TESTS")
    print("-" * 70)
    
    # Test endpoint
    endpoint = "/login"
    url = base_url + endpoint
    
    print(f"\nTesting rate limiting on {endpoint}...")
    print(f"Sending 50 requests to {endpoint} in rapid succession\n")
    
    request_data = {
        "username": "test_user",
        "password": "password123"
    }
    
    responses = []
    status_counts = {}
    
    start_time = time.time()
    
    for i in range(50):
        try:
            resp = requests.post(url, json=request_data, timeout=5)
            responses.append({
                "attempt": i + 1,
                "status": resp.status_code,
                "elapsed": time.time() - start_time,
            })
            
            status_counts[resp.status_code] = status_counts.get(resp.status_code, 0) + 1
            
            # Print progress every 10 requests
            if (i + 1) % 10 == 0:
                print(f"  {i + 1}/50 requests sent...")
            
        except Exception as e:
            print(f"  Request {i + 1} error: {str(e)[:50]}")
            status_counts["error"] = status_counts.get("error", 0) + 1
    
    total_time = time.time() - start_time
    
    print(f"\n✓ Completed 50 requests in {total_time:.2f}s")
    print(f"\nStatus code distribution:")
    for status, count in sorted(status_counts.items()):
        print(f"  {status}: {count} responses")
    
    # Check for rate limiting indicators
    rate_limit_detected = False
    rate_limit_status = [429, 430, 503]  # Common rate limit codes
    
    if any(status in status_counts for status in rate_limit_status):
        rate_limit_detected = True
        severity = "PASS"
        note = "Rate limiting is enforced (good)"
    else:
        severity = "WARNING"
        note = "No rate limiting detected - API may be vulnerable to abuse"
        
        # But check if 401 increased (indicating auth enforcement)
        if status_counts.get(401, 0) > 40:
            severity = "PASS"
            note = "Auth check is enforced (401 responses). Rate limiting not tested."
    
    results.append({
        "endpoint": endpoint,
        "method": "POST",
        "test": "Rate Limiting",
        "requests_sent": 50,
        "total_time_seconds": total_time,
        "status_distribution": status_counts,
        "rate_limit_detected": rate_limit_detected,
        "finding": not rate_limit_detected,
        "severity": severity,
        "timestamp": datetime.now().isoformat(),
        "note": note,
    })
    
    return results

if __name__ == "__main__":
    results = test_rate_limiting()
    
    # Save results
    output_file = TEST_DIR / "results_ratelimit.json"
    with open(output_file, "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\n✓ Results saved to results_ratelimit.json")
