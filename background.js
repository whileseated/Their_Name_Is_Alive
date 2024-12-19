chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.actorUrl) {
        console.log(`Fetching actor page: ${request.actorUrl}`);

        fetch(request.actorUrl)
            .then(response => response.text())
            .then(html => {
                // First try the infobox method
                const infoboxMatch = html.match(/<table class="infobox[^"]*vcard[^"]*"[\s\S]*?<\/table>/);
                if (infoboxMatch) {
                    const infoboxHtml = infoboxMatch[0];
                    console.log("Infobox found, searching for Born and Died rows...");

                    const bornVariations = infoboxHtml.match(/<th[^>]*class="infobox-label"[^>]*>\s*Born\s*<\/th>/i);
                    const diedVariations = infoboxHtml.match(/<th[^>]*class="infobox-label"[^>]*>\s*Died\s*<\/th>/i);

                    if (diedVariations) {
                        console.log("Died row found in infobox - person is deceased.");
                        sendResponse({ status: "deceased" });
                        return;
                    } else if (bornVariations) {
                        console.log("Born row found in infobox, but no Died row - person is alive.");
                        sendResponse({ status: "alive" });
                        return;
                    }
                }

                // If no infobox or no Born/Died info found, try the first paragraph method
                console.log("Checking first paragraph for birth/death dates...");
                const firstParaMatch = html.match(/<p><b>[^<]+<\/b>\s*\([^<]+\)/);
                
                if (firstParaMatch) {
                    const firstPara = firstParaMatch[0];
                    console.log("First paragraph start:", firstPara);
                    
                    // Look for two years within the parentheses
                    const yearsPattern = /\(.*?\b(19|20)\d{2}\b.*?[-–—].*?\b(19|20)\d{2}\b.*?\)/;
                    const hasYears = yearsPattern.test(firstPara);
                    
                    if (hasYears) {
                        console.log("Found birth and death years in first paragraph");
                        sendResponse({ status: "deceased" });
                        return;
                    }
                }

                console.warn("No definitive life status found.");
                sendResponse({ status: "unknown" });
            })
            .catch(err => {
                console.error("Error fetching page:", err);
                sendResponse({ status: "error" });
            });

        return true; // Keeps the message channel open for async response
    }
});
