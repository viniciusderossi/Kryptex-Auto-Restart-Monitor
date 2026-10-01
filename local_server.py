import os
import subprocess
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

os.system('color')

def find_kryptex():
    paths = [
        os.path.join(os.environ.get("LOCALAPPDATA", ""), "Programs", "kryptex", "Kryptex.exe"),
        os.path.join(os.environ.get("LOCALAPPDATA", ""), "kryptex", "Kryptex.exe"),
        r"C:\Program Files\Kryptex\Kryptex.exe",
        r"C:\Program Files (x86)\Kryptex\Kryptex.exe"
    ]
    for p in paths:
        if os.path.exists(p):
            return p
    # Fallback in case directory changes
    return r"C:\Program Files\Kryptex\Kryptex.exe"

KRYPTEX_EXE_PATH = find_kryptex()

# Control Variable (Cooldown)
last_restart = 0

class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        global last_restart
        
        # CORS Headers to allow requests from Chrome extension
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        
        if self.path == '/restart':
            current_time = time.time()
            # 10 minute cooldown (600 seconds)
            if current_time - last_restart < 600:
                print(f"[{time.strftime('%H:%M:%S')}] \033[93mRestart ignored. Cooldown active (10 minutes).\033[0m")
                self.wfile.write(b"Cooldown active. Restart ignored.")
                return

            last_restart = current_time
            print(f"[{time.strftime('%H:%M:%S')}] \033[91mCRITICAL ALERT RECEIVED! Machine offline or crashed. Executing hard restart...\033[0m")
            
            try:
                # 1. Total aggressive termination of Kryptex using WMI in PowerShell
                # This guarantees that frozen processes or invisible background services are destroyed
                print(f"[{time.strftime('%H:%M:%S')}] Killing all Kryptex and miner processes...")
                kill_cmd = 'powershell -Command "Get-WmiObject Win32_Process | Where-Object { $_.Name -like \'*Kryptex*\' -or $_.Name -like \'*miner*\' -or $_.Name -like \'*srb*\' } | ForEach-Object { $_.Terminate() }"'
                subprocess.run(kill_cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                
                # 2. Wait a few seconds for memory to clear completely
                time.sleep(5)
                
                if os.path.exists(KRYPTEX_EXE_PATH):
                    # TOTAL SHIELDING against ugly Kryptex log messages:
                    # Redirects garbage (stderr and stdout) to a black hole (DEVNULL)
                    DETACHED_PROCESS = 0x00000008
                    subprocess.Popen(
                        [KRYPTEX_EXE_PATH], 
                        creationflags=DETACHED_PROCESS,
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                        stdin=subprocess.DEVNULL
                    )
                    print(f"[{time.strftime('%H:%M:%S')}] \033[92mKryptex successfully reopened and completely shielded!\033[0m\n")
                else:
                    print(f"[{time.strftime('%H:%M:%S')}] ERROR: Could not find Kryptex at path {KRYPTEX_EXE_PATH}\n")
            
            except Exception as e:
                print(f"[{time.strftime('%H:%M:%S')}] Error while trying to restart: {e}\n")
            
            self.wfile.write(b"Restart Command Executed!")

        elif self.path == '/online':
            # Simple heartbeat from extension
            print(f"[{time.strftime('%H:%M:%S')}] \033[92mMachine OK and mining.\033[0m", end='\r')
            self.wfile.write(b"Status OK")

def run(server_class=HTTPServer, handler_class=RequestHandler, port=15000):
    server_address = ('127.0.0.1', port)
    httpd = server_class(server_address, handler_class)
    print(f"\033[96m==========================================================")
    print(f"  KRYPTEX WATCHDOG SERVER RUNNING ON PORT {port}")
    print(f"  WAITING FOR EXTENSION ALERTS...")
    print(f"==========================================================\033[0m\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\033[91mServer stopped by user.\033[0m")
        httpd.server_close()

if __name__ == '__main__':
    run()
