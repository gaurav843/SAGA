# FILEPATH: backend/docs/NERVOUS_SYSTEM.md
# 🧠 The Nervous System: Event Architecture & Outbox Pattern

# 1. Overview
The Flodock "Nervous System" is a **Fractal Event Bus** designed to decouple the **Core Kernel** (Source of Truth) from the **External World** (UI, AI, Analytics).

Instead of the API writing directly to Kafka (which risks data loss if the DB commit fails), we use the **Transactional Outbox Pattern**.

### 🏗️ Architecture



1.  **The Synapse (Interceptor):**
    * Every time you save a model (`User`, `Policy`, `Widget`), the `LogicInterceptor` activates.
    * It calculates the "Delta" (Old Value vs. New Value).
    * It creates a **Pending Event** in the `system_outbox` table within the *same transaction*.
    * **Guarantee:** If the User is saved, the Event is saved. Atomic consistency.

2.  **The Memory (System Outbox):**
    * A Postgres table acting as a durable buffer.
    * **Columns:**
        * `event_name`: e.g., `META:CREATED`, `USER:UPDATED`.
        * `payload`: JSON snapshot of the change.
        * `partition_key`: Ensures strict ordering (e.g., User ID).
        * `status`: `PENDING` -> `PUBLISHED` -> `FAILED`.

3.  **The Relay (The Pump):**
    * A Python background worker (`relay.py`).
    * Polls `system_outbox` for `PENDING` events.
    * Pushes them to Kafka.
    * Updates status to `PUBLISHED` only after Kafka acknowledges receipt (ACK).

---

## 2. Event Payload Structure

Every event follows the **CloudEvents** inspired schema.

```json
{
  "event_name": "META:CREATED",
  "partition_key": "sys_test_cdc_v1",
  "payload": {
    "domain": "META",
    "model": "POLICYDEFINITION",
    "entity_id": null, 
    "changes": {
      "name": { "old": null, "new": "Security Policy" },
      "is_active": { "old": null, "new": true }
    },
    "timestamp": "2026-02-07T15:21:23.836810"
  }
}

⚠️ The "Null ID" Phenomenon
You may see "entity_id": null for CREATED events.

Why: Postgres assigns the ID (Auto-Increment) during the commit. The Interceptor runs before the commit to ensure atomicity.

Solution: Use the partition_key or the Business Key (e.g., policy_key, email) in the changes payload to identify the object.

3. Kafka Infrastructure (User-Space)
Since we operate in a No-Docker / No-Admin environment, we run Kafka as a local binary.

📂 Directory Structure
backend/infrastructure/kafka: Contains the binaries and logs.

backend/scripts/setup_kafka.ps1: Automation script.

🚀 Commands
Install: powershell ./scripts/setup_kafka.ps1

Start Zookeeper: .\bin\windows\zookeeper-server-start.bat .\config\zookeeper.properties

Start Kafka: .\bin\windows\kafka-server-start.bat .\config\server.properties

topics
flodock.events.global.v1: The "Firehose" topic containing all CDC events.


#### 2. `backend/scripts/setup_kafka.ps1`
**Description:** A PowerShell automation script. It downloads Kafka (if missing), extracts it, and configures it for Windows execution. **It checks for Java.**

```powershell
# FILEPATH: backend/scripts/setup_kafka.ps1
# @file: Kafka User-Space Setup
# @description: Downloads and Configures Kafka without Admin Rights.
# @invariant: Requires Java installed.

$ErrorActionPreference = "Stop"

# --- CONFIGURATION ---
$KAFKA_VERSION = "3.6.1"
$SCALA_VERSION = "2.13"
$KAFKA_URL = "https://downloads.apache.org/kafka/$KAFKA_VERSION/kafka_$SCALA_VERSION-$KAFKA_VERSION.tgz"
$BASE_DIR = Resolve-Path ".."
$INFRA_DIR = Join-Path $BASE_DIR "infrastructure"
$KAFKA_DIR = Join-Path $INFRA_DIR "kafka"
$TAR_FILE = Join-Path $INFRA_DIR "kafka.tgz"

Write-Host "🦕 [Flodock] Kafka User-Space Installer" -ForegroundColor Cyan
Write-Host "========================================"

# 1. CHECK JAVA
try {
    java -version 2>&1 | Out-Null
    Write-Host "✅ [Check] Java is installed." -ForegroundColor Green
} catch {
    Write-Host "❌ [Error] Java is NOT installed or not in PATH." -ForegroundColor Red
    Write-Host "   Kafka requires Java 8+. Please install OpenJDK."
    exit 1
}

# 2. CREATE DIRECTORIES
if (-not (Test-Path $INFRA_DIR)) {
    New-Item -ItemType Directory -Path $INFRA_DIR | Out-Null
}

# 3. DOWNLOAD KAFKA
if (-not (Test-Path $KAFKA_DIR)) {
    if (-not (Test-Path $TAR_FILE)) {
        Write-Host "⬇️ [Download] Fetching Kafka $KAFKA_VERSION..."
        Invoke-WebRequest -Uri $KAFKA_URL -OutFile $TAR_FILE
    }

    Write-Host "📦 [Extract] Unpacking Kafka (This takes a moment)..."
    # Use tar command (available in Win10+)
    cd $INFRA_DIR
    tar -xf kafka.tgz
    
    # Rename to clean folder
    Rename-Item "kafka_$SCALA_VERSION-$KAFKA_VERSION" "kafka"
    Write-Host "✅ [Install] Kafka installed to $KAFKA_DIR" -ForegroundColor Green
} else {
    Write-Host "⚡ [Skip] Kafka is already installed." -ForegroundColor Yellow
}

# 4. CONFIGURE FOR WINDOWS
# We need to fix the log directories in the properties files to be absolute windows paths
$SERVER_PROP = Join-Path $KAFKA_DIR "config\server.properties"
$ZOOKEEPER_PROP = Join-Path $KAFKA_DIR "config\zookeeper.properties"
$LOG_DIR = Join-Path $KAFKA_DIR "kafka-logs"
$ZK_DIR = Join-Path $KAFKA_DIR "zookeeper-data"

# Escape backslashes for config file
$LOG_DIR_ESC = $LOG_DIR -replace "\\", "/"
$ZK_DIR_ESC = $ZK_DIR -replace "\\", "/"

(Get-Content $SERVER_PROP) -replace "log.dirs=.*", "log.dirs=$LOG_DIR_ESC" | Set-Content $SERVER_PROP
(Get-Content $ZOOKEEPER_PROP) -replace "dataDir=.*", "dataDir=$ZK_DIR_ESC" | Set-Content $ZOOKEEPER_PROP

Write-Host "⚙️ [Config] Updated data directories."
Write-Host "----------------------------------------"
Write-Host "🚀 TO START KAFKA (Open 2 Terminals):"
Write-Host "   1. cd infrastructure\kafka"
Write-Host "      .\bin\windows\zookeeper-server-start.bat .\config\zookeeper.properties"
Write-Host ""
Write-Host "   2. cd infrastructure\kafka"
Write-Host "      .\bin\windows\kafka-server-start.bat .\config\server.properties"
Write-Host "----------------------------------------"