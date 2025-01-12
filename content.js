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
    const links = [];
    
    // Get ALL wiki links in the list, including duplicates
    const allAnchors = listElement.querySelectorAll("a[href^='/wiki/']");
    
    allAnchors.forEach(anchor => {
        // Only process links that are within list items
        if (!anchor.closest('li')) return;
        
        const url = "https://en.wikipedia.org" + anchor.getAttribute("href");
        const name = anchor.textContent.trim();
        
        // Always add the link, even if we've seen this URL before
        links.push({
            name: name,
            url: url,
            element: anchor
        });
        
        // If this URL is already in the cache, immediately mark it
        if (statusCache.has(url)) {
            const status = statusCache.get(url);
            if (!anchor.previousSibling?.textContent.includes('✅') &&
                !anchor.previousSibling?.textContent.includes('❌')) {
                anchor.insertAdjacentHTML("beforebegin", 
                    status === "alive" ? "✅ " : "❌ ");
                console.log(`Reapplied cached status for ${name}: ${status}`);
            }
        }
    });

    console.log(`Found ${links.length} total links (including duplicates)`);
    return links;
}

// Create a cache to store life status results
const statusCache = new Map();

// Step 3: Process actor links asynchronously
async function processActorLinksWithCache(actorLinks) {
    // Group by URL but keep ALL elements
    const urlToElements = new Map();
    actorLinks.forEach(actor => {
        if (!urlToElements.has(actor.url)) {
            urlToElements.set(actor.url, []);
        }
        urlToElements.get(actor.url).push(actor.element);
    });

    console.log(`Processing ${urlToElements.size} unique URLs...`);

    // Process each unique URL once
    for (const [url, elements] of urlToElements) {
        try {
            // Skip if all elements are already marked
            if (elements.every(el => 
                el.previousSibling?.textContent.includes('✅') ||
                el.previousSibling?.textContent.includes('❌'))) {
                continue;
            }

            let status;
            if (statusCache.has(url)) {
                status = statusCache.get(url);
                console.log(`Using cached status for ${elements[0].textContent}: ${status}`);
            } else {
                const response = await new Promise((resolve, reject) => {
                    chrome.runtime.sendMessage({ actorUrl: url }, (res) => {
                        if (chrome.runtime.lastError) reject(chrome.runtime.lastError.message);
                        else resolve(res);
                    });
                });

                if (response?.status === "alive" || response?.status === "deceased") {
                    status = response.status;
                    statusCache.set(url, status);
                    console.log(`Fetched and cached ${elements[0].textContent} as ${status}`);
                }
            }

            // Mark ALL elements for this URL
            if (status) {
                elements.forEach(element => {
                    if (!element.previousSibling?.textContent.includes('✅') &&
                        !element.previousSibling?.textContent.includes('❌')) {
                        element.insertAdjacentHTML("beforebegin", 
                            status === "alive" ? "✅ " : "❌ ");
                    }
                });
            }
        } catch (error) {
            console.error(`Error processing ${elements[0].textContent}:`, error);
        }
    }
}

// Step 4: Process Additional Personnel
async function processAdditionalPersonnel() {
    console.log("\n=== Starting Section Analysis ===");
    
    const sectionHeader = document.querySelector('.mw-heading h2#Personnel, .mw-heading h2#Cast');
    const sectionType = sectionHeader?.id || 'unknown';
    console.log(`${sectionType} section found:`, !!sectionHeader);
    
    if (!sectionHeader) {
        console.log("No Personnel or Cast section found, skipping...");
        return;
    }

    // Get the entire section content
    let currentElement = sectionHeader.closest('.mw-heading');
    let sectionContent = [];
    
    // Collect all elements until next major section
    while (currentElement = currentElement.nextElementSibling) {
        if (currentElement.classList?.contains('mw-heading') && 
            currentElement.classList?.contains('mw-heading2')) {
            break;
        }
        sectionContent.push(currentElement);
    }

    // Find all wiki links in the entire section
    const allLinks = [];
    sectionContent.forEach(element => {
        const anchors = element.querySelectorAll("a[href^='/wiki/']");
        anchors.forEach(anchor => {
            // Only include links that are within list items
            if (anchor.closest('li')) {
                const url = "https://en.wikipedia.org" + anchor.getAttribute("href");
                allLinks.push({
                    name: anchor.textContent.trim(),
                    url: url,
                    element: anchor
                });
            }
        });
    });

    console.log(`Found ${allLinks.length} total links in ${sectionType} section`);

    // Group all links by URL
    const urlToElements = new Map();
    allLinks.forEach(link => {
        if (!urlToElements.has(link.url)) {
            urlToElements.set(link.url, []);
        }
        urlToElements.get(link.url).push(link.element);
    });

    console.log(`Processing ${urlToElements.size} unique people...`);

    // Process each unique person
    for (const [url, elements] of urlToElements) {
        try {
            let status;
            
            // Check cache first
            if (statusCache.has(url)) {
                status = statusCache.get(url);
                console.log(`Using cached status for ${elements[0].textContent}: ${status}`);
            } else {
                // Fetch new status
                const response = await new Promise((resolve, reject) => {
                    chrome.runtime.sendMessage({ actorUrl: url }, (res) => {
                        if (chrome.runtime.lastError) reject(chrome.runtime.lastError.message);
                        else resolve(res);
                    });
                });

                if (response?.status === "alive" || response?.status === "deceased") {
                    status = response.status;
                    statusCache.set(url, status);
                    console.log(`Fetched and cached ${elements[0].textContent} as ${status}`);
                }
            }

            // Mark ALL instances of this person
            if (status) {
                elements.forEach(element => {
                    if (!element.previousSibling?.textContent.includes('✅') &&
                        !element.previousSibling?.textContent.includes('❌')) {
                        element.insertAdjacentHTML("beforebegin", 
                            status === "alive" ? "✅ " : "❌ ");
                    }
                });
            }
        } catch (error) {
            console.error(`Error processing ${elements[0].textContent}:`, error);
        }
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
        await processActorLinksWithCache(actorLinks);
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
