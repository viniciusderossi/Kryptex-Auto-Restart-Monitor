# ⛏️ Kryptex Auto-Restart Monitor

A smart and 100% local (Open-Source) system created to monitor the status of your mining rigs on **Kryptex** and automatically restart the Windows application if the machine freezes, the miner stops, or the GPU crashes.

## 🚀 Fully Automatic Installation (Plug & Play)

The biggest advantage of this project is that you don't need any technical knowledge. **The script does everything by itself!**

### Requirements
* Google Chrome (or Brave/Edge)
* Windows OS
* *(No need to worry about installing Python! Our system detects if you don't have it and silently downloads and installs it for you on the very first click!)*

## ⚙️ How does it work?

The system consists of two parts that talk to each other:

1. **Google Chrome Extension:** Injected invisibly into the hardware page of your Kryptex dashboard. It automatically scans your computers every minute looking for error icons (red triangle) or zero profitability.
2. **Local Python Server:** Runs in a Windows CMD window. Upon receiving a failure alert from the extension, it uses the Windows `WMI` system with Administrator privileges to aggressively kill any frozen Kryptex process (`Kryptex.exe`, `KryptexService.exe`, `SRBMiner`, etc.) and completely restart the program with clean memory.

## 🔒 Privacy and Security

* **100% Local:** The extension DOES NOT communicate with the internet. Alerts are only sent to `http://127.0.0.1:15000` (your own computer).
* **No Sensitive Data:** The system only reads computer names and on-screen statuses. It DOES NOT have access to user passwords, wallets, or cookies.
* **Cooldown System:** Features a 10-minute safety timer after each restart to prevent infinite loops while Kryptex is benchmarking.

## 🛠️ Step-by-Step Guide

### Step 1: Configure the Chrome Extension
1. Download this repository and extract the folder to your PC.
2. Open Chrome and type in the address bar: `chrome://extensions/`
3. Enable **Developer mode** (top right corner).
4. Click on **Load unpacked** and select the `extensao_kryptex` folder.
5. Pin the extension to your toolbar, click on it, and set the computer you want to monitor. You can type the name manually or **click the blue button (🔄) for the extension to automatically scan and list all your available machines on the page!** Select the machine and click Save.

### Step 2: Start the Server
1. In the main folder, double-click the **`start_server.bat`** file.
2. It will ask for Administrator permissions (required to forcefully kill frozen Kryptex processes). Click **Yes**.
3. **If you don't have Python installed:** The script itself will silently download and install Python for you! It will only do this the very first time you open it, 100% automatically.
4. A black screen (terminal) will open waiting for information. **Keep it open!**

### Step 3: Monitoring
1. Access the Kryptex hardware dashboard in Chrome: `https://www.kryptex.com/en/hardware/computers`
2. Keep this tab open (it can be left in the background).
3. The extension will handle the rest and communicate with the local server whenever the PC freezes!

---

**⚠️ Tip for Total Automation:** If you want the script to start automatically with Windows (for cases of Blue Screens where the PC restarts on its own), press `Win + R`, type `shell:startup`, and create a Shortcut to `start_server.bat` inside that folder.

**Support the Project:** If this project saved you some lost nights of mining, consider supporting it using the button inside the extension! ☕
