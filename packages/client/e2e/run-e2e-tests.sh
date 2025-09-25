#!/bin/bash

# E2E Test Runner for API Client
# Usage: ./run-e2e-tests.sh [api-url]
# Example: ./run-e2e-tests.sh http://localhost:8080

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get API URL from argument or use default
API_URL=${1:-"http://localhost:8080"}

echo -e "${BLUE}🚀 Aztec Artifacts API Client - E2E Test Suite${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "API URL: ${YELLOW}${API_URL}${NC}\n"

# Function to run a test with nice formatting
run_test() {
    local test_name=$1
    local test_file=$2

    echo -e "${BLUE}▶️  Running: ${test_name}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    if API_URL="${API_URL}" pnpm tsx "${test_file}"; then
        echo -e "${GREEN}✅ ${test_name} - PASSED${NC}\n"
        return 0
    else
        echo -e "${RED}❌ ${test_name} - FAILED${NC}\n"
        return 1
    fi
}

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0

# Change to package directory
cd "$(dirname "$0")/.."

# Ensure dependencies are installed and built
echo -e "${YELLOW}📦 Ensuring dependencies are installed...${NC}"
pnpm install
echo -e "${YELLOW}🔨 Building package...${NC}"
pnpm build
echo ""

# Check if API is reachable
echo -e "${BLUE}🔍 Checking API connectivity...${NC}"
if curl -f -s "${API_URL}/health" > /dev/null; then
    echo -e "${GREEN}✅ API is reachable at ${API_URL}${NC}\n"
else
    echo -e "${RED}❌ Cannot reach API at ${API_URL}${NC}"
    echo -e "${YELLOW}💡 Make sure the API service is running:${NC}"
    echo -e "   cd packages/service && pnpm dev"
    echo -e "\n${YELLOW}Or specify a different URL:${NC}"
    echo -e "   ./run-e2e-tests.sh https://api.aztec-artifacts.org/v1"
    exit 1
fi

# Run individual test suites
echo -e "${BLUE}🧪 Running E2E Tests${NC}"
echo -e "${BLUE}================================================${NC}\n"

# Test 1: Contract Artifacts
if run_test "Contract Artifact Tests" "e2e/artifact-tests.ts"; then
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
fi

# Test 2: Contract Instances
if run_test "Contract Instance Tests" "e2e/instance-tests.ts"; then
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
fi

# Test 3: Full Workflow
if run_test "Full Workflow Tests" "e2e/full-workflow.ts"; then
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
fi

# Print summary
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}📊 Test Summary${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}✅ Passed: ${TESTS_PASSED}${NC}"
echo -e "${RED}❌ Failed: ${TESTS_FAILED}${NC}"

if [ ${TESTS_FAILED} -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All E2E tests passed successfully!${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed. Please check the output above.${NC}"
    exit 1
fi
