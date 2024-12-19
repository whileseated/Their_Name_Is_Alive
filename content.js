console.log("Wikipedia Cast Checker Loaded");

// Step 1: Locate the Cast section
function findCastSection() {
    console.log("Searching for Cast or Personnel section...");

    // Define the sections we want to look for
    const sectionIds = ["Cast", "Personnel"];
    let contentContainer = null;

    // Try each section type
    for (const sectionId of sectionIds) {
        const header = document.querySelector(`h2#${sectionId}`);
        if (header) {
            console.log(`Found ${sectionId} header:`, header.textContent);

            // Look for the next div with class "div-col" OR the next ul element
            let sibling = header.parentElement.nextElementSibling;
            while (sibling) {
                if (sibling.classList.contains("div-col") || 
                    (sectionId === "Personnel" && sibling.tagName === "UL")) {
                    console.log(`Found ${sectionId} content container:`, sibling.outerHTML);
                    contentContainer = sibling;
                    break;
                }
                sibling = sibling.nextElementSibling;
            }
            
            if (contentContainer) break;
        }
    }

    if (!contentContainer) {
        console.warn("No Cast or Personnel section found on this page.");
    }
    return contentContainer;
}

// Step 2: Extract actor links
function getActorLinks(castSection) {
    console.log("Extracting actor links from the Cast/Personnel section...");
    const links = [];
    const isPersonnel = castSection.previousElementSibling?.querySelector('#Personnel');

    if (castSection) {
        const listItems = castSection.querySelectorAll("ul > li");
        console.log(`Found ${listItems.length} list items in the section.`);

        listItems.forEach(li => {
            const liText = li.textContent;
            // Find position of first dash (if any)
            const dashIndex = liText.search(/[-–—]/);
            
            // Get all anchors before the dash (or all if no dash)
            const anchors = Array.from(li.querySelectorAll("a[href^='/wiki/']"))
                .filter(anchor => {
                    if (dashIndex === -1) return true;
                    const anchorPos = liText.indexOf(anchor.textContent);
                    return anchorPos < dashIndex;
                });

            anchors.forEach(anchor => {
                console.log(`Valid person link found: ${anchor.textContent} -> ${anchor.getAttribute("href")}`);
                links.push({
                    name: anchor.textContent.trim(),
                    url: "https://en.wikipedia.org" + anchor.getAttribute("href"),
                    element: anchor
                });
            });
        });
    }

    console.log(`Total valid person links found: ${links.length}`);
    return links;
}

// Step 3: Send links to the background script
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
