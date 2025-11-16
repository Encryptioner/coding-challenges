# OCR Tool - Practical Examples and Use Cases

This document provides practical examples and real-world use cases for the OCR tool, demonstrating how to use it effectively for various scenarios.

## Table of Contents

1. [Basic Examples](#basic-examples)
2. [Document Processing](#document-processing)
3. [Screenshot Text Extraction](#screenshot-text-extraction)
4. [Multi-Language Documents](#multi-language-documents)
5. [Batch Processing](#batch-processing)
6. [Quality Assurance](#quality-assurance)
7. [Integration Examples](#integration-examples)
8. [Advanced Use Cases](#advanced-use-cases)
9. [Troubleshooting Examples](#troubleshooting-examples)
10. [Performance Optimization](#performance-optimization)

## Basic Examples

### Example 1: Quick Text Extraction

**Scenario:** You have a screenshot of text and want to quickly extract it.

```bash
# Extract text from screenshot
./ocr.py extract screenshot.png

# Output:
# Extracted text:
# ----------------------------------------
# Hello World
# This is a test image
# with multiple lines of text
# ----------------------------------------
```

**Use Case:** Extracting text from screenshots for documentation, copy-pasting code snippets, or saving important information.

### Example 2: Verify Text Presence

**Scenario:** Check if an image contains any text before processing.

```bash
# Check for text
./ocr.py detect photo.png

# Output if text found:
# Text detected: Yes
# Confidence: 85.0%

# Output if no text:
# Text detected: No
# Confidence: 0.0%
```

**Use Case:** Pre-filtering images before expensive OCR processing, automated image classification.

### Example 3: Visual Verification

**Scenario:** Verify that text detection is working correctly before extraction.

```bash
# Generate annotated image with bounding boxes
./ocr.py bounds document.png --output verification.png

# Review verification.png visually
# Then proceed with extraction if detection looks good
./ocr.py extract document.png
```

**Use Case:** Quality assurance, debugging detection issues, verifying preprocessing effectiveness.

## Document Processing

### Example 4: Invoice Text Extraction

**Scenario:** Extract text from scanned invoices for accounting software.

```bash
# Extract with detailed metadata
./ocr.py process invoice_scan.png --format json --detailed -o invoice.json

# Output (invoice.json):
{
  "text": "INVOICE\nInvoice #: 12345\nDate: 2024-01-15\nAmount: $500.00",
  "confidence": 0.92,
  "lines": [
    {
      "text": "INVOICE",
      "confidence": 0.98,
      "words": [...]
    },
    {
      "text": "Invoice #: 12345",
      "confidence": 0.95,
      "words": [...]
    }
  ]
}
```

**Processing the Result:**

```python
import json

# Load OCR results
with open('invoice.json', 'r') as f:
    data = json.load(f)

# Extract invoice number
for line in data['lines']:
    if 'Invoice #' in line['text']:
        invoice_num = line['text'].split(':')[1].strip()
        print(f"Invoice Number: {invoice_num}")

# Extract amount
for line in data['lines']:
    if '$' in line['text']:
        amount = line['text'].split('$')[1].strip()
        print(f"Amount: ${amount}")
```

**Output:**
```
Invoice Number: 12345
Amount: $500.00
```

### Example 5: Receipt Digitization

**Scenario:** Convert receipt photos to searchable text.

```bash
# Process receipt
./ocr.py process receipt.jpg --format json -o receipt.json

# Extract with high verbosity for debugging
./ocr.py -v process receipt.jpg --detailed
```

**Python Post-Processing:**

```python
import json
import re
from datetime import datetime

def extract_receipt_data(json_file):
    with open(json_file, 'r') as f:
        data = json.load(f)

    text = data['text']

    # Extract date (various formats)
    date_patterns = [
        r'\d{2}/\d{2}/\d{4}',
        r'\d{4}-\d{2}-\d{2}',
        r'\w+ \d{1,2}, \d{4}'
    ]

    date = None
    for pattern in date_patterns:
        match = re.search(pattern, text)
        if match:
            date = match.group()
            break

    # Extract total amount
    total_patterns = [
        r'Total:?\s*\$?(\d+\.\d{2})',
        r'Amount:?\s*\$?(\d+\.\d{2})',
        r'TOTAL:?\s*\$?(\d+\.\d{2})'
    ]

    total = None
    for pattern in total_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            total = float(match.group(1))
            break

    # Extract merchant name (usually first line)
    lines = data['lines']
    merchant = lines[0]['text'] if lines else None

    return {
        'merchant': merchant,
        'date': date,
        'total': total,
        'confidence': data['confidence']
    }

# Use it
receipt_data = extract_receipt_data('receipt.json')
print(f"Merchant: {receipt_data['merchant']}")
print(f"Date: {receipt_data['date']}")
print(f"Total: ${receipt_data['total']}")
print(f"OCR Confidence: {receipt_data['confidence']*100:.1f}%")
```

### Example 6: Book Page Digitization

**Scenario:** Digitize book pages for ebook creation.

```bash
# Process book page with high quality
./ocr.py process page_001.png --output page_001.txt

# For entire book
for i in {001..250}; do
    ./ocr.py process "page_$i.png" -o "page_$i.txt"
    echo "Processed page $i"
done

# Combine all pages
cat page_*.txt > full_book.txt
```

**Preserving Structure:**

```bash
# Use JSON to preserve line structure
./ocr.py process page_001.png --format json --detailed -o page_001.json
```

**Python Processing:**

```python
import json

def format_book_page(json_file):
    with open(json_file, 'r') as f:
        data = json.load(f)

    # Format with proper paragraph breaks
    formatted_text = ""
    current_paragraph = []

    for i, line in enumerate(data['lines']):
        text = line['text'].strip()

        # Detect paragraph breaks (empty lines or large gaps)
        if not text:
            if current_paragraph:
                formatted_text += ' '.join(current_paragraph) + '\n\n'
                current_paragraph = []
        else:
            current_paragraph.append(text)

    # Add last paragraph
    if current_paragraph:
        formatted_text += ' '.join(current_paragraph) + '\n\n'

    return formatted_text

# Process all pages
full_text = ""
for i in range(1, 251):
    page_json = f"page_{i:03d}.json"
    full_text += format_book_page(page_json)

with open('formatted_book.txt', 'w') as f:
    f.write(full_text)
```

## Screenshot Text Extraction

### Example 7: Code Snippet Extraction

**Scenario:** Extract code from a programming tutorial screenshot.

```bash
# Extract code
./ocr.py extract code_screenshot.png --output code.txt

# Review and fix any OCR errors
cat code.txt
```

**Common OCR Errors in Code:**
- `0` (zero) confused with `O` (letter O)
- `1` (one) confused with `l` (lowercase L) or `I` (uppercase i)
- Semicolons `;` confused with colons `:`

**Bash Script to Save Multiple Snippets:**

```bash
#!/bin/bash
# Save code snippets from screenshots

snippet_dir="code_snippets"
mkdir -p "$snippet_dir"

for img in screenshots/code_*.png; do
    basename=$(basename "$img" .png)
    ./ocr.py extract "$img" -o "$snippet_dir/${basename}.txt"
    echo "Extracted: $basename"
done

echo "All code snippets extracted to $snippet_dir/"
```

### Example 8: Terminal Output Capture

**Scenario:** Extract text from terminal screenshots for documentation.

```bash
# Extract terminal output
./ocr.py extract terminal_screenshot.png -o terminal_output.txt

# Add markdown code block formatting
echo '```bash' > formatted_output.md
cat terminal_output.txt >> formatted_output.md
echo '```' >> formatted_output.md
```

**Automated Documentation Builder:**

```python
#!/usr/bin/env python3
import subprocess
import sys

def screenshot_to_markdown(image_path, output_md):
    """Convert terminal screenshot to markdown code block."""

    # Extract text
    result = subprocess.run(
        ['./ocr.py', 'extract', image_path],
        capture_output=True,
        text=True
    )

    # Get text between delimiters
    lines = result.stdout.split('\n')
    start = lines.index('----------------------------------------') + 1
    end = len(lines) - lines[::-1].index('----------------------------------------') - 1
    text = '\n'.join(lines[start:end])

    # Write markdown
    with open(output_md, 'w') as f:
        f.write('```bash\n')
        f.write(text)
        f.write('\n```\n')

    print(f"Created {output_md}")

# Usage
screenshot_to_markdown('terminal_screenshot.png', 'output.md')
```

### Example 9: Error Message Documentation

**Scenario:** Document error messages from screenshots for troubleshooting guide.

```bash
# Extract error message
./ocr.py process error_screenshot.png --format json -o error.json
```

**Create Troubleshooting Entry:**

```python
import json

def create_troubleshooting_entry(json_file):
    with open(json_file, 'r') as f:
        data = json.load(f)

    text = data['text']

    # Extract error code/type
    error_lines = [line for line in text.split('\n') if 'error' in line.lower()]

    entry = f"""
## Error: {error_lines[0] if error_lines else 'Unknown Error'}

**Full Message:**
```
{text}
```

**Confidence:** {data['confidence']*100:.1f}%

**Solution:**
[Add solution here]
"""

    return entry

# Use it
entry = create_troubleshooting_entry('error.json')
print(entry)
```

## Multi-Language Documents

### Example 10: French Document

**Scenario:** Extract text from French documents.

```bash
# Install French language data if needed
# sudo apt-get install tesseract-ocr-fra  # Ubuntu
# brew install tesseract-lang  # macOS

# Check available languages
tesseract --list-langs

# Extract French text
./ocr.py extract french_doc.png --lang fra --output french_text.txt
```

**Output Example:**
```
Extracted text:
----------------------------------------
Bonjour le monde
Ceci est un document en français
avec plusieurs lignes de texte
----------------------------------------
```

### Example 11: Mixed Language Document

**Scenario:** Document contains both English and Chinese.

```bash
# Use multiple languages (eng+chi_sim)
./ocr.py extract mixed_doc.png --lang eng+chi_sim
```

### Example 12: Language Auto-Detection

**Scenario:** Try multiple languages and use best result.

```bash
#!/bin/bash
# Try multiple languages and pick best confidence

image="document.png"
languages=("eng" "fra" "deu" "spa")
best_conf=0
best_lang=""
best_file=""

for lang in "${languages[@]}"; do
    output="temp_${lang}.json"
    ./ocr.py process "$image" --lang "$lang" --format json -o "$output"

    # Extract confidence
    conf=$(python3 -c "import json; print(json.load(open('$output'))['confidence'])")

    echo "Language: $lang, Confidence: $conf"

    # Track best
    if (( $(echo "$conf > $best_conf" | bc -l) )); then
        best_conf=$conf
        best_lang=$lang
        best_file=$output
    fi
done

echo ""
echo "Best language: $best_lang (confidence: $best_conf)"
cp "$best_file" "final_result.json"

# Cleanup
rm temp_*.json
```

## Batch Processing

### Example 13: Process Directory of Images

**Scenario:** Process all images in a directory.

```bash
#!/bin/bash
# Batch process all images in a directory

input_dir="scanned_docs"
output_dir="extracted_text"
mkdir -p "$output_dir"

# Process each image
for img in "$input_dir"/*.{png,jpg,jpeg,PNG,JPG,JPEG}; do
    # Skip if no files match
    [ -f "$img" ] || continue

    # Get basename without extension
    basename=$(basename "$img")
    filename="${basename%.*}"

    echo "Processing: $basename"

    # Extract text
    ./ocr.py extract "$img" -o "$output_dir/${filename}.txt"

    # Also save JSON for metadata
    ./ocr.py process "$img" --format json -o "$output_dir/${filename}.json"
done

echo "Batch processing complete!"
echo "Text files: $output_dir/*.txt"
echo "Metadata: $output_dir/*.json"
```

### Example 14: Parallel Batch Processing

**Scenario:** Process many images faster using parallel processing.

```bash
#!/bin/bash
# Parallel batch processing using GNU parallel

input_dir="scanned_docs"
output_dir="extracted_text"
mkdir -p "$output_dir"

# Function to process single image
process_image() {
    img="$1"
    output_dir="$2"

    basename=$(basename "$img")
    filename="${basename%.*}"

    ./ocr.py extract "$img" -o "$output_dir/${filename}.txt"

    echo "Processed: $basename"
}

export -f process_image

# Process in parallel (8 jobs at a time)
find "$input_dir" -type f \( -name "*.png" -o -name "*.jpg" \) | \
    parallel -j 8 process_image {} "$output_dir"

echo "Parallel processing complete!"
```

**Python Alternative:**

```python
#!/usr/bin/env python3
import subprocess
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor, as_completed

def process_image(image_path, output_dir):
    """Process a single image."""
    output_file = output_dir / f"{image_path.stem}.txt"

    result = subprocess.run(
        ['./ocr.py', 'extract', str(image_path), '-o', str(output_file)],
        capture_output=True,
        text=True
    )

    return image_path.name, result.returncode == 0

def batch_process_parallel(input_dir, output_dir, max_workers=8):
    """Process all images in directory in parallel."""
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)

    # Find all images
    images = list(input_path.glob('*.png')) + list(input_path.glob('*.jpg'))

    print(f"Processing {len(images)} images with {max_workers} workers...")

    # Process in parallel
    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(process_image, img, output_path): img
            for img in images
        }

        for future in as_completed(futures):
            img = futures[future]
            try:
                name, success = future.result()
                status = "✓" if success else "✗"
                print(f"{status} {name}")
            except Exception as e:
                print(f"✗ {img.name}: {e}")

    print("Batch processing complete!")

if __name__ == '__main__':
    batch_process_parallel('scanned_docs', 'extracted_text', max_workers=8)
```

### Example 15: Batch Processing with Quality Filter

**Scenario:** Only save results with high confidence.

```bash
#!/bin/bash
# Process images but only save high-confidence results

input_dir="images"
output_dir="high_quality_text"
min_confidence=0.85

mkdir -p "$output_dir"

for img in "$input_dir"/*.png; do
    [ -f "$img" ] || continue

    basename=$(basename "$img")
    filename="${basename%.*}"

    # Get result with confidence
    temp_json="/tmp/${filename}.json"
    ./ocr.py process "$img" --format json -o "$temp_json"

    # Extract confidence
    confidence=$(python3 -c "import json; print(json.load(open('$temp_json'))['confidence'])")

    # Check threshold
    if (( $(echo "$confidence >= $min_confidence" | bc -l) )); then
        echo "✓ $basename (confidence: $confidence)"

        # Save text
        python3 -c "import json; print(json.load(open('$temp_json'))['text'])" \
            > "$output_dir/${filename}.txt"
    else
        echo "✗ $basename (confidence: $confidence) - SKIPPED"
    fi

    rm "$temp_json"
done
```

## Quality Assurance

### Example 16: Confidence Monitoring

**Scenario:** Monitor OCR quality across a batch.

```python
#!/usr/bin/env python3
import json
import subprocess
from pathlib import Path
import statistics

def analyze_batch_quality(image_dir, output_csv):
    """Analyze OCR confidence for all images."""

    images = list(Path(image_dir).glob('*.png'))
    results = []

    for img in images:
        # Process image
        result = subprocess.run(
            ['./ocr.py', 'process', str(img), '--format', 'json'],
            capture_output=True,
            text=True
        )

        try:
            data = json.loads(result.stdout)
            results.append({
                'image': img.name,
                'confidence': data['confidence'],
                'words': data['words'],
                'lines': data['lines']
            })
        except json.JSONDecodeError:
            results.append({
                'image': img.name,
                'confidence': 0.0,
                'words': 0,
                'lines': 0
            })

    # Calculate statistics
    confidences = [r['confidence'] for r in results]

    print("Quality Analysis")
    print("=" * 50)
    print(f"Images processed: {len(results)}")
    print(f"Average confidence: {statistics.mean(confidences):.3f}")
    print(f"Median confidence: {statistics.median(confidences):.3f}")
    print(f"Min confidence: {min(confidences):.3f}")
    print(f"Max confidence: {max(confidences):.3f}")
    print(f"Std deviation: {statistics.stdev(confidences):.3f}")

    # Low quality images
    low_quality = [r for r in results if r['confidence'] < 0.7]
    if low_quality:
        print(f"\nLow quality images ({len(low_quality)}):")
        for r in low_quality:
            print(f"  - {r['image']}: {r['confidence']:.3f}")

    # Save CSV
    with open(output_csv, 'w') as f:
        f.write("image,confidence,words,lines\n")
        for r in results:
            f.write(f"{r['image']},{r['confidence']},{r['words']},{r['lines']}\n")

    print(f"\nDetailed results saved to: {output_csv}")

if __name__ == '__main__':
    analyze_batch_quality('scanned_docs', 'quality_report.csv')
```

### Example 17: Visual Quality Check

**Scenario:** Generate visual verification for all processed images.

```bash
#!/bin/bash
# Generate annotated images for visual verification

input_dir="documents"
output_dir="verification"
mkdir -p "$output_dir"

for img in "$input_dir"/*.png; do
    [ -f "$img" ] || continue

    basename=$(basename "$img")

    # Generate annotated image
    ./ocr.py bounds "$img" -o "$output_dir/annotated_${basename}"

    echo "Created verification for: $basename"
done

echo "Review annotated images in: $output_dir/"
```

### Example 18: Comparison with Ground Truth

**Scenario:** Compare OCR results with known correct text.

```python
#!/usr/bin/env python3
import subprocess
from pathlib import Path
from difflib import SequenceMatcher

def similarity(a, b):
    """Calculate similarity ratio between two strings."""
    return SequenceMatcher(None, a, b).ratio()

def compare_with_ground_truth(image_path, ground_truth_path):
    """Compare OCR result with ground truth."""

    # Run OCR
    result = subprocess.run(
        ['./ocr.py', 'extract', image_path],
        capture_output=True,
        text=True
    )

    # Extract OCR text
    lines = result.stdout.split('\n')
    start = lines.index('----------------------------------------') + 1
    end = len(lines) - lines[::-1].index('----------------------------------------') - 1
    ocr_text = '\n'.join(lines[start:end]).strip()

    # Load ground truth
    with open(ground_truth_path, 'r') as f:
        truth = f.read().strip()

    # Calculate accuracy
    sim = similarity(ocr_text, truth)

    print(f"Image: {image_path}")
    print(f"Accuracy: {sim*100:.2f}%")
    print(f"\nGround Truth ({len(truth)} chars):")
    print(truth[:100] + "..." if len(truth) > 100 else truth)
    print(f"\nOCR Result ({len(ocr_text)} chars):")
    print(ocr_text[:100] + "..." if len(ocr_text) > 100 else ocr_text)

    if sim < 0.9:
        print("\n⚠️  Low accuracy - consider:")
        print("  - Image preprocessing")
        print("  - Higher resolution")
        print("  - Different OCR settings")

    return sim

# Test
accuracy = compare_with_ground_truth(
    'test_images/sample.png',
    'ground_truth/sample.txt'
)
```

## Integration Examples

### Example 19: Email Attachment Processing

**Scenario:** Extract text from email attachments automatically.

```python
#!/usr/bin/env python3
import imaplib
import email
from email.header import decode_header
import subprocess
from pathlib import Path

def process_email_attachments(imap_server, username, password):
    """Connect to email and process image attachments."""

    # Connect to IMAP
    mail = imaplib.IMAP4_SSL(imap_server)
    mail.login(username, password)
    mail.select('inbox')

    # Search for unread emails
    status, messages = mail.search(None, 'UNSEEN')

    for msg_num in messages[0].split():
        # Fetch email
        status, data = mail.fetch(msg_num, '(RFC822)')
        msg = email.message_from_bytes(data[0][1])

        # Process attachments
        for part in msg.walk():
            if part.get_content_type().startswith('image/'):
                filename = part.get_filename()

                # Save attachment
                filepath = Path('/tmp') / filename
                with open(filepath, 'wb') as f:
                    f.write(part.get_payload(decode=True))

                # Run OCR
                result = subprocess.run(
                    ['./ocr.py', 'extract', str(filepath)],
                    capture_output=True,
                    text=True
                )

                print(f"Processed: {filename}")
                print(result.stdout)

                # Clean up
                filepath.unlink()

    mail.close()
    mail.logout()

# Usage (requires email credentials)
# process_email_attachments('imap.gmail.com', 'user@gmail.com', 'password')
```

### Example 20: Web API Integration

**Scenario:** Create a web API for OCR service.

```python
#!/usr/bin/env python3
from flask import Flask, request, jsonify
import subprocess
import tempfile
from pathlib import Path

app = Flask(__name__)

@app.route('/ocr', methods=['POST'])
def ocr_endpoint():
    """OCR API endpoint."""

    # Check file upload
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    file = request.files['image']

    # Get parameters
    lang = request.form.get('lang', 'eng')
    detailed = request.form.get('detailed', 'false').lower() == 'true'

    # Save to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    try:
        # Run OCR
        cmd = ['./ocr.py', 'process', tmp_path, '--format', 'json', '--lang', lang]
        if detailed:
            cmd.append('--detailed')

        result = subprocess.run(cmd, capture_output=True, text=True)

        # Parse result
        import json
        data = json.loads(result.stdout)

        return jsonify(data)

    finally:
        # Clean up
        Path(tmp_path).unlink()

@app.route('/detect', methods=['POST'])
def detect_endpoint():
    """Text detection endpoint."""

    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    file = request.files['image']

    with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    try:
        result = subprocess.run(
            ['./ocr.py', 'detect', tmp_path],
            capture_output=True,
            text=True
        )

        # Parse output
        lines = result.stdout.strip().split('\n')
        has_text = 'Yes' in lines[0]
        confidence = float(lines[1].split(':')[1].strip().rstrip('%')) / 100

        return jsonify({
            'has_text': has_text,
            'confidence': confidence
        })

    finally:
        Path(tmp_path).unlink()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

**Usage:**

```bash
# Start server
python3 api.py

# Use API (from another terminal)
curl -X POST -F "image=@document.png" http://localhost:5000/ocr

curl -X POST -F "image=@photo.png" http://localhost:5000/detect
```

### Example 21: Database Integration

**Scenario:** Store OCR results in a database.

```python
#!/usr/bin/env python3
import sqlite3
import subprocess
import json
from pathlib import Path
from datetime import datetime

def init_database(db_path='ocr_results.db'):
    """Initialize SQLite database."""
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    c.execute('''
        CREATE TABLE IF NOT EXISTS ocr_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            text TEXT,
            confidence REAL,
            word_count INTEGER,
            line_count INTEGER,
            language TEXT,
            processed_at TIMESTAMP,
            metadata TEXT
        )
    ''')

    conn.commit()
    return conn

def process_and_store(image_path, conn, lang='eng'):
    """Process image and store result in database."""

    # Run OCR
    result = subprocess.run(
        ['./ocr.py', 'process', image_path, '--format', 'json', '--detailed', '--lang', lang],
        capture_output=True,
        text=True
    )

    data = json.loads(result.stdout)

    # Insert into database
    c = conn.cursor()
    c.execute('''
        INSERT INTO ocr_results
        (filename, text, confidence, word_count, line_count, language, processed_at, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        Path(image_path).name,
        data['text'],
        data['confidence'],
        data['words'],
        data['lines'],
        lang,
        datetime.now(),
        json.dumps(data)
    ))

    conn.commit()

    print(f"Stored: {Path(image_path).name} (ID: {c.lastrowid})")

    return c.lastrowid

def search_text(conn, query):
    """Search for text in OCR results."""
    c = conn.cursor()
    c.execute('''
        SELECT id, filename, text, confidence, processed_at
        FROM ocr_results
        WHERE text LIKE ?
    ''', (f'%{query}%',))

    results = c.fetchall()

    print(f"\nFound {len(results)} results for '{query}':")
    for row in results:
        print(f"\nID: {row[0]}")
        print(f"File: {row[1]}")
        print(f"Confidence: {row[3]:.3f}")
        print(f"Date: {row[4]}")
        print(f"Preview: {row[2][:100]}...")

    return results

# Usage
if __name__ == '__main__':
    conn = init_database()

    # Process images
    for img in Path('scanned_docs').glob('*.png'):
        process_and_store(str(img), conn)

    # Search
    search_text(conn, 'invoice')

    conn.close()
```

## Advanced Use Cases

### Example 22: Real-time Webcam OCR

**Scenario:** Capture from webcam and perform real-time OCR.

```python
#!/usr/bin/env python3
import cv2
import subprocess
import tempfile
from pathlib import Path
import time

def webcam_ocr(confidence_threshold=0.8):
    """Capture from webcam and perform OCR."""

    cap = cv2.VideoCapture(0)

    print("Press SPACE to capture and OCR")
    print("Press Q to quit")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Display frame
        cv2.imshow('Webcam OCR (SPACE=capture, Q=quit)', frame)

        key = cv2.waitKey(1) & 0xFF

        if key == ord(' '):  # Space key
            # Save frame
            with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as tmp:
                tmp_path = tmp.name
                cv2.imwrite(tmp_path, frame)

            # Run OCR
            result = subprocess.run(
                ['./ocr.py', 'process', tmp_path, '--format', 'json'],
                capture_output=True,
                text=True
            )

            try:
                import json
                data = json.loads(result.stdout)

                if data['confidence'] >= confidence_threshold:
                    print("\n" + "="*50)
                    print(f"Confidence: {data['confidence']:.3f}")
                    print(data['text'])
                    print("="*50 + "\n")
                else:
                    print(f"Low confidence: {data['confidence']:.3f} - try again")

            except json.JSONDecodeError:
                print("OCR failed")

            # Clean up
            Path(tmp_path).unlink()

        elif key == ord('q'):  # Q key
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == '__main__':
    webcam_ocr()
```

### Example 23: PDF Multi-Page OCR

**Scenario:** Extract text from multi-page PDF documents.

```python
#!/usr/bin/env python3
from pdf2image import convert_from_path
import subprocess
import json
from pathlib import Path

def ocr_pdf(pdf_path, output_dir='pdf_text'):
    """Extract text from PDF pages."""

    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)

    # Convert PDF to images
    print(f"Converting PDF: {pdf_path}")
    images = convert_from_path(pdf_path, dpi=300)

    print(f"Processing {len(images)} pages...")

    results = []

    for i, image in enumerate(images, 1):
        print(f"  Page {i}/{len(images)}...", end=' ')

        # Save page image
        img_path = f'/tmp/page_{i}.png'
        image.save(img_path, 'PNG')

        # Run OCR
        result = subprocess.run(
            ['./ocr.py', 'process', img_path, '--format', 'json', '--detailed'],
            capture_output=True,
            text=True
        )

        data = json.loads(result.stdout)

        # Save page text
        text_file = output_path / f'page_{i:03d}.txt'
        text_file.write_text(data['text'])

        results.append({
            'page': i,
            'text': data['text'],
            'confidence': data['confidence'],
            'words': data['words'],
            'lines': data['lines']
        })

        print(f"✓ (confidence: {data['confidence']:.3f})")

    # Save combined text
    combined_text = '\n\n--- Page Break ---\n\n'.join([r['text'] for r in results])
    (output_path / 'full_document.txt').write_text(combined_text)

    # Save metadata
    with open(output_path / 'metadata.json', 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\nProcessing complete!")
    print(f"Text files: {output_dir}/page_*.txt")
    print(f"Full document: {output_dir}/full_document.txt")
    print(f"Metadata: {output_dir}/metadata.json")

    # Statistics
    avg_conf = sum(r['confidence'] for r in results) / len(results)
    total_words = sum(r['words'] for r in results)

    print(f"\nStatistics:")
    print(f"  Pages: {len(results)}")
    print(f"  Average confidence: {avg_conf:.3f}")
    print(f"  Total words: {total_words}")

    return results

# Usage
if __name__ == '__main__':
    import sys
    if len(sys.argv) < 2:
        print("Usage: python3 pdf_ocr.py document.pdf")
        sys.exit(1)

    ocr_pdf(sys.argv[1])
```

## Troubleshooting Examples

### Example 24: Handling Low Quality Images

**Scenario:** Image has poor quality, needs preprocessing.

```python
#!/usr/bin/env python3
import cv2
import numpy as np
import subprocess

def preprocess_image(image_path, output_path):
    """Preprocess image to improve OCR quality."""

    # Load image
    img = cv2.imread(image_path)

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Denoise
    denoised = cv2.fastNlMeansDenoising(gray, h=10)

    # Increase contrast (CLAHE)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    contrasted = clahe.apply(denoised)

    # Sharpen
    kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
    sharpened = cv2.filter2D(contrasted, -1, kernel)

    # Binarization
    _, binary = cv2.threshold(sharpened, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Save preprocessed image
    cv2.imwrite(output_path, binary)

    print(f"Preprocessed image saved to: {output_path}")

def compare_results(original, preprocessed):
    """Compare OCR results on original vs preprocessed."""

    import json

    # Process original
    result1 = subprocess.run(
        ['./ocr.py', 'process', original, '--format', 'json'],
        capture_output=True, text=True
    )
    data1 = json.loads(result1.stdout)

    # Process preprocessed
    result2 = subprocess.run(
        ['./ocr.py', 'process', preprocessed, '--format', 'json'],
        capture_output=True, text=True
    )
    data2 = json.loads(result2.stdout)

    print("\nComparison:")
    print(f"Original confidence: {data1['confidence']:.3f}")
    print(f"Preprocessed confidence: {data2['confidence']:.3f}")
    print(f"Improvement: {(data2['confidence'] - data1['confidence']):.3f}")

    if data2['confidence'] > data1['confidence']:
        print("\n✓ Preprocessing improved results!")
    else:
        print("\n✗ Preprocessing did not help")

# Usage
preprocess_image('low_quality.png', 'preprocessed.png')
compare_results('low_quality.png', 'preprocessed.png')
```

### Example 25: Debugging Detection Issues

**Scenario:** Text not being detected, need to debug.

```bash
#!/bin/bash
# Debug detection pipeline

image="problem_image.png"

echo "Debugging OCR detection for: $image"
echo "========================================="

# Step 1: Check if text is detected
echo "1. Text Detection:"
./ocr.py -v detect "$image"
echo ""

# Step 2: Visualize character bounds
echo "2. Character Boundaries:"
./ocr.py -v bounds "$image" -o "debug_bounds.png" --list
echo "Review: debug_bounds.png"
echo ""

# Step 3: Try extraction
echo "3. Text Extraction:"
./ocr.py -v extract "$image"
echo ""

# Step 4: Full processing
echo "4. Full Processing:"
./ocr.py -v process "$image" --format json --detailed
echo ""

echo "Debug complete!"
echo "Check debug_bounds.png to see what was detected"
```

## Performance Optimization

### Example 26: Fast Batch Processing

**Scenario:** Optimize for speed when processing many images.

```bash
#!/bin/bash
# Optimized batch processing

input_dir="images"
output_dir="text"
mkdir -p "$output_dir"

# Use detect first to skip empty images
for img in "$input_dir"/*.png; do
    [ -f "$img" ] || continue

    # Quick detection check
    if ./ocr.py detect "$img" > /dev/null 2>&1; then
        # Only run expensive OCR if text detected
        basename=$(basename "$img" .png)
        ./ocr.py extract "$img" -o "$output_dir/${basename}.txt"
        echo "Processed: $basename"
    else
        echo "Skipped (no text): $(basename "$img")"
    fi
done
```

This examples document provides comprehensive, practical scenarios for using the OCR tool effectively. Each example includes real code, explanations, and use cases that demonstrate the tool's capabilities in various contexts.
