# cccut - Practical Examples

This document provides extensive real-world examples of using cccut for various text processing tasks.

## Table of Contents

1. [CSV Processing](#csv-processing)
2. [Log File Analysis](#log-file-analysis)
3. [System Administration](#system-administration)
4. [Development Workflows](#development-workflows)
5. [Data Cleaning](#data-cleaning)
6. [Report Generation](#report-generation)
7. [Pipeline Recipes](#pipeline-recipes)

## CSV Processing

### Extract Specific Columns

**Scenario:** You have a contacts CSV and need just names and emails.

```bash
# contacts.csv:
# Name,Email,Phone,City,Country
# Alice Johnson,alice@example.com,555-0101,NYC,USA
# Bob Smith,bob@example.com,555-0102,LA,USA

./cccut -d',' -f1,2 contacts.csv
```

**Output:**
```
Name,Email
Alice Johnson,alice@example.com
Bob Smith,bob@example.com
```

### Reorder Columns

**Scenario:** Rearrange CSV columns for import into another system.

```bash
# Original: Name,Age,City
# Needed: City,Name,Age

./cccut -d',' -f3,1,2 data.csv
```

### Extract Without Header

**Scenario:** Get data columns without the header row.

```bash
tail -n +2 data.csv | ./cccut -d',' -f2,4
```

### Combine Fields from Different Files

**Scenario:** Merge specific columns from two CSV files.

```bash
# Combine first column from file1 and second column from file2
paste <(./cccut -d',' -f1 file1.csv) <(./cccut -d',' -f2 file2.csv) -d','
```

### Calculate Summary Statistics

**Scenario:** Extract a numeric column and calculate stats.

```bash
# Extract prices (column 3) and calculate total
./cccut -d',' -f3 sales.csv | tail -n +2 | awk '{sum+=$1} END {print sum}'

# Or average
./cccut -d',' -f3 sales.csv | tail -n +2 | awk '{sum+=$1; count++} END {print sum/count}'
```

## Log File Analysis

### Extract Timestamps

**Scenario:** Get all timestamps from log files.

```bash
# Log format: 2024-01-15 10:30:45 [INFO] Message
./cccut -c1-19 app.log
```

**Output:**
```
2024-01-15 10:30:45
2024-01-15 10:30:46
2024-01-15 10:30:47
```

### Extract Log Levels

**Scenario:** Get log severity levels.

```bash
# Space-delimited: date time [LEVEL] message
./cccut -d' ' -f3 app.log | sort | uniq -c
```

**Output:**
```
  45 [INFO]
  12 [WARN]
   3 [ERROR]
```

### Filter and Extract

**Scenario:** Extract specific fields from error logs.

```bash
# Get timestamp and message from ERROR lines
grep "ERROR" app.log | ./cccut -d' ' -f1,2,4-
```

### Extract IP Addresses from Access Logs

**Scenario:** Find all IPs accessing your server.

```bash
# Apache/Nginx format: IP - - [timestamp] "request" status size
./cccut -d' ' -f1 access.log | sort | uniq -c | sort -nr
```

**Output:**
```
  150 192.168.1.1
   89 192.168.1.2
   45 10.0.0.1
```

### Extract Request URLs

**Scenario:** Get all requested paths.

```bash
# Extract the request part then get just the URL
./cccut -d'"' -f2 access.log | ./cccut -d' ' -f2 | sort | uniq -c
```

### Daily Log Analysis

**Scenario:** Extract date and count requests per day.

```bash
./cccut -c2-11 access.log | sort | uniq -c
```

## System Administration

### Parse /etc/passwd

**Get all usernames:**
```bash
./cccut -d':' -f1 /etc/passwd
```

**Get username and home directory:**
```bash
./cccut -d':' -f1,6 /etc/passwd
```

**Find users with bash shell:**
```bash
./cccut -d':' -f1,7 /etc/passwd | grep bash
```

**Get users with UID >= 1000 (normal users):**
```bash
./cccut -d':' -f1,3 /etc/passwd | awk -F: '$2 >= 1000'
```

### Parse /etc/group

**List all groups:**
```bash
./cccut -d':' -f1 /etc/group
```

**Get group and GID:**
```bash
./cccut -d':' -f1,3 /etc/group
```

### Process ps Output

**Extract PIDs:**
```bash
ps aux | tail -n +2 | awk '{print $2}'
# or with cccut on fixed columns
ps aux | tail -n +2 | ./cccut -c9-15
```

**Extract command names:**
```bash
ps aux | tail -n +2 | awk '{print $11}'
```

### Parse Environment Variables

**Extract PATH components:**
```bash
echo $PATH | tr ':' '\n'
# or get specific component
echo $PATH | ./cccut -d':' -f3
```

**Modify PATH:**
```bash
# Remove first PATH component
export PATH=$(echo $PATH | ./cccut -d':' -f2-)
```

### Disk Usage Reporting

**Extract directory names and sizes:**
```bash
du -h | ./cccut -f2
```

**Get sizes only:**
```bash
du -h | ./cccut -f1
```

## Development Workflows

### Git Log Processing

**Extract commit hashes:**
```bash
git log --oneline | ./cccut -c1-7
```

**Extract commit messages:**
```bash
git log --oneline | ./cccut -c9-
```

**Count commits by author:**
```bash
git log --format="%an" | sort | uniq -c | sort -nr
```

**Extract files changed in commit:**
```bash
git show --name-only | tail -n +7
```

### Process package.json Dependencies

**Extract dependency names (assuming formatted JSON):**
```bash
grep '"' package.json | ./cccut -d'"' -f2 | grep -v "^$"
```

### Parse Dockerfile

**Extract base images:**
```bash
grep "^FROM" Dockerfile | ./cccut -d' ' -f2
```

### Process Test Output

**Extract test names from pytest:**
```bash
pytest --collect-only | grep "<Function" | ./cccut -d' ' -f2
```

**Extract failed test names:**
```bash
pytest -v | grep FAILED | ./cccut -d' ' -f1
```

### Code Statistics

**Count functions in Python files:**
```bash
grep "^def " *.py | ./cccut -d':' -f1 | uniq -c
```

**Extract function names:**
```bash
grep "^def " *.py | ./cccut -d' ' -f2 | ./cccut -d'(' -f1
```

### Parse requirements.txt

**Get package names without versions:**
```bash
./cccut -d'=' -f1 requirements.txt
# or
./cccut -d'>' -f1 requirements.txt
```

## Data Cleaning

### Remove Columns

**Scenario:** Remove sensitive columns from CSV.

```bash
# Keep all except column 3 (keeping 1,2,4,5,...)
# For 6 columns, keep 1,2,4,5,6
./cccut -d',' -f1,2,4-6 data.csv
```

### Trim Fixed-Width Data

**Scenario:** Extract specific positions from fixed-width format.

```bash
# Format: ID(5 chars) Name(20 chars) Age(3 chars)
./cccut -c1-5 data.txt    # IDs
./cccut -c6-25 data.txt   # Names
./cccut -c26-28 data.txt  # Ages
```

### Split Compound Fields

**Scenario:** Break "LastName, FirstName" into separate fields.

```bash
# Input: "Smith, John",30,Engineer
./cccut -d',' -f1 data.csv | ./cccut -d' ' -f2  # First names
./cccut -d',' -f1 data.csv | ./cccut -d',' -f1  # Last names
```

### Extract Numeric IDs

**Scenario:** Get numeric IDs from formatted strings.

```bash
# Input: user-12345, user-67890
./cccut -d'-' -f2 users.txt
```

### Clean Whitespace-Separated Data

**Scenario:** Extract fields from whitespace-separated data.

```bash
# Multiple spaces as separators - normalize first
cat data.txt | tr -s ' ' | ./cccut -d' ' -f2,4
```

## Report Generation

### Create Summary Tables

**Scenario:** Generate a summary from detailed data.

```bash
# Extract and count categories
./cccut -d',' -f2 sales.csv | tail -n +2 | sort | uniq -c | sort -nr

# Create formatted output
./cccut -d',' -f2 sales.csv | tail -n +2 | sort | uniq -c | \
  awk '{printf "%-20s %d\n", $2, $1}'
```

### Format Reports

**Scenario:** Extract and reformat data for reports.

```bash
# Extract date and amount, format as report
./cccut -d',' -f1,3 transactions.csv | tail -n +2 | \
  awk -F',' '{printf "%s: $%.2f\n", $1, $2}'
```

### Create Frequency Tables

**Scenario:** Count occurrences of values.

```bash
# Count by status column
./cccut -d',' -f5 orders.csv | tail -n +2 | sort | uniq -c

# With percentages
total=$(./cccut -d',' -f5 orders.csv | tail -n +2 | wc -l)
./cccut -d',' -f5 orders.csv | tail -n +2 | sort | uniq -c | \
  awk -v total=$total '{printf "%s: %d (%.1f%%)\n", $2, $1, ($1/total)*100}'
```

### Generate HTML Tables

**Scenario:** Convert CSV to simple HTML.

```bash
echo "<table>"
echo "<tr><th>Name</th><th>Email</th></tr>"
./cccut -d',' -f1,2 contacts.csv | tail -n +2 | \
  awk -F',' '{printf "<tr><td>%s</td><td>%s</td></tr>\n", $1, $2}'
echo "</table>"
```

## Pipeline Recipes

### Recipe: Find Top 10 Users by Activity

```bash
# From logs: timestamp username action
./cccut -d' ' -f2 activity.log | sort | uniq -c | sort -nr | head -10
```

### Recipe: Extract and Validate Emails

```bash
# Extract emails (column 2) and check format
./cccut -d',' -f2 users.csv | grep -E '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
```

### Recipe: Compare Two Files by Column

```bash
# Compare first column of two files
diff <(./cccut -d',' -f1 file1.csv | sort) <(./cccut -d',' -f1 file2.csv | sort)
```

### Recipe: Create Backup with Timestamp

```bash
# Extract date from log filename, create backup
for file in *.log; do
  date=$(echo $file | ./cccut -c5-14)
  cp $file backup-$date.log
done
```

### Recipe: Aggregate Data by Date

```bash
# Sum values by date (date in col 1, value in col 3)
./cccut -d',' -f1,3 data.csv | tail -n +2 | \
  awk -F',' '{sum[$1]+=$2} END {for(d in sum) print d","sum[d]}'
```

### Recipe: Extract and Deduplicate

```bash
# Get unique values from column 2
./cccut -d',' -f2 data.csv | sort -u
```

### Recipe: Join Data from Two Sources

```bash
# Join on first column
join -t',' \
  <(./cccut -d',' -f1,2 file1.csv | sort) \
  <(./cccut -d',' -f1,3 file2.csv | sort)
```

### Recipe: Rotate Columns (Transpose)

```bash
# Simple 2-column transpose
./cccut -d',' -f1 data.csv | paste -s -d',' -
./cccut -d',' -f2 data.csv | paste -s -d',' -
```

### Recipe: Create Lookup Map

```bash
# Create associative array from two columns
declare -A map
while IFS=',' read -r key value; do
  map[$key]=$value
done < <(./cccut -d',' -f1,2 mapping.csv)

# Use the map
echo ${map["somekey"]}
```

### Recipe: Extract Nested Fields

```bash
# For "outer:inner:value" extract different levels
./cccut -d':' -f1 data.txt      # outer
./cccut -d':' -f2 data.txt      # inner
./cccut -d':' -f3 data.txt      # value
./cccut -d':' -f2-3 data.txt    # inner:value
```

### Recipe: Time-Based Filtering

```bash
# Extract records from specific time range
./cccut -c1-19 app.log | \
  awk '$1" "$2 >= "2024-01-15 10:00:00" && $1" "$2 <= "2024-01-15 11:00:00"'
```

### Recipe: Create CSV from Command Output

```bash
# Convert ps output to CSV
ps aux | awk '{print $1","$2","$3","$4","$11}' | ./cccut -d',' -f1-5
```

## Complex Real-World Scenarios

### Scenario 1: Web Server Log Analysis

**Goal:** Find the top 10 most requested pages and their status codes.

```bash
# Extract URL and status code
./cccut -d'"' -f2 access.log | ./cccut -d' ' -f2 > urls.txt
./cccut -d' ' -f9 access.log > status.txt

# Combine and count
paste urls.txt status.txt -d',' | sort | uniq -c | sort -nr | head -10

# Cleanup
rm urls.txt status.txt
```

### Scenario 2: Data Migration

**Goal:** Transform old CSV format to new format.

```bash
# Old: FirstName,LastName,Email,Phone
# New: Email,FullName,Phone

./cccut -d',' -f3 old.csv > col1.tmp
paste \
  <(./cccut -d',' -f1 old.csv) \
  <(./cccut -d',' -f2 old.csv) | \
  awk '{print $1" "$2}' > col2.tmp
./cccut -d',' -f4 old.csv > col3.tmp

paste -d',' col1.tmp col2.tmp col3.tmp > new.csv
rm *.tmp
```

### Scenario 3: Performance Monitoring

**Goal:** Track response times over time.

```bash
# Log format: timestamp url response_time status
# Extract hour and response time, calculate average per hour

./cccut -d' ' -f1 perf.log | ./cccut -c12-13 > hours.tmp
./cccut -d' ' -f3 perf.log > times.tmp

paste hours.tmp times.tmp | \
  awk '{sum[$1]+=$2; count[$1]++} END {for(h in sum) printf "%s:00 - Avg: %.2fms\n", h, sum[h]/count[h]}' | \
  sort

rm *.tmp
```

### Scenario 4: Security Audit

**Goal:** Find failed login attempts by user.

```bash
# Log: timestamp username action status
grep "login.*failed" auth.log | \
  ./cccut -d' ' -f2 | \
  sort | uniq -c | sort -nr | \
  awk '{if($1>=3) printf "User %s: %d failed attempts\n", $2, $1}'
```

## Tips and Tricks

1. **Preview column positions:**
   ```bash
   head -1 data.csv | tr ',' '\n' | nl
   ```

2. **Count fields in a line:**
   ```bash
   head -1 data.csv | awk -F',' '{print NF}'
   ```

3. **Visualize field boundaries:**
   ```bash
   echo "A,B,C,D" | sed 's/,/ | /g'
   ```

4. **Test ranges incrementally:**
   ```bash
   echo "A,B,C,D,E,F" | ./cccut -d',' -f1
   echo "A,B,C,D,E,F" | ./cccut -d',' -f1-2
   echo "A,B,C,D,E,F" | ./cccut -d',' -f1-3
   ```

5. **Debug with sample data:**
   ```bash
   head -5 large_file.csv | ./cccut -d',' -f2,4
   ```

---

For more information, see the [Comprehensive Guide](GUIDE.md).
