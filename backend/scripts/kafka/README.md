# Description: The Operator's Manual for the Nervous System.

# Markdown

# 🦖 Flodock Nervous System (Kafka Infrastructure)

# This directory contains the tools to manage the **Event-Driven Architecture** of Flodock.

# 📂 Architecture

# | Component | Role | Description |
# | :--- | :--- | :--- |
# | **Zookeeper** | Coordinator | Manages the cluster state and leadership election. |
| **Kafka Broker** | The Backbone | Handles the event stream (`flodock.events`). |
| **Relay** | The Pump | Polls Postgres (`system_outbox`) and pushes to Kafka. |
| **Consumer** | The Viewer | Debug tool to see events flowing in real-time. |

---

## 🚀 Quick Start (Windows)

### 1. Install
Downloads and configures Kafka 3.6.1 automatically.
```powershell
# From project root
python backend/scripts/kafka/install.py
2. Start the Cluster
Launches Zookeeper and Kafka in separate windows. Note: Uses "Direct Boot" mode to bypass Windows path length limits.

PowerShell

python backend/scripts/kafka/run_cluster.py
3. Start the Data Pump (Relay)
Connects the Database to the Message Bus.

PowerShell

python backend/app/core/kernel/relay.py
4. Watch Events (Consumer)
Verifies that messages are arriving.

PowerShell

python backend/scripts/kafka/consume.py
🛠️ Troubleshooting
"Input line is too long"
This script uses a Wildcard Classpath (libs\*) to fix this Windows-specific bug. If you see this error, ensure you are running run_cluster.py and not the batch files directly.

"Connection Refused"
Ensure Zookeeper started first (Window 1).

Ensure Kafka started second (Window 2).

Wait 10-15 seconds for the cluster to stabilize.

"ModuleNotFoundError: No module named 'aiokafka'"
Sync your environment:

PowerShell

pip install -r backend/requirements.txt

