#!/usr/bin/env node

/**
 * Test Summary Generator for Fabularius.art
 * Aggregates test results from backend and frontend and generates comprehensive reports
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, "..");
const BACKEND_DIR = path.join(PROJECT_ROOT, "backend");
const FRONTEND_DIR = path.join(PROJECT_ROOT, "frontend");
const COVERAGE_DIR = path.join(PROJECT_ROOT, "coverage");
const TEST_RESULTS_DIR = path.join(PROJECT_ROOT, "test-results");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// Utility functions
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) =>
    console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) =>
    console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
};

// Ensure directories exist
function ensureDirectories() {
  [COVERAGE_DIR, TEST_RESULTS_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Read JSON file safely
function readJsonFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (error) {
    log.warning(`Failed to read ${filePath}: ${error.message}`);
  }
  return null;
}

// Read coverage data
function readCoverageData() {
  const backendCoverage = readJsonFile(
    path.join(BACKEND_DIR, "coverage", "coverage-summary.json")
  );
  const frontendCoverage = readJsonFile(
    path.join(FRONTEND_DIR, "coverage", "coverage-summary.json")
  );

  return {
    backend: backendCoverage,
    frontend: frontendCoverage,
  };
}

// Read test results
function readTestResults() {
  const backendResults = readJsonFile(
    path.join(BACKEND_DIR, "test-results.json")
  );
  const frontendResults = readJsonFile(
    path.join(FRONTEND_DIR, "test-results.json")
  );
  const playwrightResults = readJsonFile(
    path.join(FRONTEND_DIR, "playwright-report", "results.json")
  );

  return {
    backend: backendResults,
    frontend: frontendResults,
    e2e: playwrightResults,
  };
}

// Calculate combined coverage
function calculateCombinedCoverage(coverageData) {
  const { backend, frontend } = coverageData;

  if (!backend || !frontend) {
    log.warning("Missing coverage data for some components");
    return null;
  }

  const backendTotal = backend.total;
  const frontendTotal = frontend.total;

  // Calculate weighted average based on lines of code
  const backendLines = backendTotal.lines.total;
  const frontendLines = frontendTotal.lines.total;
  const totalLines = backendLines + frontendLines;

  const backendWeight = backendLines / totalLines;
  const frontendWeight = frontendLines / totalLines;

  return {
    lines: {
      total: totalLines,
      covered: backendTotal.lines.covered + frontendTotal.lines.covered,
      pct:
        Math.round(
          (backendTotal.lines.pct * backendWeight +
            frontendTotal.lines.pct * frontendWeight) *
            100
        ) / 100,
    },
    statements: {
      total: backendTotal.statements.total + frontendTotal.statements.total,
      covered:
        backendTotal.statements.covered + frontendTotal.statements.covered,
      pct:
        Math.round(
          (backendTotal.statements.pct * backendWeight +
            frontendTotal.statements.pct * frontendWeight) *
            100
        ) / 100,
    },
    functions: {
      total: backendTotal.functions.total + frontendTotal.functions.total,
      covered: backendTotal.functions.covered + frontendTotal.functions.covered,
      pct:
        Math.round(
          (backendTotal.functions.pct * backendWeight +
            frontendTotal.functions.pct * frontendWeight) *
            100
        ) / 100,
    },
    branches: {
      total: backendTotal.branches.total + frontendTotal.branches.total,
      covered: backendTotal.branches.covered + frontendTotal.branches.covered,
      pct:
        Math.round(
          (backendTotal.branches.pct * backendWeight +
            frontendTotal.branches.pct * frontendWeight) *
            100
        ) / 100,
    },
  };
}

// Calculate test summary
function calculateTestSummary(testResults) {
  const summary = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
    components: {},
  };

  // Backend tests
  if (testResults.backend) {
    const backend = testResults.backend;
    summary.components.backend = {
      total: backend.numTotalTests || 0,
      passed: backend.numPassedTests || 0,
      failed: backend.numFailedTests || 0,
      skipped: backend.numPendingTests || 0,
      duration:
        backend.testResults?.reduce(
          (acc, result) =>
            acc + (result.perfStats?.end - result.perfStats?.start || 0),
          0
        ) || 0,
    };

    summary.total += summary.components.backend.total;
    summary.passed += summary.components.backend.passed;
    summary.failed += summary.components.backend.failed;
    summary.skipped += summary.components.backend.skipped;
    summary.duration += summary.components.backend.duration;
  }

  // Frontend tests
  if (testResults.frontend) {
    const frontend = testResults.frontend;
    summary.components.frontend = {
      total: frontend.numTotalTests || 0,
      passed: frontend.numPassedTests || 0,
      failed: frontend.numFailedTests || 0,
      skipped: frontend.numPendingTests || 0,
      duration:
        frontend.testResults?.reduce(
          (acc, result) =>
            acc + (result.perfStats?.end - result.perfStats?.start || 0),
          0
        ) || 0,
    };

    summary.total += summary.components.frontend.total;
    summary.passed += summary.components.frontend.passed;
    summary.failed += summary.components.frontend.failed;
    summary.skipped += summary.components.frontend.skipped;
    summary.duration += summary.components.frontend.duration;
  }

  // E2E tests
  if (testResults.e2e) {
    const e2e = testResults.e2e;
    const stats = e2e.stats || {};

    summary.components.e2e = {
      total: stats.expected || 0,
      passed: stats.passed || 0,
      failed: stats.failed || 0,
      skipped: stats.skipped || 0,
      duration: stats.duration || 0,
    };

    summary.total += summary.components.e2e.total;
    summary.passed += summary.components.e2e.passed;
    summary.failed += summary.components.e2e.failed;
    summary.skipped += summary.components.e2e.skipped;
    summary.duration += summary.components.e2e.duration;
  }

  return summary;
}

// Generate markdown report
function generateMarkdownReport(summary, coverage, testSummary) {
  const timestamp = new Date().toISOString();
  const passRate =
    testSummary.total > 0
      ? Math.round((testSummary.passed / testSummary.total) * 100)
      : 0;
  const duration = Math.round(testSummary.duration / 1000);

  let report = `# Test Summary Report\n\n`;
  report += `**Generated:** ${timestamp}\n\n`;

  // Overall Status
  const overallStatus = testSummary.failed === 0 ? "✅ PASSED" : "❌ FAILED";
  report += `## Overall Status: ${overallStatus}\n\n`;

  // Test Results Summary
  report += `## Test Results\n\n`;
  report += `| Metric | Value |\n`;
  report += `|--------|-------|\n`;
  report += `| Total Tests | ${testSummary.total} |\n`;
  report += `| Passed | ${testSummary.passed} |\n`;
  report += `| Failed | ${testSummary.failed} |\n`;
  report += `| Skipped | ${testSummary.skipped} |\n`;
  report += `| Pass Rate | ${passRate}% |\n`;
  report += `| Duration | ${duration}s |\n\n`;

  // Component Breakdown
  report += `## Component Breakdown\n\n`;
  report += `| Component | Total | Passed | Failed | Skipped | Duration |\n`;
  report += `|-----------|-------|--------|--------|---------|----------|\n`;

  Object.entries(testSummary.components).forEach(([component, stats]) => {
    const componentDuration = Math.round(stats.duration / 1000);
    const componentPassRate =
      stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;
    const status = stats.failed === 0 ? "✅" : "❌";

    report += `| ${component} ${status} | ${stats.total} | ${stats.passed} | ${stats.failed} | ${stats.skipped} | ${componentDuration}s (${componentPassRate}%) |\n`;
  });

  report += `\n`;

  // Coverage Summary
  if (coverage) {
    report += `## Coverage Summary\n\n`;
    report += `| Metric | Percentage | Covered/Total |\n`;
    report += `|--------|------------|---------------|\n`;
    report += `| Lines | ${coverage.lines.pct}% | ${coverage.lines.covered}/${coverage.lines.total} |\n`;
    report += `| Statements | ${coverage.statements.pct}% | ${coverage.statements.covered}/${coverage.statements.total} |\n`;
    report += `| Functions | ${coverage.functions.pct}% | ${coverage.functions.covered}/${coverage.functions.total} |\n`;
    report += `| Branches | ${coverage.branches.pct}% | ${coverage.branches.covered}/${coverage.branches.total} |\n\n`;

    // Coverage by Component
    report += `## Coverage by Component\n\n`;
    report += `### Backend Coverage\n\n`;
    if (summary.backend) {
      const backend = summary.backend.total;
      report += `- **Lines:** ${backend.lines.pct}% (${backend.lines.covered}/${backend.lines.total})\n`;
      report += `- **Statements:** ${backend.statements.pct}% (${backend.statements.covered}/${backend.statements.total})\n`;
      report += `- **Functions:** ${backend.functions.pct}% (${backend.functions.covered}/${backend.functions.total})\n`;
      report += `- **Branches:** ${backend.branches.pct}% (${backend.branches.covered}/${backend.branches.total})\n\n`;
    }

    report += `### Frontend Coverage\n\n`;
    if (summary.frontend) {
      const frontend = summary.frontend.total;
      report += `- **Lines:** ${frontend.lines.pct}% (${frontend.lines.covered}/${frontend.lines.total})\n`;
      report += `- **Statements:** ${frontend.statements.pct}% (${frontend.statements.covered}/${frontend.statements.total})\n`;
      report += `- **Functions:** ${frontend.functions.pct}% (${frontend.functions.covered}/${frontend.functions.total})\n`;
      report += `- **Branches:** ${frontend.branches.pct}% (${frontend.branches.covered}/${frontend.branches.total})\n\n`;
    }
  }

  // Quality Gates
  report += `## Quality Gates\n\n`;
  const coverageThreshold = 85;
  const passRateThreshold = 95;

  const coverageGate =
    coverage && coverage.lines.pct >= coverageThreshold ? "✅" : "❌";
  const passRateGate = passRate >= passRateThreshold ? "✅" : "❌";
  const noFailuresGate = testSummary.failed === 0 ? "✅" : "❌";

  report += `| Gate | Status | Requirement | Actual |\n`;
  report += `|------|--------|-------------|--------|\n`;
  report += `| Coverage | ${coverageGate} | ≥${coverageThreshold}% | ${
    coverage ? coverage.lines.pct : "N/A"
  }% |\n`;
  report += `| Pass Rate | ${passRateGate} | ≥${passRateThreshold}% | ${passRate}% |\n`;
  report += `| No Failures | ${noFailuresGate} | 0 failed tests | ${testSummary.failed} failed |\n\n`;

  // Failed Tests (if any)
  if (testSummary.failed > 0) {
    report += `## Failed Tests\n\n`;

    Object.entries(testSummary.components).forEach(([component, stats]) => {
      if (stats.failed > 0) {
        report += `### ${component} (${stats.failed} failed)\n\n`;
        // Note: Detailed failure information would need to be extracted from test results
        report += `See detailed test results for specific failure information.\n\n`;
      }
    });
  }

  // Recommendations
  report += `## Recommendations\n\n`;

  if (coverage && coverage.lines.pct < coverageThreshold) {
    report += `- 📈 **Improve test coverage:** Current coverage (${coverage.lines.pct}%) is below threshold (${coverageThreshold}%)\n`;
  }

  if (testSummary.failed > 0) {
    report += `- 🔧 **Fix failing tests:** ${testSummary.failed} test(s) are currently failing\n`;
  }

  if (passRate < passRateThreshold) {
    report += `- 🎯 **Improve test reliability:** Pass rate (${passRate}%) is below threshold (${passRateThreshold}%)\n`;
  }

  if (testSummary.skipped > 0) {
    report += `- ⚠️ **Review skipped tests:** ${testSummary.skipped} test(s) are being skipped\n`;
  }

  if (
    coverage &&
    coverage.lines.pct >= coverageThreshold &&
    testSummary.failed === 0 &&
    passRate >= passRateThreshold
  ) {
    report += `- 🎉 **Great job!** All quality gates are passing\n`;
  }

  report += `\n---\n\n`;
  report += `*Report generated by Fabularius.art test suite*\n`;

  return report;
}

// Generate JSON summary
function generateJsonSummary(summary, coverage, testSummary) {
  return {
    timestamp: new Date().toISOString(),
    overall: {
      status: testSummary.failed === 0 ? "PASSED" : "FAILED",
      passRate:
        testSummary.total > 0
          ? Math.round((testSummary.passed / testSummary.total) * 100)
          : 0,
      duration: Math.round(testSummary.duration / 1000),
    },
    tests: testSummary,
    coverage: coverage,
    coverageByComponent: summary,
    qualityGates: {
      coverage: coverage ? coverage.lines.pct >= 85 : false,
      passRate:
        testSummary.total > 0
          ? testSummary.passed / testSummary.total >= 0.95
          : false,
      noFailures: testSummary.failed === 0,
    },
  };
}

// Merge coverage files
function mergeCoverageFiles() {
  log.info("Merging coverage files...");

  try {
    const backendLcov = path.join(BACKEND_DIR, "coverage", "lcov.info");
    const frontendLcov = path.join(FRONTEND_DIR, "coverage", "lcov.info");
    const combinedLcov = path.join(COVERAGE_DIR, "lcov.info");

    let combinedContent = "";

    if (fs.existsSync(backendLcov)) {
      combinedContent += fs.readFileSync(backendLcov, "utf8");
      combinedContent += "\n";
    }

    if (fs.existsSync(frontendLcov)) {
      combinedContent += fs.readFileSync(frontendLcov, "utf8");
    }

    if (combinedContent) {
      fs.writeFileSync(combinedLcov, combinedContent);
      log.success("Coverage files merged successfully");
    }
  } catch (error) {
    log.error(`Failed to merge coverage files: ${error.message}`);
  }
}

// Main function
function main() {
  log.info("Generating test summary...");

  ensureDirectories();

  // Read data
  const coverageData = readCoverageData();
  const testResults = readTestResults();

  // Calculate summaries
  const combinedCoverage = calculateCombinedCoverage(coverageData);
  const testSummary = calculateTestSummary(testResults);

  // Generate reports
  const markdownReport = generateMarkdownReport(
    coverageData,
    combinedCoverage,
    testSummary
  );
  const jsonSummary = generateJsonSummary(
    coverageData,
    combinedCoverage,
    testSummary
  );

  // Write reports
  fs.writeFileSync(path.join(PROJECT_ROOT, "test-summary.md"), markdownReport);
  fs.writeFileSync(
    path.join(PROJECT_ROOT, "test-summary.json"),
    JSON.stringify(jsonSummary, null, 2)
  );

  // Merge coverage files
  mergeCoverageFiles();

  // Console output
  log.success("Test summary generated successfully");
  log.info(`Overall status: ${jsonSummary.overall.status}`);
  log.info(`Pass rate: ${jsonSummary.overall.passRate}%`);
  log.info(
    `Coverage: ${combinedCoverage ? combinedCoverage.lines.pct : "N/A"}%`
  );
  log.info(`Duration: ${jsonSummary.overall.duration}s`);

  // Exit with appropriate code
  process.exit(testSummary.failed > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  readCoverageData,
  readTestResults,
  calculateCombinedCoverage,
  calculateTestSummary,
  generateMarkdownReport,
  generateJsonSummary,
};
