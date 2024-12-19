console.log("Wikipedia Cast Checker Loaded");

// Step 1: Locate the Cast or Personnel section
function findCastSection() {
    console.log("Searching for Cast or Personnel section...");

    const sectionIds = ["Cast", "Personnel"];
    const contentContainers = []; // To store all valid lists
    for (const sectionId of sectionIds) {
        const header = document.querySelector(`h2#${sectionId}, h2 span#${sectionId}`);
        if (header) {
            console.log(`Found ${sectionId} header:`, header.textContent);

            let sibling = header.closest('h2').nextElementSibling;
            console.log(`Starting search after ${sectionId} header...`);

            // Collect all <ul> or .div-col before hitting the next h2
            while (sibling && sibling.tagName !== 'H2') {
                if (sibling.classList.contains("div-col") || sibling.tagName === "UL") {
                    console.log(`Found valid content container:`, sibling.outerHTML.substring(0, 100));
                    contentContainers.push(sibling);
                }
                sibling = sibling.nextElementSibling;
            }
        }
    }

    if (contentContainers.length === 0) {
        console.warn("No Cast or Personnel section found.");
    } else {
        console.log(`Found ${contentContainers.length} content containers.`);
    }

    return contentContainers;
}

// Step 2: Extract actor links
function getActorLinks(castSection) {
    console.log("Extracting actor links from the section...");
    const links = [];

    const listItems = castSection.querySelectorAll("ul > li");
    console.log(`Found ${listItems.length} list items in the section.`);

    listItems.forEach(li => {
        const liText = li.textContent;
        const dashIndex = liText.search(/[-–—]/);

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

    console.log(`Total valid person links found: ${links.length}`);
    return links;
}

// Step 3: Process all Cast/Personnel sections
function processCastSection() {
    console.log("Processing all Cast/Personnel sections...");
    const castSections = findCastSection();

    if (castSections.length > 0) {
        castSections.forEach((section, index) => {
            console.log(`Processing section ${index + 1}...`);
            const actorLinks = getActorLinks(section);

            if (actorLinks.length === 0) {
                console.warn("No valid actor links found in this section.");
                return;
            }

            actorLinks.forEach(actor => {
                console.log(`Sending request for: ${actor.name} (${actor.url})`);
                chrome.runtime.sendMessage({ actorUrl: actor.url }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error("Error communicating with background script:", chrome.runtime.lastError.message);
                        return;
                    }

                    if (response) {
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
        });
    } else {
        console.warn("No Cast or Personnel sections to process.");
    }
}

// Start the process
console.log("Initializing Cast Checker...");
processCastSection();
console.log("Cast Checker script execution complete.");
