console.log("Wikipedia Cast Checker Loaded");

// Step 1: Locate the Cast section using #Cast anchor or fallback
function findCastSection() {
    console.log("Searching for the Cast section...");

    // Try to directly access the Cast section via the id 'Cast'
    const castAnchor = document.getElementById("Cast");
    if (castAnchor) {
        console.log("Found #Cast section directly.");
        return castAnchor.parentElement.nextElementSibling;
    }

    // Fallback: Search through headers for "Cast"
    const headers = document.querySelectorAll("h2, h3");
    for (let header of headers) {
        if (/cast/i.test(header.textContent)) {
            console.log("Cast section found by header:", header.textContent);
            return header.nextElementSibling;
        }
    }

    console.warn("No Cast section found on this page.");
    return null;
}

// Step 2: Find actor links
function getActorLinks(castSection) {
    console.log("Extracting actor links from the Cast section...");
    const links = [];
    if (castSection) {
        const anchorTags = castSection.querySelectorAll("a[href^='/wiki/']");
        for (let anchor of anchorTags) {
            if (!anchor.href.includes("redlink")) { // Ignore red links (non-existing pages)
                links.push({
                    name: anchor.textContent,
                    url: "https://en.wikipedia.org" + anchor.getAttribute("href"),
                    element: anchor
                });
                console.log(`Actor link found: ${anchor.textContent} -> ${anchor.href}`);
            }
        }
    } else {
        console.warn("Cast section exists, but no links were found.");
    }
    console.log(`Total actor links found: ${links.length}`);
    return links;
}

// Step 3: Send links to background script
function processCastSection() {
    console.log("Processing the Cast section...");
    const castSection = findCastSection();
    if (castSection) {
        const actorLinks = getActorLinks(castSection);
        if (actorLinks.length === 0) {
            console.warn("No valid actor links found. Exiting.");
            return;
        }

        actorLinks.forEach(actor => {
            console.log(`Sending request to background script for: ${actor.name} (${actor.url})`);
            chrome.runtime.sendMessage({ actorUrl: actor.url }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error communicating with background script:", chrome.runtime.lastError.message);
                    return;
                }

                if (response) {
                    console.log(`Response for ${actor.name}:`, response);
                    if (response.status === "alive") {
                        actor.element.insertAdjacentHTML("beforebegin", "✅ ");
                        console.log(`Marked ${actor.name} as alive.`);
                    } else if (response.status === "deceased") {
                        actor.element.insertAdjacentHTML("beforebegin", "❌ ");
                        console.log(`Marked ${actor.name} as deceased.`);
                    } else {
                        console.warn(`No status found for ${actor.name}.`);
                    }
                } else {
                    console.warn(`No response received for ${actor.name}.`);
                }
            });
        });
    } else {
        console.warn("No Cast section found. Nothing to process.");
    }
}

// Start the process
console.log("Initializing Cast Checker...");
processCastSection();
console.log("Cast Checker script execution complete.");
