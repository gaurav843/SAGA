# FILEPATH: backend/scripts/kafka/run_cluster.py
# @file: Nervous System Launcher (Blocking Mode v2)
# @role: 🚀 Runtime Execution
# @author: The Engineer
# @description: Starts Zookeeper or Kafka in the CURRENT process.
# Fixes: Regex Escape Warning.

import os
import sys
import subprocess
import argparse

def get_paths():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    backend_root = os.path.dirname(os.path.dirname(script_dir))
    infra_dir = os.path.join(backend_root, "infrastructure")
    return infra_dir

def find_java_home(infra_dir):
    java_root = os.path.join(infra_dir, "java")
    if not os.path.exists(java_root):
        return None
    for name in os.listdir(java_root):
        path = os.path.join(java_root, name)
        if os.path.isdir(path) and os.path.exists(os.path.join(path, "bin", "java.exe")):
            return path
    return None

def run_service_blocking(title, kafka_dir, main_class, config_rel, java_home, memory_opts):
    """
    Runs the service in the CURRENT process.
    """
    java_bin = os.path.join(java_home, "bin")
    system_root = os.environ.get("SystemRoot", r"C:\Windows")
    
    # Minimal Path + Wbem
    safe_path = f"{java_bin};{system_root}\\System32;{system_root};{system_root}\\System32\\Wbem"
    
    env = os.environ.copy()
    env["JAVA_HOME"] = java_home
    env["PATH"] = safe_path
    
    # Construct Command
    cmd = [
        os.path.join(java_bin, "java"),
        "-server", 
        "-XX:+UseG1GC",
        f"-Dlog4j.configuration=file:config/log4j.properties",
        # FIX: Use raw string for Windows wildcard path
        "-cp", r"libs\*", 
        main_class,
        config_rel
    ]
    
    for opt in memory_opts.split():
        cmd.insert(1, opt)

    print(f"🚀 [BLOCKING] Starting {title}...")
    print(f"📂 CWD: {kafka_dir}")
    print("-" * 40)
    
    try:
        subprocess.run(cmd, cwd=kafka_dir, env=env, check=True)
    except KeyboardInterrupt:
        print(f"\n🛑 {title} Stopped by User.")
    except subprocess.CalledProcessError as e:
        print(f"\n❌ {title} CRASHED with code {e.returncode}.")
        sys.exit(e.returncode)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--service", choices=["zookeeper", "kafka"], required=True, help="Service to run")
    args = parser.parse_args()

    infra_dir = get_paths()
    kafka_dir = os.path.join(infra_dir, "kafka")
    
    java_home = find_java_home(infra_dir)
    if not java_home:
        print("❌ Java not found in infrastructure/java")
        sys.exit(1)

    if args.service == "zookeeper":
        run_service_blocking(
            "ZOOKEEPER",
            kafka_dir,
            "org.apache.zookeeper.server.quorum.QuorumPeerMain",
            r"config\zookeeper.properties",
            java_home,
            "-Xmx512M -Xms512M"
        )
    
    elif args.service == "kafka":
        run_service_blocking(
            "KAFKA-BROKER",
            kafka_dir,
            "kafka.Kafka",
            r"config\server.properties",
            java_home,
            "-Xmx1G -Xms1G"
        )

if __name__ == "__main__":
    main()
