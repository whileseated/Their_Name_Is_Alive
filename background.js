chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.actorUrl) {
        console.log(`Fetching actor page: ${request.actorUrl}`);

        fetch(request.actorUrl)
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, "text/html");

                // Find the infobox table
                const infobox = doc.querySelector(".infobox.biography.vcard");
                if (!infobox) {
                    console.warn("No infobox found on the page.");
                    sendResponse({ status: "unknown" });
                    return;
                }

                console.log("Infobox found, searching for Born and Died rows...");

                // Look for the Born row
                const bornRow = infobox.querySelector("tr:has(th.infobox-label:contains('Born'))");
                const diedRow = infobox.querySelector("tr:has(th.infobox-label:contains('Died'))");

                if (diedRow) {
                    console.log("Died row found - actor is deceased.");
                    sendResponse({ status: "deceased" });
                } else if (bornRow) {
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
