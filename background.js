chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.actorUrl) {
        fetch(request.actorUrl)
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, "text/html");
                const birthDate = doc.querySelector(".bday");
                const deathDate = doc.querySelector("th:contains('Died') ~ td");

                if (deathDate) {
                    sendResponse({ status: "deceased" });
                } else if (birthDate) {
                    sendResponse({ status: "alive" });
                } else {
                    sendResponse({ status: "unknown" });
                }
            })
            .catch(err => {
                console.error("Error fetching actor page:", err);
                sendResponse({ status: "error" });
            });
        return true; // Keeps the message channel open for async response
    }
});
