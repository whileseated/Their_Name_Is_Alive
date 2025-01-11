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
    
    const listItems = listElement.querySelectorAll("li");
    listItems.forEach(li => {
        const anchors = Array.from(li.querySelectorAll("a[href^='/wiki/']"));
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
    });

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
    
    // Updated selector to find the Personnel header within the mw-heading div
    const personnelHeader = document.querySelector('.mw-heading h2#Personnel');
    console.log("Personnel header found:", !!personnelHeader);
    
    if (!personnelHeader) {
        console.log("No Personnel section found, skipping...");
        return;
    }

    // Start from the Personnel section's container div
    let currentElement = personnelHeader.closest('.mw-heading').nextElementSibling;
    const allLists = [];
    let listCount = 0;

    console.log("Starting element:", currentElement?.tagName, currentElement?.classList);

    // First pass: collect all lists
    try {
        while (currentElement) {
            // Stop if we hit any mw-heading2 class after Personnel section
            if (currentElement.classList?.contains('mw-heading') && 
                currentElement.classList?.contains('mw-heading2')) {
                console.log("Reached next major section - stopping analysis");
                break;
            }

            // Collect top-level lists
            if (currentElement.tagName === 'UL') {
                listCount++;
                allLists.push(currentElement);
                console.log(`Found top-level list ${listCount}`);
            }

            // Collect nested lists
            const nestedLists = Array.from(currentElement.getElementsByTagName('ul'));
            if (nestedLists.length > 0) {
                listCount += nestedLists.length;
                allLists.push(...nestedLists);
                console.log(`Found ${nestedLists.length} nested lists in current element`);
            }

            // Move to the next sibling
            currentElement = currentElement.nextElementSibling;
        }

        console.log(`\n>>> Total lists found in Personnel section: ${listCount} <<<\n`);

        // Process all collected lists
        if (allLists.length > 0) {
            console.log(`Beginning to process ${allLists.length} lists...`);
            const actorLinks = [];
            for (const list of allLists) {
                const links = getActorLinks(list);
                actorLinks.push(...links);
            }

            console.log(`Found ${actorLinks.length} actor links to process`);
            await processActorLinks(actorLinks);
        } else {
            console.log("No lists found to process");
        }
    } catch (error) {
        console.error("Error processing Personnel section:", error);
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
