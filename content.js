console.log("Wikipedia Cast Checker Loaded");

// Step 1: Locate the Cast section
function findCastSection() {
    console.log("Searching for Cast or Personnel section...");

    const sectionIds = ["Cast", "Personnel"];
    let contentContainer = null;

    for (const sectionId of sectionIds) {
        const header = document.querySelector(`h2 span#${sectionId}, h2#${sectionId}`);
        if (header) {
            console.log(`Found ${sectionId} header:`, header.textContent);
            let sibling = header.closest('h2').parentElement.nextElementSibling;

            while (sibling) {
                if (sibling.classList.contains("div-col") || sibling.tagName === 'UL') {
                    contentContainer = sibling;
                    break;
                }
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

    if (!contentContainer) console.warn("No Cast or Personnel section found.");
    return contentContainer;
}

// Step 2: Extract actor links
function getActorLinks(listElement) {
    const links = new Set();
    
    function processListItem(li) {
        // Process direct anchors in this li
        const anchors = Array.from(li.querySelectorAll(":scope > a[href^='/wiki/']"));
        anchors.forEach(anchor => {
            if (!anchor.previousSibling || 
                (!anchor.previousSibling.textContent.includes('✅') &&
                 !anchor.previousSibling.textContent.includes('❌'))) {
                const url = "https://en.wikipedia.org" + anchor.getAttribute("href");
                if (!Array.from(links).some(link => link.url === url)) {
                    links.add({
                        name: anchor.textContent.trim(),
                        url: url,
                        element: anchor
                    });
                }
            }
        });

        // Process nested lists within this li - but only direct children
        const nestedLists = li.querySelectorAll(":scope > ul > li");
        nestedLists.forEach(nestedLi => processListItem(nestedLi));
    }
    
    // Start processing from top-level list items only
    const listItems = listElement.querySelectorAll(":scope > li");
    listItems.forEach(li => processListItem(li));

    return Array.from(links);
}

// Step 3: Process actor links asynchronously
async function processActorLinks(actorLinks) {
    for (const actor of actorLinks) {
        try {
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ actorUrl: actor.url }, (res) => {
                    if (chrome.runtime.lastError) reject(chrome.runtime.lastError.message);
                    else resolve(res);
                });
            });

            if (response?.status === "alive") {
                actor.element.insertAdjacentHTML("beforebegin", "✅ ");
                console.log(`Marked ${actor.name} as alive.`);
            } else if (response?.status === "deceased") {
                actor.element.insertAdjacentHTML("beforebegin", "❌ ");
                console.log(`Marked ${actor.name} as deceased.`);
            } else {
                console.warn(`No status found for ${actor.name}.`);
            }
        } catch (error) {
            console.error(`Error processing ${actor.name}:`, error);
        }
    }
}

// Step 4: Process Additional Personnel
async function processAdditionalPersonnel() {
    console.log("\n=== Starting Section Analysis ===");
    
    // Look for either Personnel or Cast sections
    const sectionHeader = document.querySelector('.mw-heading h2#Personnel, .mw-heading h2#Cast');
    const sectionType = sectionHeader?.id || 'unknown';
    console.log(`${sectionType} section found:`, !!sectionHeader);
    
    if (!sectionHeader) {
        console.log("No Personnel or Cast section found, skipping...");
        return;
    }

    // Start from the section's container div
    let currentElement = sectionHeader.closest('.mw-heading').nextElementSibling;
    const processedLinks = new Set(); // Track processed links by URL
    const allLists = new Set();
    let totalLinks = 0;
    let listCount = 0;

    try {
        // Find the next major section to determine where to stop
        let nextMajorSection = currentElement;
        while (nextMajorSection) {
            if (nextMajorSection.classList?.contains('mw-heading') && 
                nextMajorSection.classList?.contains('mw-heading2') &&
                nextMajorSection !== sectionHeader.closest('.mw-heading')) {
                break;
            }
            nextMajorSection = nextMajorSection.nextElementSibling;
        }

        // Function to recursively process elements and find lists
        function findLists(element) {
            if (!element) return;
            
            // Process this element if it's a list
            if (element.tagName === 'UL' || element.tagName === 'OL') {
                listCount++;
                allLists.add(element);
                // Only count links we haven't processed yet
                const links = element.querySelectorAll('a[href^="/wiki/"]');
                let newLinks = 0;
                links.forEach(link => {
                    const url = link.getAttribute('href');
                    if (!processedLinks.has(url)) {
                        processedLinks.add(url);
                        newLinks++;
                    }
                });
                totalLinks += newLinks;
                console.log(`Found ${element.tagName} list ${listCount} with ${newLinks} new wiki links`);
            }

            // Process child elements
            Array.from(element.children).forEach(child => {
                // Only process until we hit the next major section
                if (child !== nextMajorSection) {
                    findLists(child);
                }
            });
        }

        // Process everything between section header and next major section
        while (currentElement && currentElement !== nextMajorSection) {
            findLists(currentElement);
            currentElement = currentElement.nextElementSibling;
        }

        console.log(`\n>>> Found ${totalLinks} unique wiki links across ${listCount} lists (including nested) <<<\n`);

        // Process all collected lists
        if (allLists.size > 0) {
            const actorLinks = [];
            const processedActorUrls = new Set();

            for (const list of allLists) {
                const links = getActorLinks(list);
                // Only add links we haven't processed yet
                links.forEach(link => {
                    if (!processedActorUrls.has(link.url)) {
                        processedActorUrls.add(link.url);
                        actorLinks.push(link);
                    }
                });
            }

            console.log(`Processing ${actorLinks.length} unique ${sectionType} links for life status...`);
            await processActorLinks(actorLinks);
        } else {
            console.log("No lists found to process");
        }
    } catch (error) {
        console.error(`Error processing ${sectionType} section:`, error);
    }
}

// Step 5: Process the Cast Section
async function processCastSection() {
    console.log("Processing the Cast section...");
    const castSection = findCastSection();
    if (castSection) {
        const actorLinks = getActorLinks(castSection);
        if (actorLinks.length === 0) {
            console.warn("No valid actor links found. Exiting.");
            return;
        }
        await processActorLinks(actorLinks);
    } else {
        console.warn("No Cast section found. Nothing to process.");
    }
    await processAdditionalPersonnel();
}

// Ensure this function is called in your main initialization
async function initializeCastChecker() {
    console.log("Wikipedia Cast Checker Loaded");
    console.log("Initializing Cast Checker...");
    await processAdditionalPersonnel();
    console.log("Cast Checker script execution complete.");
}

// Start the process
initializeCastChecker();
