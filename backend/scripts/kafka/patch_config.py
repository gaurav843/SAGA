# FILEPATH: backend/scripts/kafka/patch_config.py
# @file: Kafka Configuration Patcher
# @role: ⚙️ Configuration Manager
# @description: Updates server.properties with absolute Windows paths.

import os
import sys

def get_paths():
    # resolve relative to this script: ../../../infrastructure/kafka
    script_dir = os.path.dirname(os.path.abspath(__file__))
    backend_root = os.path.dirname(os.path.dirname(script_dir))
    infra_dir = os.path.join(backend_root, "infrastructure")
    kafka_dir = os.path.join(infra_dir, "kafka")
    return kafka_dir

def patch_file(path, updates):
    if not os.path.exists(path):
        print(f"❌ Config not found: {path}")
        return

    print(f"🔧 Patching {os.path.basename(path)}...")
    with open(path, "r") as f:
        lines = f.readlines()

    new_lines = []
    keys_updated = set()

    for line in lines:
        stripped = line.strip()
        updated = False
        for key, value in updates.items():
            if stripped.startswith(f"{key}="):
                new_lines.append(f"{key}={value}\n")
                keys_updated.add(key)
                updated = True
                break
        if not updated:
            new_lines.append(line)

    # Add missing keys
    for key, value in updates.items():
        if key not in keys_updated:
            new_lines.append(f"{key}={value}\n")

    with open(path, "w") as f:
        f.writelines(new_lines)
    print(f"   -> Success.")

def main():
    kafka_dir = get_paths()
    if not os.path.exists(kafka_dir):
        print(f"❌ Kafka directory not found at: {kafka_dir}")
        print("   Run setup.bat first.")
        sys.exit(1)

    # Define Paths
    server_prop = os.path.join(kafka_dir, "config", "server.properties")
    zookeeper_prop = os.path.join(kafka_dir, "config", "zookeeper.properties")
    
    # Define Data Directories (Force Forward Slashes for Java)
    log_dir = os.path.join(kafka_dir, "kafka-logs").replace("\\", "/")
    zookeeper_data = os.path.join(kafka_dir, "zookeeper-data").replace("\\", "/")

    # 1. Patch Server Properties
    patch_file(server_prop, {
        "log.dirs": log_dir,
        "listeners": "PLAINTEXT://localhost:9092"
    })

    # 2. Patch Zookeeper Properties
    patch_file(zookeeper_prop, {
        "dataDir": zookeeper_data
    })

    print("✅ Configuration Complete.")

if __name__ == "__main__":
    main()

