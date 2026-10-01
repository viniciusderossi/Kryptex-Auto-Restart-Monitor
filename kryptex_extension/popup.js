document.addEventListener('DOMContentLoaded', () => {
    const inputName = document.getElementById('pcName');
    const btnSave = document.getElementById('saveBtn');
    const status = document.getElementById('status');
    const btnDonate = document.getElementById('donateBtn');
    const donateArea = document.getElementById('donateArea');
    const btnLoadMachines = document.getElementById('loadMachinesBtn');
    const pcList = document.getElementById('pcList');

    // Carrega o nome atual caso exista
    chrome.storage.sync.get(['kryptexPcName'], (result) => {
        if (result.kryptexPcName) {
            inputName.value = result.kryptexPcName;
        }
    });

    // Salvar configuração
    btnSave.addEventListener('click', () => {
        const name = inputName.value.trim();
        if (name) {
            chrome.storage.sync.set({ kryptexPcName: name }, () => {
                status.innerText = "Saved successfully!";
                status.style.color = '#10b981';
                status.style.display = 'block';
                setTimeout(() => status.style.display = 'none', 2500);
            });
        }
    });

    // Mostrar/Esconder Área de Doação
    btnDonate.addEventListener('click', () => {
        if (donateArea.style.display === 'block') {
            donateArea.style.display = 'none';
        } else {
            donateArea.style.display = 'block';
        }
    });

    // Copiar endereços de carteira
    const copyButtons = document.querySelectorAll('.copy-btn');
    copyButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.target.getAttribute('data-target');
            const inputEl = document.getElementById(targetId);
            
            navigator.clipboard.writeText(inputEl.value).then(() => {
                const originalText = e.target.innerText;
                e.target.innerText = "Copied!";
                e.target.style.backgroundColor = "#10b981";
                setTimeout(() => {
                    e.target.innerText = originalText;
                    e.target.style.backgroundColor = "#4b5563";
                }, 2000);
            });
        });
    });

    // Carregar máquinas automaticamente
    btnLoadMachines.addEventListener('click', () => {
        // Envia mensagem para o script da página ativa
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (!tabs[0].url.includes("kryptex.com")) {
                status.style.color = '#ef4444'; // vermelho
                status.innerText = "Open the Kryptex page first!";
                status.style.display = 'block';
                setTimeout(() => status.style.display = 'none', 3000);
                return;
            }

            chrome.tabs.sendMessage(tabs[0].id, {action: "GET_MACHINES"}, function(response) {
                if (response && response.machines && response.machines.length > 0) {
                    // Limpa a lista atual
                    pcList.innerHTML = '';
                    // Preenche com os resultados
                    response.machines.forEach(machine => {
                        let option = document.createElement('option');
                        option.value = machine;
                        pcList.appendChild(option);
                    });
                    
                    status.style.color = '#10b981'; // verde
                    status.innerText = `${response.machines.length} machines found!`;
                    status.style.display = 'block';
                    setTimeout(() => status.style.display = 'none', 3000);
                } else {
                    status.style.color = '#ef4444'; // vermelho
                    status.innerText = "No machines found on screen.";
                    status.style.display = 'block';
                    setTimeout(() => status.style.display = 'none', 3000);
                }
            });
        });
    });
});
