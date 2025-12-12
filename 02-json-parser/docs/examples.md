# JSON Parser Examples

Practical examples and use cases for the JSON parser, from basic validation to real-world applications.

## Table of Contents

1. [Basic Examples](#basic-examples)
2. [Command-Line Usage](#command-line-usage)
3. [Shell Scripting](#shell-scripting)
4. [Real-World JSON](#real-world-json)
5. [Error Examples](#error-examples)
6. [Performance Testing](#performance-testing)
7. [Integration Examples](#integration-examples)

## Basic Examples

### Example 1: Empty Structures

**Empty Object:**
```bash
echo '{}' | ./ccjsonparser
# Output: Valid JSON
```

**Empty Array:**
```bash
echo '[]' | ./ccjsonparser
# Output: Valid JSON
```

### Example 2: Simple Values

**String:**
```bash
echo '{"message": "Hello, World!"}' | ./ccjsonparser
# Output: Valid JSON
```

**Number:**
```bash
echo '{"count": 42, "price": 19.99, "temp": -5}' | ./ccjsonparser
# Output: Valid JSON
```

**Boolean:**
```bash
echo '{"active": true, "deleted": false}' | ./ccjsonparser
# Output: Valid JSON
```

**Null:**
```bash
echo '{"data": null}' | ./ccjsonparser
# Output: Valid JSON
```

### Example 3: Arrays

**Array of Numbers:**
```bash
echo '[1, 2, 3, 4, 5]' | ./ccjsonparser
# Output: Valid JSON
```

**Array of Strings:**
```bash
echo '["apple", "banana", "cherry"]' | ./ccjsonparser
# Output: Valid JSON
```

**Mixed Array:**
```bash
echo '[1, "two", true, null, {"five": 5}]' | ./ccjsonparser
# Output: Valid JSON
```

### Example 4: Nested Structures

**Nested Objects:**
```bash
cat > nested.json << 'EOF'
{
  "user": {
    "name": "Alice",
    "address": {
      "city": "NYC",
      "zip": "10001"
    }
  }
}
EOF

./ccjsonparser nested.json
# Output: Valid JSON
```

**Array of Objects:**
```bash
cat > users.json << 'EOF'
[
  {"id": 1, "name": "Alice"},
  {"id": 2, "name": "Bob"},
  {"id": 3, "name": "Charlie"}
]
EOF

./ccjsonparser users.json
# Output: Valid JSON
```

## Command-Line Usage

### Validate Files

```bash
# Single file
./ccjsonparser config.json

# Multiple files
for file in *.json; do
    ./ccjsonparser "$file"
done
```

### Standard Input

**From echo:**
```bash
echo '{"valid": true}' | ./ccjsonparser
```

**From file redirect:**
```bash
./ccjsonparser < data.json
```

**From heredoc:**
```bash
./ccjsonparser << 'EOF'
{
  "name": "Test",
  "value": 123
}
EOF
```

### Exit Codes

```bash
# Check if valid
if ./ccjsonparser config.json > /dev/null 2>&1; then
    echo "Config is valid"
else
    echo "Config is invalid"
    exit 1
fi
```

### Piping

**From curl:**
```bash
curl -s https://api.github.com/users/octocat | ./ccjsonparser
```

**From other commands:**
```bash
# Generate JSON and validate
cat data.txt | jq '.' | ./ccjsonparser
```

## Shell Scripting

### Script 1: Validate All JSON Files

```bash
#!/bin/bash
# validate-json.sh

echo "Validating JSON files..."

total=0
valid=0
invalid=0

for file in *.json; do
    ((total++))

    if ./ccjsonparser "$file" > /dev/null 2>&1; then
        echo "✓ $file"
        ((valid++))
    else
        echo "✗ $file"
        ((invalid++))
    fi
done

echo ""
echo "Summary:"
echo "  Total: $total"
echo "  Valid: $valid"
echo "  Invalid: $invalid"

# Exit with error if any invalid
[ $invalid -eq 0 ]
```

Usage:
```bash
chmod +x validate-json.sh
./validate-json.sh
```

### Script 2: Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Validate all staged JSON files
json_files=$(git diff --cached --name-only --diff-filter=ACM | grep '\.json$')

if [ -z "$json_files" ]; then
    exit 0  # No JSON files changed
fi

echo "Validating JSON files..."

invalid=0
for file in $json_files; do
    if ! ./ccjsonparser "$file" 2>&1; then
        echo "✗ Invalid JSON: $file"
        ((invalid++))
    fi
done

if [ $invalid -gt 0 ]; then
    echo ""
    echo "Commit rejected: $invalid invalid JSON file(s)"
    exit 1
fi

echo "All JSON files valid ✓"
exit 0
```

### Script 3: API Response Validator

```bash
#!/bin/bash
# validate-api.sh

API_URL="https://api.example.com/data"

# Fetch and validate
response=$(curl -s "$API_URL")

if echo "$response" | ./ccjsonparser > /dev/null 2>&1; then
    echo "API response is valid JSON ✓"
    # Process the response
    echo "$response" | jq '.'
else
    echo "API returned invalid JSON ✗"
    echo "Response:"
    echo "$response"
    exit 1
fi
```

### Script 4: Configuration Validator

```bash
#!/bin/bash
# check-config.sh

CONFIG_FILE="config.json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: $CONFIG_FILE not found"
    exit 1
fi

echo "Validating $CONFIG_FILE..."

if ./ccjsonparser "$CONFIG_FILE"; then
    echo "✓ Configuration is valid"

    # Additional checks
    # (require jq for this)
    if ! jq -e '.database.host' "$CONFIG_FILE" > /dev/null; then
        echo "Warning: database.host not found"
    fi

    if ! jq -e '.port' "$CONFIG_FILE" > /dev/null; then
        echo "Warning: port not specified"
    fi
else
    echo "✗ Configuration is invalid"
    echo "Fix the errors before running the application"
    exit 1
fi
```

## Real-World JSON

### Example 1: Package.json

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "description": "A sample project",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.0",
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "jest": "^29.0.0"
  }
}
```

```bash
./ccjsonparser package.json
# Output: Valid JSON
```

### Example 2: Configuration File

```json
{
  "server": {
    "host": "localhost",
    "port": 8080,
    "ssl": {
      "enabled": true,
      "cert": "/path/to/cert.pem",
      "key": "/path/to/key.pem"
    }
  },
  "database": {
    "type": "postgresql",
    "host": "db.example.com",
    "port": 5432,
    "name": "myapp",
    "pool": {
      "min": 2,
      "max": 10
    }
  },
  "logging": {
    "level": "info",
    "file": "/var/log/app.log"
  }
}
```

### Example 3: API Response

```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "id": 1,
        "username": "alice",
        "email": "alice@example.com",
        "roles": ["admin", "user"],
        "created_at": "2024-01-15T10:30:00Z",
        "is_active": true
      },
      {
        "id": 2,
        "username": "bob",
        "email": "bob@example.com",
        "roles": ["user"],
        "created_at": "2024-01-16T14:20:00Z",
        "is_active": true
      }
    ],
    "total": 2,
    "page": 1,
    "per_page": 10
  },
  "meta": {
    "timestamp": "2024-01-20T12:00:00Z",
    "version": "1.0"
  }
}
```

### Example 4: GeoJSON

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-73.935242, 40.730610]
      },
      "properties": {
        "name": "New York City",
        "population": 8336817
      }
    }
  ]
}
```

### Example 5: JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "User",
  "type": "object",
  "required": ["id", "username", "email"],
  "properties": {
    "id": {
      "type": "integer",
      "minimum": 1
    },
    "username": {
      "type": "string",
      "minLength": 3,
      "maxLength": 20
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "age": {
      "type": "integer",
      "minimum": 0,
      "maximum": 120
    }
  }
}
```

## Error Examples

### Error 1: Missing Closing Brace

```bash
echo '{"key": "value"' | ./ccjsonparser
```

Output:
```
Invalid JSON
Error at line 1, column 17: Expected value
```

### Error 2: Non-String Key

```bash
echo '{123: "value"}' | ./ccjsonparser
```

Output:
```
Invalid JSON
Error at line 1, column 2: Expected string key
```

### Error 3: Missing Colon

```bash
echo '{"key" "value"}' | ./ccjsonparser
```

Output:
```
Invalid JSON
Error at line 1, column 8: Expected ':' after key
```

### Error 4: Trailing Comma

```bash
echo '{"key": "value",}' | ./ccjsonparser
```

Output:
```
Invalid JSON
Error at line 1, column 17: Expected string key
```

### Error 5: Single Quotes

```bash
echo "{'key': 'value'}" | ./ccjsonparser
```

Output:
```
Invalid JSON
Error at line 1, column 2: Expected string key
```

### Error 6: Unescaped Quotes

```bash
echo '{"message": "He said "hello""}' | ./ccjsonparser
```

Output:
```
Invalid JSON
Error at line 1, column 21: Expected ':' after key
```

Correct version:
```bash
echo '{"message": "He said \"hello\""}' | ./ccjsonparser
# Output: Valid JSON
```

### Error 7: Invalid Number

```bash
echo '{"value": 01}' | ./ccjsonparser
# Leading zero not allowed (except for "0")
```

Output:
```
Invalid JSON
Error at line 1, column 12: Expected value
```

### Error 8: Missing Comma

```bash
echo '{"a": 1 "b": 2}' | ./ccjsonparser
```

Output:
```
Invalid JSON
Error at line 1, column 9: Expected '}'
```

## Performance Testing

### Test 1: Large Array

```bash
# Generate large array
python3 << 'EOF'
import json
data = list(range(100000))
print(json.dumps(data))
EOF > large-array.json

# Test parsing time
time ./ccjsonparser large-array.json
```

### Test 2: Deep Nesting

```bash
# Generate deeply nested object
python3 << 'EOF'
import json
obj = {}
current = obj
for i in range(1000):
    current["nested"] = {}
    current = current["nested"]
print(json.dumps(obj))
EOF > deep-nest.json

# Test parsing (may hit recursion limit)
./ccjsonparser deep-nest.json
```

### Test 3: Many Keys

```bash
# Generate object with many keys
python3 << 'EOF'
import json
obj = {f"key{i}": i for i in range(10000)}
print(json.dumps(obj))
EOF > many-keys.json

# Test parsing
./ccjsonparser many-keys.json
```

### Test 4: Long Strings

```bash
# Generate JSON with long strings
python3 << 'EOF'
import json
data = {"text": "A" * 1000000}
print(json.dumps(data))
EOF > long-string.json

# Test parsing
./ccjsonparser long-string.json
```

## Integration Examples

### With jq

```bash
# Validate before processing
if ./ccjsonparser data.json > /dev/null 2>&1; then
    jq '.users[] | select(.active == true)' data.json
else
    echo "Invalid JSON, cannot process"
fi
```

### With curl

```bash
# Validate API response
curl -s https://api.example.com/data \
  | tee response.json \
  | ./ccjsonparser \
  && echo "Response saved to response.json"
```

### With find

```bash
# Validate all JSON files in directory tree
find . -name "*.json" -type f -exec ./ccjsonparser {} \; -print
```

### With xargs

```bash
# Parallel validation
find . -name "*.json" -print0 \
  | xargs -0 -P 4 -I {} sh -c './ccjsonparser "{}" && echo "✓ {}"'
```

### With watch

```bash
# Monitor file for changes
watch -n 1 './ccjsonparser config.json && echo Valid || echo Invalid'
```

### In Makefile

```makefile
.PHONY: validate-json
validate-json:
	@echo "Validating JSON files..."
	@for file in $(wildcard *.json); do \
		if ./ccjsonparser $$file > /dev/null 2>&1; then \
			echo "✓ $$file"; \
		else \
			echo "✗ $$file"; \
			exit 1; \
		fi \
	done
	@echo "All JSON files valid ✓"

.PHONY: test
test: validate-json
	@echo "Running tests..."
	# ... other tests
```

### In CI/CD

**GitHub Actions:**
```yaml
name: Validate JSON

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-slim
    steps:
      - uses: actions/checkout@v2

      - name: Build JSON parser
        run: |
          cd 02-json-parser
          make

      - name: Validate JSON files
        run: |
          for file in $(find . -name "*.json"); do
            ./02-json-parser/ccjsonparser "$file"
          done
```

**GitLab CI:**
```yaml
validate-json:
  script:
    - cd 02-json-parser
    - make
    - find .. -name "*.json" -exec ./ccjsonparser {} \;
```

## Practical Use Cases

### Use Case 1: Config Validation on Startup

```bash
#!/bin/bash
# startup.sh

echo "Starting application..."

# Validate config first
if ! ./ccjsonparser config/app.json; then
    echo "ERROR: Invalid configuration file"
    echo "Please fix config/app.json before starting"
    exit 1
fi

# Start the app
echo "Configuration valid ✓"
exec node app.js
```

### Use Case 2: Data Migration Validator

```bash
#!/bin/bash
# migrate-data.sh

SOURCE="old-data.json"
DEST="new-data.json"

echo "Migrating data..."

# Validate source
if ! ./ccjsonparser "$SOURCE"; then
    echo "Source data is invalid"
    exit 1
fi

# Perform migration
transform-data "$SOURCE" > "$DEST"

# Validate result
if ! ./ccjsonparser "$DEST"; then
    echo "Migration produced invalid JSON"
    rm "$DEST"
    exit 1
fi

echo "Migration successful ✓"
```

### Use Case 3: Development Tool

```bash
#!/bin/bash
# dev-watch.sh

# Watch for changes and validate
inotifywait -m -e close_write *.json |
while read -r directory events filename; do
    echo "File changed: $filename"
    if ./ccjsonparser "$filename"; then
        echo "✓ Valid"
        # Trigger reload/restart
        pkill -USR1 myapp
    else
        echo "✗ Invalid - not reloading"
    fi
done
```

### Use Case 4: Backup Validator

```bash
#!/bin/bash
# backup-and-validate.sh

BACKUP_DIR="/backups/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

for db in users orders products; do
    echo "Backing up $db..."

    # Export to JSON
    export-db "$db" > "$BACKUP_DIR/$db.json"

    # Validate
    if ./ccjsonparser "$BACKUP_DIR/$db.json"; then
        echo "✓ $db backup valid"
        gzip "$BACKUP_DIR/$db.json"
    else
        echo "✗ $db backup invalid - removing"
        rm "$BACKUP_DIR/$db.json"
        exit 1
    fi
done

echo "All backups completed ✓"
```

## Summary

The JSON parser can be used for:

✓ **Validation**: Ensure JSON is well-formed
✓ **CI/CD**: Automated checks in pipelines
✓ **Development**: Pre-commit hooks and watchers
✓ **Production**: Config validation on startup
✓ **Testing**: Verify API responses
✓ **Data Processing**: Validate before transformation

These examples demonstrate real-world applications of JSON parsing beyond simple validation.
