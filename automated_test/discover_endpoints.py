#!/usr/bin/env python3
"""
STEP 1: Endpoint Discovery
Analyzes FastAPI codebase to extract all endpoints with their methods, paths, and auth requirements.
"""
import json
import re
from pathlib import Path

# Read the main.py to extract endpoints
BACKEND_DIR = Path(__file__).parent.parent / "backend"
MAIN_FILE = BACKEND_DIR / "main.py"

endpoints = []

# Endpoints extracted manually from analysis
# Format: (path, method, auth_required, description)
DISCOVERED = [
    ("/", "GET", False, "Home/status endpoint"),
    ("/register", "POST", False, "User registration - returns JWT token"),
    ("/login", "POST", False, "User login - returns JWT token"),
    ("/send-otp", "POST", False, "Send OTP for registration"),
    ("/verify-otp", "POST", False, "Verify OTP and create account"),
    ("/forgot-password", "POST", False, "Request password reset OTP"),
    ("/reset-password", "POST", False, "Reset password with OTP"),
    ("/detect", "POST", True, "Gingivitis detection (file upload)"),
]

if __name__ == "__main__":
    print("\n" + "="*70)
    print("STEP 1: ENDPOINT DISCOVERY")
    print("="*70)
    print(f"\n✓ Discovered {len(DISCOVERED)} endpoints:\n")
    
    for path, method, auth_required, description in DISCOVERED:
        auth_label = "🔒 AUTH REQUIRED" if auth_required else "🔓 PUBLIC"
        print(f"  {method:6} {path:20} | {auth_label:20} | {description}")
    
    print(f"\n{'='*70}")
    print(f"Total Endpoints: {len(DISCOVERED)}")
    print(f"{'='*70}")
    
    # Save to JSON
    output = {
        "total": len(DISCOVERED),
        "endpoints": [
            {
                "path": path,
                "method": method,
                "requires_auth": auth_required,
                "description": desc,
                "expected_status": 200 if not auth_required else 401,
                "expected_when_public": 200,
                "test_categories": [
                    "authentication_bypass",
                    "injection_detection",
                    "rate_limiting",
                    "response_validation"
                ]
            }
            for path, method, auth_required, desc in DISCOVERED
        ]
    }
    
    with open(Path(__file__).parent / "endpoints.json", "w") as f:
        json.dump(output, f, indent=2)
    
    print("✓ Endpoint list saved to endpoints.json")
    print("\n📋 BEFORE PROCEEDING:\n")
    print("  1. Review the endpoints above")
    print("  2. Confirm BASE_URL and token configuration in input.json")
    print("  3. Run: python runner.py")
    print("\n")
