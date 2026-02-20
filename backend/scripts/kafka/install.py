# FILEPATH: backend/scripts/kafka/install.py
# @file: Universal Kafka Installer (Final Python Edition)
# @role: ⚙️ Infrastructure Automation
# @description: Downloads, Extracts, and Configures Kafka entirely in Python.
# @invariant: Works on Windows/Linux/Mac without external tools.

import os
import sys
import shutil
import urllib.request
import tarfile
import time

# --- CONFIGURATION ---
KAFKA_VERSION = "3.6.1"
SCALA_VERSION = "2.13"
KAFKA_URL = f"https://archive.apache.org/dist/kafka/{KAFKA_VERSION}/kafka_{SCALA_VERSION}-{KAFKA_VERSION}.tgz"

def get_paths():
    # resolve relative to this script: backend/scripts/kafka/
    script_dir = os.path.dirname(os.path.abspath(__file__))
    backend_root = os.path.dirname(os.path.dirname(script_dir))
    infra_dir = os.path.join(backend_root, "infrastructure")
    return infra_dir

def download_progress(count, block_size, total_size):
    if total_size > 0:
        percent = int(count * block_size * 100 / total_size)
        sys.stdout.write(f"\r⬇️  Downloading Kafka... {percent}%")
        sys.stdout.flush()

def force_remove(path):
    """
    Retries deletion to handle Windows file locks.
    """
    if not os.path.exists(path):
        return True
        
    print(f"   🗑️ Cleaning up {path}...")
    for i in range(5): # 5 retries
        try:
            shutil.rmtree(path)
            return True
        except Exception as e:
            print(f"      ⚠️ Attempt {i+1} failed: {e}")
            time.sleep(1) # Wait for lock to release
            
    print("   ❌ COULD NOT DELETE FOLDER. PLEASE CLOSE OTHER TERMINALS.")
    return False

def install():
    infra_dir = get_paths()
    kafka_dir = os.path.join(infra_dir, "kafka")
    zip_path = os.path.join(infra_dir, "kafka.tgz")
    
    print(f"🦖 [Flodock] NERVOUS SYSTEM INSTALLER")
    print(f"📂 Infrastructure: {infra_dir}")
    print("-" * 40)

    # 1. PREPARE DIR
    if not os.path.exists(infra_dir):
        os.makedirs(infra_dir)

    # 2. CHECK EXISTING
    if os.path.exists(os.path.join(kafka_dir, "bin", "windows", "kafka-server-start.bat")):
        print("✅ Kafka is already installed.")
    else:
        # 3. DOWNLOAD
        if not os.path.exists(zip_path):
            print(f"🔗 Source: {KAFKA_URL}")
            try:
                urllib.request.urlretrieve(KAFKA_URL, zip_path, download_progress)
                print("\n✅ Download complete.")
            except Exception as e:
                print(f"\n❌ Download Failed: {e}")
                return

        # 4. EXTRACT
        print("📦 Extracting archive (this may take a minute)...")
        try:
            with tarfile.open(zip_path, "r:gz") as tar:
                # Python 3.12+ filter fix
                if sys.version_info >= (3, 12):
                    tar.extractall(path=infra_dir, filter='data')
                else:
                    tar.extractall(path=infra_dir)
            
            # 5. RENAME & MOVE
            extracted_name = f"kafka_{SCALA_VERSION}-{KAFKA_VERSION}"
            extracted_path = os.path.join(infra_dir, extracted_name)
            
            if not force_remove(kafka_dir):
                return
            
            print(f"   ➡️ Moving extracted folder to 'kafka'...")
            time.sleep(1) # Safety pause
            shutil.move(extracted_path, kafka_dir)
            print("✅ Extraction complete.")
            
            # Cleanup Zip
            try:
                os.remove(zip_path)
            except:
                pass
            
        except Exception as e:
            print(f"❌ Extraction Failed: {e}")
            print(f"   👉 Tip: Close any programs using '{infra_dir}' and try again.")
            return

    # 6. CONFIGURE
    print("⚙️  Patching Configuration...")
    try:
        server_prop = os.path.join(kafka_dir, "config", "server.properties")
        zookeeper_prop = os.path.join(kafka_dir, "config", "zookeeper.properties")
        
        # Paths must use forward slashes for Java on Windows
        log_dir = os.path.join(kafka_dir, "kafka-logs").replace("\\", "/")
        zk_data = os.path.join(kafka_dir, "zookeeper-data").replace("\\", "/")
        
        # Patch Server
        with open(server_prop, "r") as f: content = f.read()
        lines = content.splitlines()
        new_lines = []
        for line in lines:
            if line.startswith("log.dirs="):
                new_lines.append(f"log.dirs={log_dir}")
            else:
                new_lines.append(line)
        
        if "listeners=PLAINTEXT" not in content:
             new_lines.append("listeners=PLAINTEXT://localhost:9092")
             
        with open(server_prop, "w") as f: f.write("\n".join(new_lines) + "\n")

        # Patch Zookeeper
        with open(zookeeper_prop, "r") as f: content = f.read()
        lines = content.splitlines()
        new_lines = []
        for line in lines:
            if line.startswith("dataDir="):
                new_lines.append(f"dataDir={zk_data}")
            else:
                new_lines.append(line)
        with open(zookeeper_prop, "w") as f: f.write("\n".join(new_lines) + "\n")
        
        print("✅ Configuration patched.")

    except Exception as e:
        print(f"❌ Configuration Failed: {e}")
        return

    print("-" * 40)
    print("🎉 SUCCESS.")
    print("👉 To Start: python backend/scripts/kafka/run_cluster.py")

if __name__ == "__main__":
    install()

