#!/usr/bin/env python3
"""
Start server and capture any errors
"""
import sys
import os
import signal
import time
import threading

# Change to backend directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("=" * 80)
print("Starting Server (will run for 10 seconds to check for errors)")
print("=" * 80)

try:
    from app.main import app
    import uvicorn
    
    # Create a config for uvicorn
    config = uvicorn.Config(
        app=app,
        host="127.0.0.1",
        port=8000,
        log_level="info"
    )
    
    server = uvicorn.Server(config)
    
    # Start server in a thread
    def run_server():
        try:
            server.run()
        except Exception as e:
            print(f"\n❌ Server error: {e}")
            import traceback
            traceback.print_exc()
    
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    
    # Wait a bit to see if there are startup errors
    print("\n⏳ Waiting for server to start...")
    time.sleep(5)
    
    # Check if server is running
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('127.0.0.1', 8000))
    sock.close()
    
    if result == 0:
        print("✅ Server started successfully on http://127.0.0.1:8000")
        print("✅ No startup errors detected!")
        print("\nServer is running. Press Ctrl+C to stop.")
        print("You can now test the APIs at http://127.0.0.1:8000/docs")
    else:
        print("⚠️  Server may not have started (port check failed)")
        print("Check the output above for any errors")
    
    # Keep running
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\nStopping server...")
        server.should_exit = True
        
except KeyboardInterrupt:
    print("\n\nStopped by user")
except Exception as e:
    print(f"\n❌ Error starting server: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

