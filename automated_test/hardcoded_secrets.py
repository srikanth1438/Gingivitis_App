#!/usr/bin/env python3
"""
TEST 2: Hardcoded Secrets Scan
Scans codebase for committed secrets, API keys, tokens, credentials
"""

import re
import json
from pathlib import Path
from datetime import datetime

TEST_DIR = Path(__file__).parent
BACKEND_DIR = Path(__file__).parent.parent / "backend"

# Patterns for common secrets
SECRET_PATTERNS = {
    "api_key": r"(?i)(api[_-]?key|apikey)\s*[:=]\s*['\"]?[a-zA-Z0-9\-_]{20,}",
    "jwt_secret": r"(?i)(secret[_-]?key|jwt[_-]?secret)\s*[:=]\s*['\"]([a-zA-Z0-9\-_]+)['\"]?",
    "password": r"(?i)(password|passwd|pwd)\s*[:=]\s*['\"]([a-zA-Z0-9!@#$%^&*\-_]+)['\"]",
    "db_password": r"(?i)(db[_-]password|database[_-]password)\s*[:=]\s*['\"]([^'\"]+)['\"]",
    "aws_key": r"AKIA[0-9A-Z]{16}",
    "private_key": r"-----BEGIN [A-Z ]+ PRIVATE KEY-----",
    "connection_string": r"(?i)(mongodb|mysql|postgresql|mssql)://[a-zA-Z0-9:@/\-_.]+",
    "auth_token": r"(?i)(auth|bearer|token)\s*[:=]\s*['\"]?[a-zA-Z0-9\-_\.]{50,}",
}

def scan_file(filepath):
    """Scan a single file for secrets"""
    findings = []
    
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            lines = content.split('\n')
        
        for i, line in enumerate(lines, 1):
            for secret_type, pattern in SECRET_PATTERNS.items():
                matches = re.finditer(pattern, line)
                for match in matches:
                    # Skip obvious non-secrets
                    if "test" in line.lower() or "example" in line.lower():
                        continue
                    
                    findings.append({
                        "file": str(filepath.relative_to(BACKEND_DIR.parent)),
                        "line": i,
                        "type": secret_type,
                        "pattern": pattern[:50],
                        "matched_text": match.group()[:50] + "...",
                        "full_line": line[:100],
                    })
    except Exception as e:
        print(f"  Error scanning {filepath}: {e}")
    
    return findings

def scan_codebase():
    """Scan entire backend codebase for secrets"""
    results = []
    
    print("\n📋 HARDCODED SECRETS SCAN")
    print("-" * 70)
    
    # Files to scan
    python_files = list(BACKEND_DIR.glob("*.py"))
    
    print(f"\nScanning {len(python_files)} Python files...\n")
    
    for filepath in python_files:
        findings = scan_file(filepath)
        
        if findings:
            print(f"⚠  {filepath.name}: {len(findings)} potential secret(s)")
            for finding in findings:
                results.append({
                    "file": finding["file"],
                    "line": finding["line"],
                    "type": finding["type"],
                    "finding": True,
                    "severity": "CRITICAL" if "SECRET" in finding["type"] or "PASSWORD" in finding["type"] else "HIGH",
                    "timestamp": datetime.now().isoformat(),
                    "note": finding["full_line"][:80],
                })
                print(f"    Line {finding['line']}: {finding['type']} - {finding['matched_text']}")
    
    # Check for known vulnerable patterns in auth.py
    print("\n▶ Checking auth.py for hardcoded secrets...\n")
    
    auth_file = BACKEND_DIR / "auth.py"
    if auth_file.exists():
        with open(auth_file) as f:
            content = f.read()
        
        if 'SECRET_KEY = "' in content:
            results.append({
                "file": "backend/auth.py",
                "line": "N/A",
                "type": "JWT_SECRET_KEY",
                "finding": True,
                "severity": "CRITICAL",
                "timestamp": datetime.now().isoformat(),
                "note": "Hardcoded SECRET_KEY in auth.py - should use environment variables!",
            })
            print("✗ CRITICAL: Hardcoded SECRET_KEY in auth.py")
            print("  Recommendation: Use environment variables (os.getenv('SECRET_KEY'))")
    
    critical_count = sum(1 for r in results if r.get("severity") == "CRITICAL")
    high_count = sum(1 for r in results if r.get("severity") == "HIGH")
    
    print(f"\nFindings: {critical_count} CRITICAL, {high_count} HIGH")
    
    return results

if __name__ == "__main__":
    results = scan_codebase()
    
    # Save results
    output_file = TEST_DIR / "results_secrets.json"
    with open(output_file, "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\n✓ Results saved to results_secrets.json")
