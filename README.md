# OGBeatz Vault: High-Fidelity Master Delivery & Client Management

OGBeatz Vault is an institutional-grade asset management and distribution hub designed for elite music producers, engineers, and studio owners. It replaces fragmented email chains and generic file-sharing services with a secure, centralized nexus for master delivery, client feedback, and relational mapping.

## 🛠 Core Architectural Functions

### 1. Ingestion & Multi-Track Library
*   **Asset Ingestion:** Rapid upload of high-fidelity audio assets (`.wav`, `.aif`, `.mp3`).
*   **Metadata Enrichment:** AI-augmented tracking of BPM, key, and production status.
*   **Compilation Logic:** Dynamic playlist creation for album sequences or beat tapes.

### 2. Institutional Partner CRM
*   **Entity Onboarding:** Initialize contacts with labels, A&R departments, or independent agencies.
*   **Authorized Partner Badging:** Distinguish between public-facing links and restricted "Authorized Partner" access.
*   **Relational Strength Metrics:** Automate activity-based scoring to determine client engagement levels.

### 3. Encrypted Distribution (Share Portal)
*   **Tokenized Access:** Every share link uses a unique cryptographic token for verification.
*   **Granular Permissions:** Toggle downloads, enable "Stream Only" mode, and set temporal expiration stamps.
*   **Direct Delivery Pipelines:** Integrated Gmail, WhatsApp, and Messenger routing for instant handoffs.

### 4. The Master Audit Trail
*   **Operational Ledger:** Transparent, real-time logging of all system tasks and client interactions.
*   **Interaction Verification:** Track exactly when a client plays, likes, or downloads a specific master.
*   **System Attribution:** Automatic logging of background server tasks (AI analysis, encryption routing).

### 5. Communication Terminal
*   **Bidirectional Directives:** Studio-to-client messaging for mix revisions and production notes.
*   **ZIP Handoff Pipeline:** Automated delivery of master archives directly within the chat thread.

---

## 🚀 Easy Setup & Setup for Dummies (Get started in 5 mins)

Whether you are a music producer, an engineer, or a developer running this for the first time, this simple step-by-step guide will get you up and running with **OGBeatz Vault**.

---

### Step 1: Install Node.js (Your computer's engine)
The application runs on Node.js. Think of it as the motor that powers the app.
1. Go to the official [Node.js Website](https://nodejs.org/) and download the **LTS (Recommended for Most Users)** installer.
2. Run the installer and click "Next" / "Agree" until it's finished.
3. Open your terminal (called "Terminal" on Mac, or "Command Prompt" / "PowerShell" on Windows).
4. Type this command to make sure it's working:
   ```bash
   node -v
   ```
   *(You should see a version number like `v18.x.x` or `v20.x.x` appear).*

---

### Step 2: Download & Setup the Project
1. Download or clone this project folder to your computer.
2. Open your terminal or command prompt and navigate to the project directory:
   ```bash
   cd path/to/ogbeatz-vault
   ```
3. Install the app's packages (all the code libraries the app needs) by typing:
   ```bash
   npm install
   ```

---

### Step 3: Setup Supabase Database (Free & Simple)
We use **Supabase** to securely store tracks, clients, playlists, and message histories. Setting this up is completely **free** and takes exactly 2 minutes:

1. **Create an account:**
   * Go to [supabase.com](https://supabase.com) and sign up/log in (you can use your GitHub or Google account).
2. **Create a new project:**
   * Click **New Project** on the dashboard.
   * Choose an Organization, give your database a name (e.g., `ogbeatz-vault`), type a secure Database Password (make sure to write it down!), and select the region closest to you.
   * Click **Create new project** and wait 1 minute for Supabase to provision your server.
3. **Execute the Database Setup Script:**
   * In your Supabase project dashboard, look at the left-side navigation bar and click the **SQL Editor** icon (it looks like a `SQL` terminal icon).
   * Click **New Query** (or **New blank query**).
   * Open the file named `supabase_schema.sql` located in the root of your project folder. Copy **all** of its contents.
   * Paste the copied text into the Supabase SQL editor code box.
   * Click the **Run** button at the top-right of the editor (or press `Ctrl + Enter` / `Cmd + Enter`).
   * *Success Check: You should see a message saying "Success. No rows returned." at the bottom.*
4. **Get your Secret API Keys:**
   * Click on the **Project Settings** gear icon in the bottom-left corner of the Supabase dashboard.
   * Click on the **API** tab in the sidebar under "Project Settings".
   * Find the **Project URL** field under "API Settings" and copy it.
   * Find the **`anon` `public`** key field and copy it (it is a long string of letters and numbers).

---

### Step 4: Link your App to Supabase
Now we need to tell the app where your database is!
1. In the root directory of your project folder, create a new file named `.env`
2. Open `.env` in any text editor (like Notepad, TextEdit, or VS Code) and paste the following lines (replace with your actual copied keys from Step 3):
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-project-anon-key-goes-here
   ```
3. Save the `.env` file!

---

### Step 5: Start & Build the App

#### To Run in Development (Live Coding Preview):
This launches a local preview server on your computer that updates instantly as you make code changes:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) inside your web browser to view the live app!

#### To Build for Production:
When you are ready to deploy or share your app with the world, compile the source files into a fast, light production build:
```bash
npm run build
```
This will bundle and optimize everything into a folder named `dist/` ready to be served on any fast provider (Netlify, Vercel, Cloud Run, Supabase Hosting, etc.).

---

### 🛠 Legacy macOS & Safari 14 Compatibility
We tuned this application specifically to support older machines. If you run into build errors on macOS 11 (Big Sur) or Safari 14:
*   The build configuration targets `es2020` and `safari14` out-of-the-box to preserve modern asset layouts on older displays.
*   If you see compile/install environment warnings, clear your package installer cache and reinstall:
    ```bash
    rm -rf node_modules package-lock.json
    npm install
    ```

---

## 📖 Operational Usage Instructions

### Phase 1: Library Initialization
1.  Navigate to the **Tracks** tab.
2.  Drop your master `.wav` files into the ingestion zone.
3.  Assign metadata or group them into a **Playlist** for specific projects.

### Phase 2: Partner Onboarding
1.  Switch to the **Clients** tab.
2.  Click **Initialize Contact** to onboard a label or collaborator.
3.  Assign industry tags (e.g., "A&R", "Legal") for institutional mapping.

### Phase 3: Secure Delivery
1.  Trigger the **Share Icon** on any track or playlist.
2.  Select the **Recipient Client** from your directory.
3.  Configure **Policy Settings** (Download toggle, Expiration).
4.  Generate and route the link via the communication tray.

### Phase 4: Monitoring & Feedback
1.  Open the **Activity** tab to monitor incoming telemetry.
2.  Use the **Messages** tab to respond to client revision requests.
3.  Monitor **Relational Strength** metrics to prioritize high-value delivery loops.

---

**Built by OGBeatz. Secured for the Industry.**
