#!/usr/bin/env python3
"""
DAST Test Runner - Execute all security tests and generate report
"""

import json
import subprocess
import sys
from pathlib import Path
from datetime import datetime
import time

TEST_DIR = Path(__file__).parent

def load_config():
    """Load test configuration"""
    config_file = TEST_DIR / "input.json"
    if not config_file.exists():
        print("❌ ERROR: input.json not found!")
        print("   Create input.json with your BASE_URL")
        return None
    
    with open(config_file) as f:
        return json.load(f)

def run_test_script(script_name, label):
    """Execute a test script and return results"""
    script_path = TEST_DIR / script_name
    
    if not script_path.exists():
        print(f"⚠ {script_name} not found")
        return None
    
    print(f"\n▶ Running: {label}")
    print("-" * 70)
    
    try:
        result = subprocess.run(
            [sys.executable, str(script_path)],
            cwd=TEST_DIR,
            capture_output=False,
            timeout=120
        )
        
        if result.returncode != 0:
            print(f"⚠ {label} returned exit code {result.returncode}")
            return None
        
        return result
        
    except subprocess.TimeoutExpired:
        print(f"✗ {label} timed out after 120 seconds")
        return None
    except Exception as e:
        print(f"✗ Error running {label}: {e}")
        return None

def load_test_results():
    """Load all test result files"""
    all_results = []
    result_files = list(TEST_DIR.glob("results_*.json"))
    
    print(f"\n\nLoading results from {len(result_files)} test files...\n")
    
    for result_file in sorted(result_files):
        try:
            with open(result_file) as f:
                results = json.load(f)
                
            if isinstance(results, list):
                all_results.extend(results)
            else:
                all_results.append(results)
            
            print(f"  ✓ {result_file.name}")
        except Exception as e:
            print(f"  ✗ Error loading {result_file.name}: {e}")
    
    return all_results

def generate_report(all_results):
    """Generate comprehensive security report"""
    
    print("\n" + "=" * 70)
    print("DAST SECURITY TESTING REPORT")
    print("=" * 70)
    
    # Count findings
    total_tests = len(all_results)
    findings = [r for r in all_results if r.get("finding")]
    critical = [r for r in findings if r.get("severity") == "CRITICAL"]
    high = [r for r in findings if r.get("severity") == "HIGH"]
    warning = [r for r in findings if r.get("severity") == "WARNING"]
    
    print(f"\n📊 SUMMARY")
    print("-" * 70)
    print(f"  Total Tests Run: {total_tests}")
    print(f"  Findings: {len(findings)}")
    print(f"  ✗ CRITICAL: {len(critical)}")
    print(f"  ⚠ HIGH: {len(high)}")
    print(f"  ⓘ WARNING: {len(warning)}")
    
    # Group by endpoint
    print(f"\n🔍 FINDINGS BY ENDPOINT")
    print("-" * 70)
    
    endpoints = {}
    for result in findings:
        ep = result.get("endpoint", "unknown")
        if ep not in endpoints:
            endpoints[ep] = []
        endpoints[ep].append(result)
    
    for endpoint, issues in sorted(endpoints.items()):
        print(f"\n  {endpoint}")
        for issue in issues:
            severity = issue.get("severity", "UNKNOWN")
            test_type = issue.get("test", issue.get("type", "unknown"))
            note = issue.get("note", "")[:60]
            print(f"    • [{severity}] {test_type}: {note}")
    
    # Top issues to fix
    print(f"\n🎯 TOP ISSUES TO FIX")
    print("-" * 70)
    
    if critical:
        print(f"\n  CRITICAL ({len(critical)} issues):")
        for i, issue in enumerate(critical[:5], 1):
            print(f"    {i}. {issue.get('note', 'Unknown issue')[:70]}")
            print(f"       Endpoint: {issue.get('endpoint')}")
    
    if high:
        print(f"\n  HIGH ({len(high)} issues):")
        for i, issue in enumerate(high[:5], 1):
            print(f"    {i}. {issue.get('note', 'Unknown issue')[:70]}")
    
    # Save detailed report
    report = {
        "metadata": {
            "timestamp": datetime.now().isoformat(),
            "total_tests": total_tests,
            "total_findings": len(findings),
            "critical_count": len(critical),
            "high_count": len(high),
            "warning_count": len(warning),
        },
        "summary": {
            "pass_count": total_tests - len(findings),
            "fail_count": len(findings),
        },
        "findings": {
            "critical": critical,
            "high": high,
            "warning": warning,
        },
        "all_results": all_results,
    }
    
    report_file = TEST_DIR / "report.json"
    with open(report_file, "w") as f:
        json.dump(report, f, indent=2)
    
    print(f"\n✓ Detailed report saved to: {report_file}")
    
    return report

def main():
    print("\n" + "=" * 70)
    print("DAST SECURITY TESTING FRAMEWORK")
    print("=" * 70)
    
    # Step 1: Verify config
    config = load_config()
    if not config:
        return 1
    
    base_url = config.get("baseUrl", "").strip()
    print(f"\n✓ Configuration loaded")
    print(f"  Base URL: {base_url}")
    
    # Step 2: Confirm endpoints
    print(f"\n📋 DISCOVERED ENDPOINTS:")
    print("-" * 70)
    
    endpoints_file = TEST_DIR / "endpoints.json"
    if endpoints_file.exists():
        with open(endpoints_file) as f:
            endpoints_data = json.load(f)
        
        print(f"\n  Found {endpoints_data['total']} endpoints:")
        for ep in endpoints_data['endpoints'][:5]:
            print(f"    • {ep['method']:6} {ep['path']:30} | {ep['description'][:40]}")
        
        if len(endpoints_data['endpoints']) > 5:
            print(f"    ... and {len(endpoints_data['endpoints']) - 5} more")
    
    # Step 3: Run tests
    print(f"\n" + "=" * 70)
    print("RUNNING SECURITY TESTS")
    print("=" * 70)
    
    tests = [
        ("hardcoded_secrets.py", "🔐 Hardcoded Secrets Scan"),
        ("authn_bypass.py", "🔑 Authentication Bypass Tests"),
        ("injection_detection.py", "💉 Injection Detection"),
        ("rate_limiting.py", "🚦 Rate Limiting"),
        ("token_tampering.py", "🔀 Token Tampering"),
    ]
    
    for script, label in tests:
        run_test_script(script, label)
        time.sleep(0.5)  # Small delay between tests
    
    # Step 4: Generate report
    print(f"\n" + "=" * 70)
    print("GENERATING REPORT")
    print("=" * 70)
    
    all_results = load_test_results()
    report = generate_report(all_results)
    
    print(f"\n" + "=" * 70)
    print("TESTING COMPLETE")
    print("=" * 70)
    
    print(f"\n✓ Full report: {TEST_DIR / 'report.json'}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
