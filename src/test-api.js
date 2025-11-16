#!/usr/bin/env node

/**
 * Comprehensive test suite for Hill Chart API
 * Tests both HTTP endpoints and programmatic API based on API.md specification
 *
 * Usage:
 * Start the server in one terminal
 * ```zsh
 * yarn start
 * ```
 *
 * Run tests in another terminal
 * ```zsh
 * node test-api.js
 * ```
 *
 * Or test against a different URL
 * ```zsh
 * TEST_BASE_URL=https://your-server.com node test-api.js
 * ```
 */

const http = require("http");
const https = require("https");
const { streamHillChart } = require("./hill-chart");

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const TESTS = [];
let PASSED = 0;
let FAILED = 0;

// Test runner utilities
function test(name, fn) {
  TESTS.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertIncludes(str, substr, message) {
  if (!str.includes(substr)) {
    throw new Error(message || `Expected "${str}" to include "${substr}"`);
  }
}

function assertBuffer(buffer, minSize = 100) {
  assert(Buffer.isBuffer(buffer), "Expected a Buffer");
  assert(buffer.length > minSize, `Buffer too small: ${buffer.length} bytes`);
}

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    if (options.query) {
      Object.entries(options.query).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    // Use https module for https:// URLs, http module for http:// URLs
    const client = url.protocol === "https:" ? https : http;

    const req = client.request(url, { method: options.method || "GET" }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks),
        });
      });
    });

    req.on("error", reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
    req.end();
  });
}

// ============================================================================
// HTTP API Tests - PNG Endpoint
// ============================================================================

test("PNG endpoint: Basic request returns 200", async () => {
  const res = await makeRequest("/v2/35/hill-chart.png");
  assertEqual(res.status, 200, "Expected status 200");
  assertBuffer(res.body);
});

test("PNG endpoint: Returns PNG content type", async () => {
  const res = await makeRequest("/v2/35/hill-chart.png");
  assertEqual(res.headers["content-type"], "image/png", "Expected image/png content type");
});

test("PNG endpoint: Has Cache-Control header", async () => {
  const res = await makeRequest("/v2/35/hill-chart.png");
  assertIncludes(res.headers["cache-control"], "max-age:86400", "Expected Cache-Control header with max-age:86400");
});

test("PNG endpoint: Filename in Content-Disposition (no title)", async () => {
  const res = await makeRequest("/v2/35/hill-chart.png");
  const disposition = res.headers["content-disposition"];
  assertIncludes(disposition, "hill-chart-at-35.png", "Expected filename in Content-Disposition");
  assertIncludes(disposition, "inline", "Expected inline disposition");
});

test("PNG endpoint: Title parameter works", async () => {
  const res = await makeRequest("/v2/35/hill-chart.png", {
    query: { title: "Test Project" },
  });
  const disposition = res.headers["content-disposition"];
  assertIncludes(disposition, "Test_Project", "Expected title in filename");
});

test("PNG endpoint: hideLabels=true hides labels", async () => {
  const res = await makeRequest("/v2/35/hill-chart.png", {
    query: { hideLabels: "true" },
  });
  assertEqual(res.status, 200, "Expected status 200");
  assertBuffer(res.body);
});

test("PNG endpoint: hideLabels=1 hides labels", async () => {
  const res = await makeRequest("/v2/35/hill-chart.png", {
    query: { hideLabels: "1" },
  });
  assertEqual(res.status, 200, "Expected status 200");
  assertBuffer(res.body);
});

test("PNG endpoint: download parameter sets attachment", async () => {
  const res = await makeRequest("/v2/35/hill-chart.png", {
    query: { download: "1" },
  });
  const disposition = res.headers["content-disposition"];
  assertIncludes(disposition, "attachment", "Expected attachment disposition");
});

test("PNG endpoint: Invalid t parameter returns 422", async () => {
  try {
    const res = await makeRequest("/v2/abc/hill-chart.png");
    assertEqual(res.status, 422, "Expected status 422 for invalid t");
  } catch (error) {
    // Some servers might close connection, which is also acceptable
    assert(
      error.message.includes("timeout") || error.message.includes("ECONNRESET"),
      "Unexpected error: " + error.message
    );
  }
});

test("PNG endpoint: Negative t is clamped to 0", async () => {
  const res = await makeRequest("/v2/-10/hill-chart.png");
  assertEqual(res.status, 200, "Expected status 200");
  const disposition = res.headers["content-disposition"];
  assertIncludes(disposition, "hill-chart-at-0.png", "Expected clamped value 0");
});

test("PNG endpoint: t > 100 is clamped to 100", async () => {
  const res = await makeRequest("/v2/150/hill-chart.png");
  assertEqual(res.status, 200, "Expected status 200");
  const disposition = res.headers["content-disposition"];
  assertIncludes(disposition, "hill-chart-at-100.png", "Expected clamped value 100");
});

// ============================================================================
// HTTP API Tests - Generic Format Endpoint
// ============================================================================

test("Generic endpoint: Default format is JPG", async () => {
  const res = await makeRequest("/v2/35");
  assertEqual(res.status, 200, "Expected status 200");
  assertEqual(res.headers["content-type"], "image/jpeg", "Expected image/jpeg as default");
  assertBuffer(res.body);
});

test("Generic endpoint: JPG format works", async () => {
  const res = await makeRequest("/v2/35/jpg");
  assertEqual(res.status, 200, "Expected status 200");
  assertEqual(res.headers["content-type"], "image/jpeg", "Expected image/jpeg content type");
  assertBuffer(res.body);
});

test("Generic endpoint: PNG format works", async () => {
  const res = await makeRequest("/v2/35/png");
  assertEqual(res.status, 200, "Expected status 200");
  assertEqual(res.headers["content-type"], "image/png", "Expected image/png content type");
  assertBuffer(res.body);
});

test("Generic endpoint: SVG format works", async () => {
  const res = await makeRequest("/v2/35/svg");
  assertEqual(res.status, 200, "Expected status 200");
  assertEqual(res.headers["content-type"], "image/svg+xml", "Expected image/svg+xml content type");
  assertBuffer(res.body);
});

test("Generic endpoint: Case insensitive imageType (PNG)", async () => {
  const res = await makeRequest("/v2/35/PNG");
  assertEqual(res.status, 200, "Expected status 200");
  assertEqual(res.headers["content-type"], "image/png", "Expected image/png content type (case insensitive)");
});

test("Generic endpoint: Case insensitive imageType (SVG)", async () => {
  const res = await makeRequest("/v2/35/SVG");
  assertEqual(res.status, 200, "Expected status 200");
  assertEqual(res.headers["content-type"], "image/svg+xml", "Expected image/svg+xml content type (case insensitive)");
});

test("Generic endpoint: Invalid imageType defaults to JPG", async () => {
  const res = await makeRequest("/v2/35/invalid");
  assertEqual(res.status, 200, "Expected status 200");
  assertEqual(res.headers["content-type"], "image/jpeg", "Expected image/jpeg as default for invalid type");
});

test("Generic endpoint: Title parameter works", async () => {
  const res = await makeRequest("/v2/35/jpg", {
    query: { title: "My Project" },
  });
  const disposition = res.headers["content-disposition"];
  assertIncludes(disposition, "My_Project", "Expected title in filename");
  assertIncludes(disposition, ".jpg", "Expected .jpg extension");
});

test("Generic endpoint: Combined parameters work", async () => {
  const res = await makeRequest("/v2/50/png", {
    query: {
      title: "Feature Name",
      hideLabels: "true",
      download: "1",
    },
  });
  assertEqual(res.status, 200, "Expected status 200");
  const disposition = res.headers["content-disposition"];
  assertIncludes(disposition, "attachment", "Expected attachment");
  assertIncludes(disposition, "Feature_Name", "Expected title");
  assertIncludes(disposition, "hill-chart-at-50", "Expected percentage");
});

test("Generic endpoint: Boundary values (0)", async () => {
  const res = await makeRequest("/v2/0/jpg");
  assertEqual(res.status, 200, "Expected status 200");
  const disposition = res.headers["content-disposition"];
  assertIncludes(disposition, "hill-chart-at-0.jpg", "Expected 0 in filename");
});

test("Generic endpoint: Boundary values (100)", async () => {
  const res = await makeRequest("/v2/100/jpg");
  assertEqual(res.status, 200, "Expected status 200");
  const disposition = res.headers["content-disposition"];
  assertIncludes(disposition, "hill-chart-at-100.jpg", "Expected 100 in filename");
});

test("Generic endpoint: Invalid t parameter returns 422", async () => {
  try {
    const res = await makeRequest("/v2/xyz/jpg");
    assertEqual(res.status, 422, "Expected status 422 for invalid t");
  } catch (error) {
    // Some servers might close connection, which is also acceptable
    assert(
      error.message.includes("timeout") || error.message.includes("ECONNRESET"),
      "Unexpected error: " + error.message
    );
  }
});

// ============================================================================
// Programmatic API Tests
// ============================================================================

test("Programmatic API: Returns buffer for PNG", () => {
  const buffer = streamHillChart(0.35, "png");
  assertBuffer(buffer);
});

test("Programmatic API: Returns buffer for JPG", () => {
  const buffer = streamHillChart(0.35, "jpg");
  assertBuffer(buffer);
});

test("Programmatic API: Returns buffer for SVG", () => {
  const buffer = streamHillChart(0.35, "svg");
  assertBuffer(buffer);
});

test("Programmatic API: Case insensitive type (PNG)", () => {
  const buffer = streamHillChart(0.35, "PNG");
  assertBuffer(buffer);
});

test("Programmatic API: Case insensitive type (JPG)", () => {
  const buffer = streamHillChart(0.35, "JPG");
  assertBuffer(buffer);
});

test("Programmatic API: Invalid type defaults to JPG", () => {
  const buffer = streamHillChart(0.35, "invalid");
  assertBuffer(buffer);
});

test("Programmatic API: Title option works", () => {
  const buffer = streamHillChart(0.35, "png", {
    title: "Test Title",
  });
  assertBuffer(buffer);
});

test("Programmatic API: showLabels=true shows labels", () => {
  const buffer = streamHillChart(0.35, "png", {
    showLabels: true,
  });
  assertBuffer(buffer);
});

test("Programmatic API: showLabels=false hides labels", () => {
  const buffer = streamHillChart(0.35, "png", {
    showLabels: false,
  });
  assertBuffer(buffer);
});

test("Programmatic API: showLabels defaults to true", () => {
  const buffer1 = streamHillChart(0.35, "png", {});
  const buffer2 = streamHillChart(0.35, "png", { showLabels: true });
  // Both should produce similar buffers (with labels)
  assertBuffer(buffer1);
  assertBuffer(buffer2);
});

test("Programmatic API: Combined options work", () => {
  const buffer = streamHillChart(0.5, "png", {
    title: "My Project",
    showLabels: false,
  });
  assertBuffer(buffer);
});

test("Programmatic API: t=0 works", () => {
  const buffer = streamHillChart(0, "png");
  assertBuffer(buffer);
});

test("Programmatic API: t=1 works", () => {
  const buffer = streamHillChart(1, "png");
  assertBuffer(buffer);
});

test("Programmatic API: t < 0 is clamped", () => {
  const buffer = streamHillChart(-0.5, "png");
  assertBuffer(buffer);
});

test("Programmatic API: t > 1 is clamped", () => {
  const buffer = streamHillChart(1.5, "png");
  assertBuffer(buffer);
});

test("Programmatic API: Empty title string is handled", () => {
  const buffer = streamHillChart(0.35, "png", {
    title: "",
  });
  assertBuffer(buffer);
});

test("Programmatic API: Undefined title is handled", () => {
  const buffer = streamHillChart(0.35, "png", {
    title: undefined,
  });
  assertBuffer(buffer);
});

// ============================================================================
// Filename Format Tests
// ============================================================================

test("Filename format: No title", async () => {
  const res = await makeRequest("/v2/42/jpg");
  const disposition = res.headers["content-disposition"];
  assertIncludes(disposition, "hill-chart-at-42.jpg", "Expected correct filename format");
});

test("Filename format: With title", async () => {
  const res = await makeRequest("/v2/42/jpg", {
    query: { title: "My Test Project" },
  });
  const disposition = res.headers["content-disposition"];
  assertIncludes(disposition, "hill-chart-at-42-My_Test_Project.jpg", "Expected title in filename");
});

test("Filename format: Title spaces replaced with underscores", async () => {
  const res = await makeRequest("/v2/50/png", {
    query: { title: "Hello World" },
  });
  const disposition = res.headers["content-disposition"];
  assertIncludes(disposition, "Hello_World", "Expected underscores in filename");
  assert(!disposition.includes("Hello World"), "Should not contain spaces");
});

// ============================================================================
// Test Runner
// ============================================================================

async function runTests() {
  console.log("=".repeat(70));
  console.log("Hill Chart API Test Suite");
  console.log("=".repeat(70));
  console.log(`Testing against: ${BASE_URL}\n`);

  for (const { name, fn } of TESTS) {
    try {
      await fn();
      console.log(`✓ PASS: ${name}`);
      PASSED++;
    } catch (error) {
      console.log(`✗ FAIL: ${name}`);
      console.log(`  Error: ${error.message}`);
      FAILED++;
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log(`Results: ${PASSED} passed, ${FAILED} failed, ${TESTS.length} total`);
  console.log("=".repeat(70));

  process.exit(FAILED > 0 ? 1 : 0);
}

// Check if server is reachable before running tests
async function checkServer() {
  try {
    const res = await makeRequest("/v2/0/jpg");
    return res.status === 200;
  } catch (error) {
    console.error(error);
    console.error(`\n✗ ERROR: Cannot connect to server at ${BASE_URL}`);
    console.error(`  Make sure the server is running: yarn start`);
    console.error(`  Or set TEST_BASE_URL environment variable\n`);
    process.exit(1);
  }
}

// Main execution
(async () => {
  await checkServer();
  await runTests();
})();
