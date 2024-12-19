chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.actorUrl) {
        console.log(`Fetching actor page: ${request.actorUrl}`);

        fetch(request.actorUrl)
            .then(response => response.text())
            .then(html => {
                // Use string parsing instead of DOM manipulation
                const infoboxMatch = html.match(/<table class="infobox[^"]*vcard[^"]*"[\s\S]*?<\/table>/);
                if (!infoboxMatch) {
                    console.warn("No infobox found on the page. HTML preview:", html.substring(0, 500));
                    sendResponse({ status: "unknown" });
                    return;
                }

                const infoboxHtml = infoboxMatch[0];
                console.log("Page:", request.actorUrl);
                console.log("Infobox HTML (first 500 chars):", infoboxHtml.substring(0, 500));

                // Look for variations of Born/Died headers with more flexible matching
                const bornVariations = infoboxHtml.match(/<th[^>]*class="infobox-label"[^>]*>\s*Born\s*<\/th>/i);
                const diedVariations = infoboxHtml.match(/<th[^>]*class="infobox-label"[^>]*>\s*Died\s*<\/th>/i);

                console.log("Born variations found:", bornVariations ? bornVariations[0] : "none");
                console.log("Died variations found:", diedVariations ? diedVariations[0] : "none");

                if (diedVariations) {
                    console.log("Died row found - person is deceased.");
                    sendResponse({ status: "deceased" });
                } else if (bornVariations) {
                    console.log("Born row found, but no Died row - person is alive.");
                    sendResponse({ status: "alive" });
                } else {
                    console.warn("Neither Born nor Died row found in infobox.");
                    sendResponse({ status: "unknown" });
                }
            })
            .catch(err => {
                console.error("Error fetching page:", err);
                sendResponse({ status: "error" });
            });

        return true; // Keeps the message channel open for async response
    }
});
