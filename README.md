# **Their Name Is Alive**  

---

## **Overview**  
[*Their Name Is Alive* is a Chrome Extension](https://chromewebstore.google.com/detail/their-name-is-alive/mnbdmafjlblmipmpimeolmggnnogffob) that scans the **Cast** or **Personnel** section on Wikipedia movie or album pages. It checks whether individuals listed are alive or deceased using Wikipedia’s content and marks them with ✅ (alive) or ❌ (deceased).

---

## **Features**  
- Scans Wikipedia movie or album pages for the **Cast** or **Personnel** section.  
- Fetches each person’s life status from their Wikipedia page.  
- Adds:  
  - ✅ next to names of living individuals.  
  - ❌ next to names of deceased individuals.  
- Works seamlessly in the background without disrupting your browsing experience.

![Coltrane - A Love Supreme example](img/xnap_love_supreme_2800.png)


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

![Coltrane - A Love Supreme example](img/xnap_star-wars_1280.png)

---

## **Installation**  

[Install via Chrome Store](https://chromewebstore.google.com/detail/their-name-is-alive/mnbdmafjlblmipmpimeolmggnnogffob), or:

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

Here are a few example pages upon which the extension was tested:

Films:
- [Breathless](https://en.wikipedia.org/wiki/Breathless_(1960_film)#Cast)
- [Good Will Hunting](https://en.wikipedia.org/wiki/Good_Will_Hunting#Cast)
- [Star Wars](https://en.wikipedia.org/wiki/Star_Wars_(film)#Cast)

Music:
- [A Love Supreme](https://en.wikipedia.org/wiki/A_Love_Supreme#Personnel)
- [Fly or Die Fly or Die Fly or Die (World War)](https://en.wikipedia.org/wiki/Fly_or_Die_Fly_or_Die_Fly_or_Die_(World_War)#Personnel)
- [Nevermind](https://en.wikipedia.org/wiki/Nevermind#Personnel)
- [Moondreams](https://en.wikipedia.org/wiki/Moondreams_(Walter_Wanderley_album)#Personnel)

---

## **Troubleshooting**  
- **No Marks Appear**: Ensure the extension is loaded correctly and you are on a Wikipedia page.  
- **Incorrect Results**: The extension relies on Wikipedia content and structure; inconsistencies might cause errors.  

---

## **To Do**  
- Need to push for a solution where there are multiple personnel sections on a page, a la [Aja](https://en.wikipedia.org/wiki/Aja_(album)).
---

## **License**  
This project is licensed under the MIT License.