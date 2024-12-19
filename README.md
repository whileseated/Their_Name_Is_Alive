# **Their Name Is Alive**  

---

## **Overview**  
*"Their Name Is Alive"* is a Chrome Extension that scans the **Cast** or **Personnel** section on Wikipedia movie or album pages. It checks whether individuals listed are alive or deceased using Wikipedia’s content and marks them with ✅ (alive) or ❌ (deceased).

---

## **Features**  
- Scans Wikipedia movie or album pages for the **Cast** or **Personnel** section.  
- Fetches each person’s life status from their Wikipedia page.  
- Adds:  
  - ✅ next to names of living individuals.  
  - ❌ next to names of deceased individuals.  
- Works seamlessly in the background without disrupting your browsing experience.

---

## **How It Works**  
1. **Content Script**:  
   - Detects **Cast** or **Personnel** sections on Wikipedia pages.  
   - Extracts links to individual Wikipedia pages of listed names.  
2. **Background Script**:  
   - Fetches the Wikipedia page of each individual.  
   - Determines their life status using:  
     - Infobox for *Born* and *Died* fields.  
     - First paragraph for death/birth dates.  
3. **Marking**:  
   - ✅ or ❌ is added beside each name in the section.

---

## **Installation**  

1. **Download the Files**  
   Clone or download the repository files to your local system.  

2. **Load Extension into Chrome**  
   - Open Chrome and go to `chrome://extensions/`.  
   - Enable **Developer Mode** (toggle in the top-right corner).  
   - Click **Load unpacked**.  
   - Select the directory containing these files.  

3. **Navigate to Wikipedia**  
   - Visit any Wikipedia page for movies or albums.  
   - Observe the Cast/Personnel section for ✅ or ❌ marks.  

---

## **Permissions**  
- **`activeTab`**: To interact with the currently open Wikipedia page.  
- **`scripting`**: To inject the content script on Wikipedia pages.  
- **`host_permissions`**: Allows access to `*.wikipedia.org` for extracting data.

---

## **Files**  

### **manifest.json**  
Defines the extension properties, including permissions, content scripts, and the background script.

### **content.js**  
- Scans Wikipedia pages for Cast/Personnel sections.  
- Extracts individual links and sends them to the background script.  
- Updates the page by adding ✅ or ❌ markers.

### **background.js**  
- Fetches the individual's Wikipedia page.  
- Parses data to determine if the person is alive or deceased.

---

## **Usage**  
1. Open a Wikipedia page of a movie or music album.  
2. View the **Cast** or **Personnel** section.  
3. ✅ (alive) and ❌ (deceased) marks will appear next to names automatically.

---

## **Troubleshooting**  
- **No Marks Appear**: Ensure the extension is loaded correctly and you are on a Wikipedia page.  
- **Incorrect Results**: The extension relies on Wikipedia content and structure; inconsistencies might cause errors.  

---

## **License**  
This project is licensed under the MIT License.

---

Enjoy discerning who’s *still alive* with ease! 🎬🎵