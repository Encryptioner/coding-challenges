#!/bin/bash
# Test script for OCR tool

set -e  # Exit on error

echo "========================================"
echo "OCR Tool Test Suite"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: python3 not found${NC}"
    exit 1
fi

# Check if Tesseract is installed
if ! command -v tesseract &> /dev/null; then
    echo -e "${RED}Error: Tesseract OCR not installed${NC}"
    echo "Please install Tesseract:"
    echo "  macOS: brew install tesseract"
    echo "  Ubuntu/Debian: sudo apt-get install tesseract-ocr"
    exit 1
fi

echo -e "${GREEN}✓ Python3 found: $(python3 --version)${NC}"
echo -e "${GREEN}✓ Tesseract found: $(tesseract --version | head -n1)${NC}"
echo ""

# Check if dependencies are installed
echo "Checking Python dependencies..."
python3 -c "import cv2, pytesseract, PIL, numpy" 2>/dev/null || {
    echo -e "${RED}Error: Missing Python dependencies${NC}"
    echo "Please install: pip install -r requirements.txt"
    exit 1
}
echo -e "${GREEN}✓ All Python dependencies installed${NC}"
echo ""

# Create test directory
TEST_DIR="test_images"
mkdir -p "$TEST_DIR"

# Generate test images
echo "Generating test images..."
python3 << 'EOF'
from PIL import Image, ImageDraw, ImageFont
import os

test_dir = "test_images"

# Test 1: Simple text
img1 = Image.new('RGB', (400, 100), color='white')
d1 = ImageDraw.Draw(img1)
d1.text((10, 30), "Hello World", fill='black')
img1.save(f"{test_dir}/test1_simple.png")

# Test 2: Multiple lines
img2 = Image.new('RGB', (500, 150), color='white')
d2 = ImageDraw.Draw(img2)
d2.text((10, 10), "Line 1: First line of text", fill='black')
d2.text((10, 50), "Line 2: Second line of text", fill='black')
d2.text((10, 90), "Line 3: Third line of text", fill='black')
img2.save(f"{test_dir}/test2_multiline.png")

# Test 3: Different colors
img3 = Image.new('RGB', (400, 100), color='lightblue')
d3 = ImageDraw.Draw(img3)
d3.text((10, 30), "Colored Background", fill='darkblue')
img3.save(f"{test_dir}/test3_colored.png")

# Test 4: Numbers and symbols
img4 = Image.new('RGB', (500, 100), color='white')
d4 = ImageDraw.Draw(img4)
d4.text((10, 30), "Test 123 @ #$% & *()", fill='black')
img4.save(f"{test_dir}/test4_symbols.png")

# Test 5: Empty image (no text)
img5 = Image.new('RGB', (400, 100), color='white')
img5.save(f"{test_dir}/test5_empty.png")

print("Generated 5 test images")
EOF

echo -e "${GREEN}✓ Test images created in $TEST_DIR/${NC}"
echo ""

# Run tests
PASSED=0
FAILED=0

run_test() {
    local test_name=$1
    local command=$2
    local expected_exit=$3

    echo -n "Testing $test_name... "

    if eval "$command" > /dev/null 2>&1; then
        actual_exit=0
    else
        actual_exit=$?
    fi

    if [ "$actual_exit" -eq "$expected_exit" ]; then
        echo -e "${GREEN}PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}FAIL${NC} (exit code: $actual_exit, expected: $expected_exit)"
        ((FAILED++))
    fi
}

echo "Running OCR tests..."
echo "----------------------------------------"

# Test 1: Help command
run_test "Help command" "./ocr.py --help" 0

# Test 2: Detect text in simple image
run_test "Detect text (simple)" "./ocr.py detect $TEST_DIR/test1_simple.png" 0

# Test 3: Detect no text in empty image
run_test "Detect no text (empty)" "./ocr.py detect $TEST_DIR/test5_empty.png" 1

# Test 4: Find bounds in simple image
run_test "Find bounds (simple)" "./ocr.py bounds $TEST_DIR/test1_simple.png" 0

# Test 5: Find bounds with output
run_test "Find bounds with output" "./ocr.py bounds $TEST_DIR/test1_simple.png -o $TEST_DIR/annotated.png" 0

# Test 6: Extract text from simple image
run_test "Extract text (simple)" "./ocr.py extract $TEST_DIR/test1_simple.png" 0

# Test 7: Extract text from multiline
run_test "Extract text (multiline)" "./ocr.py extract $TEST_DIR/test2_multiline.png" 0

# Test 8: Extract with output file
run_test "Extract with output file" "./ocr.py extract $TEST_DIR/test1_simple.png -o $TEST_DIR/output.txt" 0

# Test 9: Process with text format
run_test "Process (text format)" "./ocr.py process $TEST_DIR/test1_simple.png" 0

# Test 10: Process with JSON format
run_test "Process (JSON format)" "./ocr.py process $TEST_DIR/test1_simple.png --format json" 0

# Test 11: Process with detailed JSON
run_test "Process (detailed JSON)" "./ocr.py process $TEST_DIR/test1_simple.png --format json --detailed" 0

# Test 12: Process with output file
run_test "Process with output" "./ocr.py process $TEST_DIR/test1_simple.png --format json -o $TEST_DIR/result.json" 0

# Test 13: Verbose mode
run_test "Verbose mode" "./ocr.py -v detect $TEST_DIR/test1_simple.png" 0

echo "----------------------------------------"
echo ""

# Summary
echo "========================================"
echo "Test Summary"
echo "========================================"
echo -e "Total tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED${NC}"
else
    echo -e "Failed: $FAILED"
fi
echo ""

# Show sample outputs
echo "Sample Outputs:"
echo "----------------------------------------"

echo ""
echo "1. Text Detection:"
./ocr.py detect "$TEST_DIR/test1_simple.png"

echo ""
echo "2. Character Bounds:"
./ocr.py bounds "$TEST_DIR/test1_simple.png" | head -n 1

echo ""
echo "3. Text Extraction:"
./ocr.py extract "$TEST_DIR/test1_simple.png" 2>/dev/null | head -n 5

echo ""
echo "4. Full Processing:"
./ocr.py process "$TEST_DIR/test1_simple.png" 2>/dev/null | head -n 6

echo ""
echo "========================================"

# Clean up option
echo ""
read -p "Clean up test files? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$TEST_DIR"
    echo "Test files cleaned up"
fi

# Exit with appropriate code
if [ $FAILED -gt 0 ]; then
    exit 1
else
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
fi
