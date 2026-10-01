chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "SEND_STATUS") {
        fetch(`http://127.0.0.1:15000/${request.status}`)
            .then(res => console.log('Servidor respondeu com sucesso'))
            .catch(err => console.log('Erro no background:', err));
    }
});
