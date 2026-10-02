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
                    if (txt.includes("$") || txt.includes("°C") || txt.includes(" MH/s") || txt.includes("R$")) {
                        let lower = txt.toLowerCase();
                        if (!lower.includes("balance") && !lower.includes("search") && !lower.includes("total")) {
                            let lines = txt.split('\n').map(l => l.trim()).filter(l => l.length >= 3);
                            for (let line of lines) {
                                let isNumbersOrSymbols = /^[\d\s\-\.\,\$°cWMHskhx/·R]+$/i.test(line);
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
        
        let linhas = document.querySelectorAll('.row, tr, [class*="flex"], [class*="grid"], [class*="card"]');
        let achouProblema = false;
        let achouPC = false;

        linhas.forEach(linha => {
            let textoLinha = linha.innerText || "";
            if (textoLinha.toLowerCase().includes(PC_NAME.toLowerCase())) {
                achouPC = true;
                let htmlLinha = linha.innerHTML.toLowerCase();
                
                if (htmlLinha.includes("warning") || htmlLinha.includes("error") || htmlLinha.includes("danger") || htmlLinha.includes("text-red") || htmlLinha.includes("bg-red") || htmlLinha.includes("fill-red")) {
                    
                    if (textoLinha.includes('$ 0.00') || textoLinha.includes('$0.00') || textoLinha.includes('R$ 0,00') || (!textoLinha.toLowerCase().includes('$') && !textoLinha.toLowerCase().includes('r$'))) {
                        achouProblema = true;
                    }
                }
            }
        });

        if (!achouPC) {
            console.log(`[KRYPTEX MONITOR] PC '${PC_NAME}' not found on screen.`);
            return;
        }

        if (achouProblema) {
            console.log(`[KRYPTEX MONITOR] STATUS: OFFLINE! Warning local server...`);
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
    meta.content = "300";
    document.getElementsByTagName('head')[0].appendChild(meta);
    console.log("[KRYPTEX MONITOR] 5-minute Auto-Reload activated!");
}

setTimeout(() => {
    verificarStatus();
    ativarAutoReload();
}, 3000);

setInterval(verificarStatus, 60000);
