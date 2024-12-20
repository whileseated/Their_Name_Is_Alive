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
function getActorLinks(castSection) {
    console.log("Extracting actor links from the Cast/Personnel section...");
    const links = [];
    let currentElement = castSection;

    while (currentElement && currentElement.tagName !== 'H2') {
        const ulElements = currentElement.tagName === 'UL'
            ? [currentElement]
            : Array.from(currentElement.querySelectorAll('ul'));

        ulElements.forEach(ul => {
            const listItems = ul.querySelectorAll("li");
            listItems.forEach(li => {
                const anchors = Array.from(li.querySelectorAll("a[href^='/wiki/']"));
                anchors.forEach(anchor => {
                    if (!anchor.previousSibling || 
                        (!anchor.previousSibling.textContent.includes('✅') &&
                         !anchor.previousSibling.textContent.includes('❌'))) {
                        links.push({
                            name: anchor.textContent.trim(),
                            url: "https://en.wikipedia.org" + anchor.getAttribute("href"),
                            element: anchor
                        });
                    }
                });
            });
        });
        currentElement = currentElement.nextElementSibling;
    }
    console.log(`Total valid actor links found: ${links.length}`);
    return links;
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
    console.log("Looking for additional Personnel sections...");
    const personnelHeader = document.querySelector('h2 span#Personnel');
    if (!personnelHeader) return;

    let currentElement = personnelHeader.closest('h2').nextElementSibling;

    while (currentElement && currentElement.tagName !== 'H2') {
        if (currentElement.tagName === 'UL' || currentElement.querySelector('ul')) {
            const targetUL = currentElement.tagName === 'UL'
                ? currentElement
                : currentElement.querySelector('ul');

            if (targetUL) {
                const actorLinks = getActorLinks(targetUL);
                console.log(`Processing UL with ${actorLinks.length} actor links...`);
                await processActorLinks(actorLinks);
            }
        }
        currentElement = currentElement.nextElementSibling;
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

// Start the process
console.log("Initializing Cast Checker...");
processCastSection().then(() => {
    console.log("Cast Checker script execution complete.");
});
