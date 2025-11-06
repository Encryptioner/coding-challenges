# Cut Tool Examples

A comprehensive collection of practical examples demonstrating the cut tool's capabilities.

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [CSV File Processing](#csv-file-processing)
3. [Log File Analysis](#log-file-analysis)
4. [System Administration](#system-administration)
5. [Data Transformation](#data-transformation)
6. [Pipeline Compositions](#pipeline-compositions)
7. [Edge Cases](#edge-cases)
8. [Real-World Scenarios](#real-world-scenarios)

## Basic Usage

### Simple Field Extraction

```bash
# Create sample data
echo -e "John\tDoe\t30\tEngineer" > person.txt

# Extract first field
cccut -f 1 person.txt
# Output: John

# Extract multiple fields
cccut -f 1,3 person.txt
# Output: John    30

# Extract field range
cccut -f 2-4 person.txt
# Output: Doe    30    Engineer

# From field to end
cccut -f 3- person.txt
# Output: 30    Engineer
```

### Byte Extraction

```bash
# Extract first 5 bytes
echo "Hello, World!" | cccut -b 1-5
# Output: Hello

# Extract specific bytes
echo "ABCDEFGHIJ" | cccut -b 1,3,5,7,9
# Output: ACEGI

# Multiple byte ranges
echo "0123456789" | cccut -b 1-3,7-9
# Output: 012678
```

### Character Extraction

```bash
# Extract characters (same as bytes for ASCII)
echo "Programming" | cccut -c 1-7
# Output: Program

# Non-contiguous characters
echo "Hello World" | cccut -c 1,7-11
# Output: HWorld
```

## CSV File Processing

### Basic CSV Operations

```bash
# Sample CSV file
cat > people.csv << 'EOF'
Name,Age,City,Job,Salary
John Smith,30,New York,Engineer,95000
Jane Doe,28,Los Angeles,Designer,85000
Bob Johnson,35,Chicago,Manager,105000
Alice Brown,32,Boston,Developer,90000
EOF

# Extract names and jobs
cccut -f 1,4 -d , people.csv
# Output:
# Name,Job
# John Smith,Engineer
# Jane Doe,Designer
# Bob Johnson,Manager
# Alice Brown,Developer

# Extract salary column
cccut -f 5 -d , people.csv
# Output:
# Salary
# 95000
# 85000
# 105000
# 90000

# Get just the data (skip header)
tail -n +2 people.csv | cccut -f 1,5 -d ,
# Output:
# John Smith,95000
# Jane Doe,85000
# Bob Johnson,105000
# Alice Brown,90000
```

### CSV Transformation

```bash
# Reorder columns (swap name and city)
cccut -f 3,2,1,4,5 -d , people.csv
# Output:
# City,Age,Name,Job,Salary
# New York,30,John Smith,Engineer,95000
# ...

# Select subset and save
cccut -f 1,3,4 -d , people.csv > simplified.csv
cat simplified.csv
# Name,City,Job
# John Smith,New York,Engineer
# Jane Doe,Los Angeles,Designer
# ...
```

### Handling Complex CSV

```bash
# CSV with empty fields
cat > data.csv << 'EOF'
a,b,c,d
1,,3,4
5,6,,8
,,3,
EOF

# Extract field 2 (handles empty fields)
cccut -f 2 -d , data.csv
# Output:
# b
# (empty line)
# 6
# (empty line)

# Extract multiple fields with empties
cccut -f 1-3 -d , data.csv
# Output:
# a,b,c
# 1,,3
# 5,6,
# ,,3
```

## Log File Analysis

### Apache Access Logs

```bash
# Sample access log
cat > access.log << 'EOF'
192.168.1.1 - - [01/Jan/2024:10:30:45] "GET /index.html" 200 1234
192.168.1.2 - - [01/Jan/2024:10:31:22] "POST /api/users" 201 567
192.168.1.1 - - [01/Jan/2024:10:32:11] "GET /about.html" 200 890
192.168.1.3 - - [01/Jan/2024:10:33:05] "GET /contact" 404 0
EOF

# Extract IP addresses
cccut -f 1 -d ' ' access.log
# Output:
# 192.168.1.1
# 192.168.1.2
# 192.168.1.1
# 192.168.1.3

# Extract HTTP methods (6th field after splitting by quotes)
cut -f 2 -d '"' access.log | cccut -f 1 -d ' '
# Output:
# GET
# POST
# GET
# GET

# Extract status codes (field after the quoted section)
cut -f 3 -d '"' access.log | cccut -f 2 -d ' '
# Output:
# 200
# 201
# 200
# 404
```

### Application Logs

```bash
# Sample app log
cat > app.log << 'EOF'
2024-01-01 10:30:45 INFO Started application
2024-01-01 10:31:22 ERROR Database connection failed
2024-01-01 10:32:11 WARN Retrying connection attempt 1
2024-01-01 10:33:05 INFO Connected to database
EOF

# Extract timestamps (first 2 fields)
cccut -f 1-2 -d ' ' app.log
# Output:
# 2024-01-01 10:30:45
# 2024-01-01 10:31:22
# 2024-01-01 10:32:11
# 2024-01-01 10:33:05

# Extract log levels
cccut -f 3 -d ' ' app.log
# Output:
# INFO
# ERROR
# WARN
# INFO

# Extract messages (from field 4 onwards)
cccut -f 4- -d ' ' app.log
# Output:
# Started application
# Database connection failed
# Retrying connection attempt 1
# Connected to database
```

## System Administration

### /etc/passwd Processing

```bash
# Extract usernames
cccut -f 1 -d : /etc/passwd | head -5
# Output:
# root
# daemon
# bin
# sys
# sync

# Extract username and UID
cccut -f 1,3 -d : /etc/passwd | head -5
# Output:
# root:0
# daemon:1
# bin:2
# sys:3
# sync:4

# Find users with specific shell
cccut -f 1,7 -d : /etc/passwd | grep bash
# Output: (users with bash shell)
# john:/bin/bash
# jane:/bin/bash

# Extract home directories
cccut -f 6 -d : /etc/passwd | head -5
# Output:
# /root
# /usr/sbin
# /bin
# /dev
# /sbin
```

### Process Information

```bash
# Extract PID and command from ps output
ps aux | tail -n +2 | tr -s ' ' | cccut -f 2,11- -d ' ' | head -5
# Output: (PIDs and commands)
# 1 /sbin/init
# 2 [kthreadd]
# 3 [rcu_gp]
# ...

# Get memory usage
ps aux | tail -n +2 | tr -s ' ' | cccut -f 1,4 -d ' ' | head -5
# Output: (user and memory %)
# root 0.1
# root 0.0
# root 0.0
# ...
```

### Network Information

```bash
# Extract IP addresses from netstat
netstat -an | grep ESTABLISHED | tr -s ' ' | cccut -f 5 -d ' ' | cut -f 1 -d :
# Output: (IP addresses of established connections)

# Parse /etc/hosts
cat > hosts << 'EOF'
127.0.0.1    localhost
192.168.1.10 server1.local server1
192.168.1.20 server2.local server2
EOF

# Extract IP addresses
cccut -f 1 -d ' ' hosts
# Output:
# 127.0.0.1
# 192.168.1.10
# 192.168.1.20

# Extract hostnames (first hostname only)
tr -s ' ' < hosts | cccut -f 2 -d ' '
# Output:
# localhost
# server1.local
# server2.local
```

## Data Transformation

### Column Reordering

```bash
# Original: name,age,city
# Want: city,name,age

echo "John,30,NYC" | cccut -f 3,1,2 -d ,
# Output: NYC,John,30
```

### Data Filtering

```bash
# Sample data with mixed format
cat > mixed.txt << 'EOF'
John:Engineer:95000
Jane:Designer:85000
NoDelimiterLine
Bob:Manager:105000
EOF

# Only lines with delimiter
cccut -f 1 -d : -s mixed.txt
# Output:
# John
# Jane
# Bob
# (NoDelimiterLine is suppressed)

# Compare with and without -s
cccut -f 1 -d : mixed.txt
# Output:
# John
# Jane
# NoDelimiterLine  (not suppressed!)
# Bob
```

### Data Extraction for Import

```bash
# Extract data for SQL INSERT
cat > data.csv << 'EOF'
id,name,email
1,John,john@example.com
2,Jane,jane@example.com
3,Bob,bob@example.com
EOF

# Generate SQL statements
tail -n +2 data.csv | while IFS=',' read -r id name email; do
    echo "INSERT INTO users VALUES ($id, '$name', '$email');"
done
# Output:
# INSERT INTO users VALUES (1, 'John', 'john@example.com');
# INSERT INTO users VALUES (2, 'Jane', 'jane@example.com');
# INSERT INTO users VALUES (3, 'Bob', 'bob@example.com');

# Or extract specific fields for bulk load
tail -n +2 data.csv | cccut -f 2,3 -d , > users_import.csv
```

## Pipeline Compositions

### Multi-Stage Processing

```bash
# Count unique IPs in access log
cccut -f 1 -d ' ' access.log | sort | uniq -c
# Output:
#   2 192.168.1.1
#   1 192.168.1.2
#   1 192.168.1.3

# Find top 10 users by process count
ps aux | tail -n +2 | cccut -f 1 -d ' ' | sort | uniq -c | sort -rn | head -10
# Output: (top users by process count)
```

### Data Aggregation

```bash
# Sample sales data
cat > sales.csv << 'EOF'
date,product,quantity,price
2024-01-01,Widget,5,10.00
2024-01-01,Gadget,3,15.00
2024-01-02,Widget,8,10.00
2024-01-02,Gadget,2,15.00
EOF

# Extract product and quantity
tail -n +2 sales.csv | cccut -f 2,3 -d , | sort | \
awk -F, '{sum[$1]+=$2} END {for(p in sum) print p","sum[p]}'
# Output:
# Gadget,5
# Widget,13
```

### Text Processing Chain

```bash
# Extract, transform, and format
echo "John:Doe:30:Engineer" | \
    cccut -f 1,2,4 -d : | \
    tr ':' ' ' | \
    awk '{print toupper($3) ": " $1 " " $2}'
# Output: ENGINEER: John Doe
```

## Edge Cases

### Empty Fields

```bash
# Multiple consecutive delimiters
echo "a::c::e" | cccut -f 2,4 -d :
# Output: :
# (two empty fields)

echo "a::c::e" | cccut -f 1,3,5 -d :
# Output: a:c:e
```

### Lines Without Delimiter

```bash
cat > mixed.txt << 'EOF'
field1,field2,field3
no commas here
field1,field2
EOF

# Without -s: prints non-delimited lines as-is
cccut -f 1 -d , mixed.txt
# Output:
# field1
# no commas here
# field1

# With -s: suppresses non-delimited lines
cccut -f 1 -d , -s mixed.txt
# Output:
# field1
# field1
```

### Single Field Line

```bash
echo "onlyfield" | cccut -f 1,2,3 -d ,
# Output: onlyfield
# (fields 2 and 3 don't exist, no error)
```

### Empty Lines

```bash
# File with empty lines
cat > empty_lines.txt << 'EOF'
field1,field2

field3,field4
EOF

cccut -f 1 -d , empty_lines.txt
# Output:
# field1
# (empty line)
# field3
```

### Trailing Delimiter

```bash
echo "a,b,c," | cccut -f 4 -d ,
# Output: (empty - field 4 is empty string)

echo "a,b,c," | cccut -f 1-4 -d ,
# Output: a,b,c,
```

## Real-World Scenarios

### Scenario 1: Extracting Emails from Contact List

```bash
# Contact list: name,email,phone,company
cat > contacts.csv << 'EOF'
Name,Email,Phone,Company
John Smith,john@example.com,555-0100,Acme Corp
Jane Doe,jane@example.com,555-0101,Tech Inc
Bob Johnson,bob@example.com,555-0102,StartupXYZ
EOF

# Extract emails for mailing list
tail -n +2 contacts.csv | cccut -f 2 -d ,
# Output:
# john@example.com
# jane@example.com
# bob@example.com

# Create "Name <email>" format
tail -n +2 contacts.csv | cccut -f 1,2 -d , | \
    awk -F, '{print $1 " <" $2 ">"}'
# Output:
# John Smith <john@example.com>
# Jane Doe <jane@example.com>
# Bob Johnson <bob@example.com>
```

### Scenario 2: Processing Git Log

```bash
# Get commit hashes and messages
git log --oneline | cccut -c 1-7 > commit_hashes.txt

# Extract authors from full log
git log --format="%an|%ae|%s" | cccut -f 1,2 -d '|' | sort -u
# Output: (unique authors with emails)
```

### Scenario 3: Analyzing Server Metrics

```bash
# CPU usage by process
cat > metrics.txt << 'EOF'
PID    USER    %CPU    %MEM    COMMAND
1234   john    45.2    12.3    python app.py
2345   jane    23.1    8.5     node server.js
3456   john    67.8    15.2    java -jar api.jar
4567   bob     12.3    4.1     nginx
EOF

# Extract high CPU processes (>50%)
tail -n +2 metrics.txt | tr -s ' ' | cccut -f 3,5- -d ' ' | \
    awk '$1 > 50 {print}'
# Output:
# 67.8 java -jar api.jar
```

### Scenario 4: Configuration File Parsing

```bash
# Parse key-value config
cat > config.ini << 'EOF'
database.host=localhost
database.port=5432
database.name=myapp
cache.host=redis.local
cache.port=6379
EOF

# Extract database config
grep "^database\." config.ini | cccut -f 2 -d =
# Output:
# localhost
# 5432
# myapp

# Convert to environment variables
grep "^database\." config.ini | \
    sed 's/^database\./DATABASE_/; s/\./_/g; s/=/=/' | \
    tr '[a-z]' '[A-Z]'
# Output:
# DATABASE_HOST=localhost
# DATABASE_PORT=5432
# DATABASE_NAME=myapp
```

### Scenario 5: JSON Log Processing (with jq)

```bash
# JSON logs (one per line)
cat > app.json << 'EOF'
{"timestamp":"2024-01-01T10:30:45","level":"INFO","message":"Started"}
{"timestamp":"2024-01-01T10:31:22","level":"ERROR","message":"Failed"}
{"timestamp":"2024-01-01T10:32:11","level":"WARN","message":"Retry"}
EOF

# Extract timestamps and levels
cat app.json | jq -r '[.timestamp, .level] | @csv' | cccut -f 1,2 -d ,
# Output:
# "2024-01-01T10:30:45","INFO"
# "2024-01-01T10:31:22","ERROR"
# "2024-01-01T10:32:11","WARN"
```

### Scenario 6: Batch File Renaming

```bash
# Generate rename commands
ls -1 *.jpg | while read file; do
    base=$(echo "$file" | cccut -f 1 -d .)
    echo "mv $file ${base}_thumbnail.jpg"
done
# Output:
# mv photo1.jpg photo1_thumbnail.jpg
# mv photo2.jpg photo2_thumbnail.jpg
# ...
```

### Scenario 7: Network Interface Info

```bash
# Parse ip addr output
ip addr show | grep "inet " | tr -s ' ' | cccut -f 3 -d ' ' | cccut -f 1 -d /
# Output: (IP addresses without CIDR notation)
# 127.0.0.1
# 192.168.1.100
# ...
```

### Scenario 8: Extract Test Results

```bash
# Test output: name,passed,failed,skipped
cat > test_results.csv << 'EOF'
TestSuite,Passed,Failed,Skipped
Authentication,45,2,1
API,128,0,3
Database,67,1,0
Frontend,234,5,12
EOF

# Calculate pass rate
tail -n +2 test_results.csv | cccut -f 1,2,3 -d , | \
    awk -F, '{total=$2+$3; rate=$2/total*100; printf "%s: %.1f%%\n", $1, rate}'
# Output:
# Authentication: 95.7%
# API: 100.0%
# Database: 98.5%
# Frontend: 97.9%
```

## Performance Tips

### Use -s to Skip Non-Matching Lines

```bash
# Faster: skips lines without delimiter
cccut -f 1 -d : -s /etc/passwd

# Slower: processes all lines
cccut -f 1 -d : /etc/passwd
```

### Combine with Other Tools Efficiently

```bash
# Less efficient: multiple passes
cat file | cccut -f 1 -d , | sort | uniq

# More efficient: single cut, let sort handle rest
cccut -f 1 -d , file | sort -u
```

### Avoid Unnecessary Field Extraction

```bash
# If you need just first field, don't extract all
cccut -f 1 -d ,  # Good
cccut -f 1-10 -d , | cccut -f 1  # Bad (wasteful)
```

## Summary

The cut tool excels at:
- **Column extraction** from structured text
- **Quick data inspection** of CSV/TSV files
- **Log analysis** and filtering
- **Pipeline preprocessing** for other tools
- **Text transformations** in shell scripts

Best practices:
- Use `-s` to suppress non-delimited lines when appropriate
- Combine with `grep`, `sort`, `uniq` for powerful pipelines
- Remember fields are 1-indexed
- Test with sample data before processing large files
- Use `head` during development to avoid processing entire files

Happy data wrangling! 🛠️
