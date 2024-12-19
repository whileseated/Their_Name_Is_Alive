chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.actorUrl) {
        console.log(`Fetching actor page: ${request.actorUrl}`);

        fetch(request.actorUrl)
            .then(response => response.text())
            .then(html => {
                // Use string parsing instead of DOM manipulation
                const infoboxMatch = html.match(/<table class="infobox biography vcard"[\s\S]*?<\/table>/);
                if (!infoboxMatch) {
                    console.warn("No infobox found on the page.");
                    sendResponse({ status: "unknown" });
                    return;
                }

                const infoboxHtml = infoboxMatch[0];
                console.log("Infobox found, searching for Born and Died rows...");

                // Simple string matching for Born and Died
                const hasBorn = /<th[^>]*>Born<\/th>/i.test(infoboxHtml);
                const hasDied = /<th[^>]*>Died<\/th>/i.test(infoboxHtml);

                if (hasDied) {
                    console.log("Died row found - actor is deceased.");
                    sendResponse({ status: "deceased" });
                } else if (hasBorn) {
                    console.log("Born row found, but no Died row - actor is alive.");
                    sendResponse({ status: "alive" });
                } else {
                    console.warn("Neither Born nor Died row found.");
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
