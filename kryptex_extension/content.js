chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_MACHINES") {
        let possibleNames = new Set();
        
        // Estratégia 1: Procurar os links com /remote
        document.querySelectorAll('a[href*="/remote"]').forEach(link => {
            let name = link.innerText.trim();
            if (name && name.length > 2) possibleNames.add(name);
        });

        // Estratégia 2: Heurística visual da tabela
        if (possibleNames.size === 0) {
            const allContainers = document.querySelectorAll('tr, div');
            allContainers.forEach(el => {
                let txt = el.innerText || "";
                if (txt.length > 10 && txt.length < 300) {
                    if (txt.includes("R$") || txt.includes("°C") || txt.includes(" MH/s")) {
                        let lower = txt.toLowerCase();
                        if (!lower.includes("saldo") && !lower.includes("pesquisar") && !lower.includes("total")) {
                            let lines = txt.split('\n').map(l => l.trim()).filter(l => l.length >= 3); // Ignora textos de 1 ou 2 letras (ex: 'd', 'x1', 'v')
                            for (let line of lines) {
                                let isNumbersOrSymbols = /^[\d\s\-\.\,R\$°cWMHskhx/·]+$/i.test(line);
                                let isStopword = ['online', 'offline', 'computadores', 'rentabilidade', 'leituras', 'dispositivos', 'mês', 'mes', 'dia', 'hora', 'cpu', 'gpu', 'tudo', 'pool', 'pesquisar', 'mostrar', 'hardware', 'trabalhadores', 'hashrate', 'minerador', 'nenhum'].includes(line.toLowerCase().split(' ')[0]);
                                
                                if (!isNumbersOrSymbols && !isStopword && line.length >= 3 && line.length <= 25) {
                                    // Adicional: O nome do PC normalmente não contém a barra / do R$/mês
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
    // Puxa o nome da máquina configurado pelo usuário na extensão (ou usa PCVinicius por padrão)
    chrome.storage.sync.get(['pcName'], (result) => {
        const PC_NAME = result.pcName || "PCVinicius";
        
        const url = window.location.href.toLowerCase();
        const bodyText = document.body.innerText.toLowerCase();
        
        let isOffline = false;
        let rowText = "";
        let rowHTML = "";
        
        // Busca a linha exata onde a máquina escolhida está escrita
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let n;
        while (n = walker.nextNode()) {
            if (n.nodeValue.includes(PC_NAME)) {
                let parent = n.parentNode;
                while(parent && parent !== document.body) {
                    if (parent.tagName === 'TR' || parent.className.includes('row') || parent.className.includes('flex')) {
                        rowText = parent.innerText.toLowerCase();
                        rowHTML = parent.innerHTML.toLowerCase();
                        break;
                    }
                    parent = parent.parentNode;
                }
                break;
            }
        }

        if (!rowHTML) {
            console.log(`[KRYPTEX MONITOR] Nome '${PC_NAME}' não encontrado na tela. Verifique se o nome digitado na extensão está correto.`);
            return;
        }

        // LÓGICA DO TRIÂNGULO DE EXCLAMAÇÃO
        if (rowHTML.includes("warning") || 
            rowHTML.includes("error") || 
            rowHTML.includes("danger") || 
            rowHTML.includes("alert") || 
            rowHTML.includes("text-red") || 
            rowHTML.includes("bg-red") || 
            rowHTML.includes("fill-red") ||
            rowHTML.includes("color-red") ||
            (rowHTML.includes("fill=\"#") && rowHTML.includes("svg"))) { 
            
            // Checa se os ganhos sumiram (estado real de crash)
            if (!rowText.includes("r$") && !rowText.includes("°c")) {
                isOffline = true;
                console.log(`[KRYPTEX MONITOR] Triângulo de erro DETECTADO no PC: ${PC_NAME}!`);
            }
        }

        // AÇÃO
        if (isOffline) {
            console.log(`[KRYPTEX MONITOR] STATUS: OFFLINE! Avisando o servidor local...`);
            chrome.runtime.sendMessage({ action: "SEND_STATUS", status: "restart" });
        } else {
            console.log(`[KRYPTEX MONITOR] STATUS: ONLINE e minerando (${PC_NAME}).`);
            chrome.runtime.sendMessage({ action: "SEND_STATUS", status: "online" });
        }
    });
}

// Recarrega a página automaticamente a cada 5 minutos
function ativarAutoReload() {
    const meta = document.createElement('meta');
    meta.httpEquiv = "refresh";
    meta.content = "300";
    document.getElementsByTagName('head')[0].appendChild(meta);
    console.log("[KRYPTEX MONITOR] Auto-Reload a cada 5 minutos ativado!");
}

// Aguarda 3 segundos para a página carregar a primeira vez
setTimeout(() => {
    verificarStatus();
    ativarAutoReload();
}, 3000);

// Varredura a cada 1 minuto
setInterval(verificarStatus, 60000);
