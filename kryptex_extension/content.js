chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_MACHINES") {
        let possibleNames = new Set();
        
        document.querySelectorAll('a[href*="/remote"]').forEach(link => {
            let name = link.innerText.trim();
            if (name && name.length > 2) possibleNames.add(name);
        });

        if (possibleNames.size === 0) {
            const allContainers = document.querySelectorAll('tr, div');
            allContainers.forEach(el => {
                let txt = el.innerText || "";
                if (txt.length > 10 && txt.length < 300) {
                    if (txt.includes("$") || txt.includes("R$") || txt.includes("°C") || txt.includes(" MH/s")) {
                        let lower = txt.toLowerCase();
                        if (!lower.includes("balance") && !lower.includes("search") && !lower.includes("total")) {
                            let lines = txt.split('\n').map(l => l.trim()).filter(l => l.length >= 3);
                            for (let line of lines) {
                                let isNumbersOrSymbols = /^[\d\s\-\.\,\$R°cWMHskhx/]+$/i.test(line);
                                let isStopword = ['online', 'offline', 'computers', 'profitability', 'readings', 'devices', 'month', 'day', 'hour', 'cpu', 'gpu', 'all', 'pool', 'search', 'show', 'hardware', 'workers', 'hashrate', 'miner', 'none'].includes(line.toLowerCase().split(' ')[0]);
                                
                                if (!isNumbersOrSymbols && !isStopword && line.length >= 3 && line.length <= 25) {
                                    if (!line.includes("/")) {
                                        possibleNames.add(line);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            });
        }
        sendResponse({machines: Array.from(possibleNames)});
    }
    return true; 
});

function verificarStatus() {
    chrome.storage.sync.get(['pcName'], (result) => {
        const PC_NAME = result.pcName || "PCVinicius";
        
        let achouProblema = false;
        let achouPC = false;
        let isCalculating = false;
        let pcRegex = new RegExp("\\b" + PC_NAME + "\\b", "i");
        
        let nameNodes = Array.from(document.querySelectorAll('*')).filter(el => {
            return el.children.length === 0 && pcRegex.test(el.innerText || el.textContent || "");
        });

        if (nameNodes.length > 0) {
            achouPC = true;
            let temDinheiro = false;
            let temErroOuvido = false;
            
            nameNodes.forEach(node => {
                let current = node;
                let bestContainer = current;
                
                while (current && current.innerText && current.innerText.length < 150 && current.tagName !== 'BODY') {
                    bestContainer = current;
                    current = current.parentElement;
                }
                
                let txt = bestContainer.innerText || "";
                let htmlStr = bestContainer.innerHTML.toLowerCase();
                let lower = txt.toLowerCase();
                
                if (lower.includes("calculando") || lower.includes("calculating")) {
                    isCalculating = true;
                }
                
                if (htmlStr.includes("danger") || htmlStr.includes("error") || htmlStr.includes("red") || htmlStr.includes("offline") || htmlStr.includes("alert")) {
                    temErroOuvido = true;
                }
                
                if (txt.includes("R$") || txt.includes("$")) {
                    if (!txt.includes("R$ 0,00") && !txt.includes("$0.00") && !txt.includes("$ 0.00")) {
                        temDinheiro = true;
                    }
                }
            });
            
            if (temErroOuvido) {
                achouProblema = true;
            } else if (!temDinheiro && !isCalculating) {
                achouProblema = true;
            }
        }

        if (!achouPC) {
            console.log(`[KRYPTEX MONITOR] PC '${PC_NAME}' not found on screen.`);
            chrome.runtime.sendMessage({ action: "SEND_STATUS", status: "notfound" });
            return;
        }

        if (isCalculating) {
            console.log(`[KRYPTEX MONITOR] PC '${PC_NAME}' is calculating. Waiting for next cycle...`);
            return;
        }

        if (achouProblema) {
            console.log(`[KRYPTEX MONITOR] STATUS: OFFLINE! Warning Local Server...`);
            chrome.runtime.sendMessage({ action: "SEND_STATUS", status: "restart" });
        } else {
            console.log(`[KRYPTEX MONITOR] STATUS: ONLINE and mining (${PC_NAME}).`);
            chrome.runtime.sendMessage({ action: "SEND_STATUS", status: "online" });
        }
    });
}

function ativarAutoReload() {
    const meta = document.createElement('meta');
    meta.httpEquiv = "refresh";
    meta.content = "120";
    document.getElementsByTagName('head')[0].appendChild(meta);
    console.log("[KRYPTEX MONITOR] Auto-Reload every 2 minutes activated!");
}

setTimeout(() => {
    verificarStatus();
    ativarAutoReload();
}, 3000);

setInterval(verificarStatus, 60000);
