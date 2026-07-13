# Cloud Mint — Layman to Advanced Guide 🍃

Welcome to **Cloud Mint**. This document serves as your personal guide, taking you from a high-level conceptual understanding (layman's terms) to deep architectural mechanics and customization paths (advanced engineering).

---

## Part 1: The Layman's Guide (What is this?)

### What is Cloud Mint?
Imagine you want a private storage space like Google Drive or Dropbox, but you don't want to pay monthly fees, you don't want third-party companies scanning your personal documents, and you don't want to manage a complicated physical server in your home.

**Cloud Mint** is a personal file manager that solves this:
- **The Storage (GitHub):** It uses a private folder on **GitHub** (a platform usually used by software developers to store code, but which is essentially a highly secure, free, version-controlled cloud hard drive).
- **The Web Interface (Netlify):** It provides a beautiful web portal hosted on **Netlify** (a free website hosting service) where you can log in, view your files, click folders, download documents, and upload items.
- **The Key (Decryption):** You log in using a master password. Only when the correct password is typed does the website receive the keys required to connect to your private GitHub storage folder.

### Why is this better than other solutions?
1. **100% Free:** Neither GitHub nor Netlify charges anything for personal/private repositories and standard serverless hosting.
2. **Absolute Privacy:** Your files are stored in your own private repository. No middleman scans your files for advertising data.
3. **No Heavy Hosting:** There is no running database, no heavy server to maintain, and no backend software that can break. It is a "Serverless" website.
4. **Ephemerality:** The secret key is never saved permanently on the computer. The moment you close the tab, your keys vanish from the browser's memory.

---

## Part 2: High-Level Architecture

```
┌────────────────────────────────────────────────────────┐
│                      Web Browser                       │
│  ┌───────────────┐ ┌───────────────┐ ┌──────────────┐  │
│  │   UI View     │ │ Local Trie    │ │ File Upload  │  │
│  │ (TailwindCSS) │ │ File Parser   │ │ (< 45MB check)│  │
│  └───────┬───────┘ └───────▲───────┘ └──────┬───────┘  │
└──────────┼─────────────────┼────────────────┼──────────┘
           │ 1. Password     │ 3. Read Tree   │ 4. Direct Upload
           │    Submit       │    (JSON)      │    (Base64)
           ▼                 │                ▼
┌──────────────────┐         │       ┌──────────────────┐
│ Netlify Proxy    │         ├───────►  GitHub REST API │
│ (/functions/auth)│         │       │ (api.github.com) │
└──────────┬───────┘         │       └──────────────────┘
           │ 2. Return PAT   │
           ▼                 │
     [sessionStorage] ───────┘
```

The system is split into three main parts:
1. **The Client (Browser):** The user interface built with HTML5, CSS (Tailwind), and Javascript. It runs entirely inside the user's browser.
2. **The Security Gatekeeper (Netlify Function):** A tiny backend serverless function (`/netlify/functions/auth.js`) that checks the password. It stores your raw GitHub key (Personal Access Token) securely in Netlify's cloud. It only hands this key to the browser if the user enters the correct password.
3. **The Data Vault (GitHub API):** The browser uses the retrieved key to talk directly to GitHub to save, read, or delete files.

---

## Part 3: Beginner Tutorial (How to Use)

### How to upload a file:
1. Log in to your Cloud Mint site with your password.
2. Navigate to the folder you want (double-click a folder to open it).
3. Either:
   - Click the green **Upload File** button to select a file from your device.
   - Drag a file from your desktop and drop it directly onto the file list zone.
4. The system will encode, encrypt, and push the file to GitHub. A loading spinner will show "Streaming to storage..." and the file list will refresh when complete.

### How to download a file:
- **On Desktop:** Hover your mouse over the file row. A download icon (arrow pointing down) will appear on the right side. Click it.
- **On Touch Devices (Mobile/Tablet):** Either tap the three dots (`...`) on the right side or press and hold the row for 0.6 seconds. A context panel will slide up from the bottom. Tap **Download**.

### How to create a folder:
1. Click the **New Folder** button.
2. Type a folder name (e.g. `Travel Photos`) and click **Create**.
3. *Technical Note:* In Git storage, folders cannot be completely empty. Cloud Mint automatically creates a tiny hidden file named `.gitkeep` inside your new folder. The app hides this file from you, so it looks like a clean, empty folder.

---

## Part 4: Advanced Architecture (For Developers)

### 1. Direct Client-to-GitHub Streaming (Bypassing Server Constraints)
Most serverless platforms (including Netlify and AWS Lambda) enforce a request size limit of **6MB**. If you try to upload a 20MB file by routing it through a serverless function, the request will immediately fail with a `Payload Too Large (413)` error.

**Cloud Mint bypasses this** by doing direct client-to-API requests:
- The Netlify function only handles the password check and returns the GitHub Personal Access Token (PAT).
- The frontend browser JavaScript catches the PAT and caches it strictly in `sessionStorage` (RAM-based, vanishes when the tab closes).
- When a file is uploaded, the browser converts the file to a Base64 string locally and issues a `PUT` request directly to `https://api.github.com/repos/{owner}/{repo}/contents/{path}`.
- Deletions are sent via direct `DELETE` requests.
- This architectural design shifts all upload workload onto the user's browser, permitting file transfers up to GitHub's individual API ceiling without ever hitting Netlify's limitations.

### 2. Client-Side 45MB Capping
While the GitHub API theoretically allows files up to 100MB via the Contents API, encoding massive files to Base64 in a single-threaded browser environment causes the page main thread to freeze, resulting in a bad user experience. Furthermore, extremely large POST payloads can lead to API network timeouts.
- Cloud Mint instantly checks `File.size` during the file selection/drag event.
- If it exceeds **45MB**, it aborts immediately and renders a custom alert overlay.

### 3. Local Path Trie Parsing (Caching & Speed)
Querying the GitHub API for every folder click is slow and exhausts the authenticated rate limit (5,000 requests/hour).
- On initial load or refresh, Cloud Mint calls `GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=true`.
- This fetches a flat list of *every single file* in the repository in one network call.
- The Javascript engine parses this flat array into a hierarchical Trie structure (`FileNode` class):
  ```javascript
  class FileNode {
    constructor(name, path, type, sha = null, size = 0) {
      this.name = name;
      this.path = path;
      this.type = type; // 'folder' or 'file'
      this.sha = sha;
      this.size = size;
      this.children = {}; // Sub-nodes mapping
    }
  }
  ```
- This trie is stored in RAM. When you click folders, the UI resolves the directory locally and updates the screen instantly (0ms latency, zero API calls).

### 4. Authenticated Blob Downloads
If a repository is private, standard raw download URLs (e.g. `raw.githubusercontent.com/...`) return a `404 Not Found` to public web requests because they lack authentication.
- Cloud Mint resolves this by downloading raw content programmatically.
- It issues a `fetch` to `api.github.com/repos/.../contents/...` with the headers:
  - `Authorization: Bearer <PAT>`
  - `Accept: application/vnd.github.v3.raw` (tells GitHub to send the raw file bytes instead of the JSON representation).
- It receives the response stream, converts it into a browser-native `Blob` object, creates a temporary blob URL (`URL.createObjectURL(blob)`), simulates an anchor click (`<a download="...">`), and cleans up the memory.

---

## Part 5: Advanced Tutorial (Extending the Codebase)

### How to change the security hashing method:
By default, the serverless function [netlify/functions/auth.js](file:///D:/DEV/Cloud%20Mint/netlify/functions/auth.js) checks if `MINT_HASHED_PASSWORD` is a bcrypt hash. If not, it falls back to native SHA-256:
```javascript
const inputHash = crypto.createHash('sha256').update(password).digest('hex');
```
If you wish to add custom salting or change the encryption algorithm, you can customize this block in `auth.js`.

### How to style the UI:
The frontend [public/index.html](file:///D:/DEV/Cloud%20Mint/public/index.html) uses Tailwind CSS via CDN. You can customize colors, margins, and layouts by simply changing classes in the HTML code.
- **Custom Theme Variables:** Tailwind configuration is defined at the top of the HTML:
  ```javascript
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          slate: { 950: '#020617' },
          emerald: { 400: '#34d399' }
        }
      }
    }
  }
  ```
- To switch to a different color theme (e.g., Violet / Indigo), change these values and update corresponding classes in the file rows (`text-emerald-400` to `text-violet-400`, etc.).

### Implementing Client-Side Encryption (Future Vector)
For absolute zero-knowledge security, you can encrypt files client-side using the Web Crypto API *before* uploading them to GitHub:
1. In `public/index.html`, inside the upload function, encrypt the file buffer using AES-GCM with a key derived from the user's password.
2. Convert the encrypted array buffer to Base64 and push it.
3. During download, fetch the encrypted bytes, decrypt them in memory using the user's password, and save the decrypted Blob.
*(This prevents even GitHub from knowing what is inside your files!)*
