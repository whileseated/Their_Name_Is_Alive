console.log("Wikipedia Cast Checker Loaded");

// Step 1: Locate the Cast section
function findCastSection() {
    console.log("Searching for Cast or Personnel section...");

    // Define the sections we want to look for
    const sectionIds = ["Cast", "Personnel"];
    let contentContainer = null;

    // Try each section type
    for (const sectionId of sectionIds) {
        const header = document.querySelector(`h2 span#${sectionId}, h2#${sectionId}`);
        if (header) {
            console.log(`Found ${sectionId} header:`, header.textContent);
            let sibling = header.closest('h2').parentElement.nextElementSibling;
            
            while (sibling) {
                // Check for the original cases
                if (sibling.classList.contains("div-col") || sibling.tagName === 'UL') {
                    contentContainer = sibling;
                    break;
                }
                // New case: check for UL nested within other divs
                const nestedUL = sibling.querySelector('ul');
                if (nestedUL) {
                    contentContainer = nestedUL;
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

// Add this new function
function processAdditionalPersonnel() {
    console.log("Looking for additional Personnel sections...");
    
    // Find the Personnel section
    const personnelHeader = document.querySelector('h2 span#Personnel');
    if (!personnelHeader) return;
    
    // Get all ULs that follow the Personnel h2 but come before the next h2
    const allULs = [];
    let currentElement = personnelHeader.closest('h2').parentElement.nextElementSibling;
    
    // First, collect all ULs until next h2
    while (currentElement && !currentElement.querySelector('h2')) {
        if (currentElement.tagName === 'UL') {
            allULs.push(currentElement);
        }
        currentElement = currentElement.nextElementSibling;
    }
    
    // Skip the first UL (already processed) and handle the rest
    for (let i = 1; i < allULs.length; i++) {
        const ul = allULs[i];
        const actorLinks = getActorLinks(ul);
        console.log(`Processing additional UL with ${actorLinks.length} links`);
        
        actorLinks.forEach(actor => {
            // Only process if not already marked
            if (!actor.element.previousSibling || 
                (!actor.element.previousSibling.textContent.includes('✅') && 
                 !actor.element.previousSibling.textContent.includes('❌'))) {
                chrome.runtime.sendMessage({ actorUrl: actor.url }, (response) => {
                    if (chrome.runtime.lastError) return;
                    if (response) {
                        if (response.status === "alive") {
                            actor.element.insertAdjacentHTML("beforebegin", "✅ ");
                        } else if (response.status === "deceased") {
                            actor.element.insertAdjacentHTML("beforebegin", "❌ ");
                        }
                    }
                });
            }
        });
    }
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
    
    // Add this single line at the end
    processAdditionalPersonnel();
}

// Start the process
console.log("Initializing Cast Checker...");
processCastSection();
console.log("Cast Checker script execution complete.");
