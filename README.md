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

## 🚀 Technical Build Specifications

### Prerequisites

#### 1. Node.js (v18.x or higher)
To manage the runtime environment, you need Node.js. 
*   **Recommendation:** Use [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager) to install and switch between versions:
    ```bash
    nvm install 18
    nvm use 18
    ```
*   **Direct Download:** Alternatively, download from the [official Node.js website](https://nodejs.org/).

#### 2. NPM or Yarn (Package Manager)
NPM is included by default with Node.js. If you prefer **Yarn**, you can install it globally via Corepack (modern Node.js) or NPM.

> [!CAUTION]
> **Avoid Mixing Managers:** This project includes a `package-lock.json`. If you choose to use **Yarn**, delete `package-lock.json` first to avoid resolution inconsistencies. Otherwise, use `npm install`.

```bash
# Enable Corepack (recommended)
corepack enable 
yarn -v

# OR install via NPM
npm install --global yarn
```
To verify installations, run:
```bash
node -v
npm -v
yarn -v
```

### Installation
Install the project dependencies using your preferred manager:
```bash
npm install
# OR (if using yarn, remove package-lock.json first)
yarn install
```

### Development Environment
Initialize the local studio environment:
```bash
npm run dev
# OR
yarn dev
```

### Production Build
Compile the high-fidelity distribution package:
```bash
npm run build
# OR
yarn build
```

### 🛠 Troubleshooting: macOS Build Errors
If you encounter a `dyld: Symbol not found: _SecTrustCopyCertificateChain` error during installation (specifically within `esbuild` or `tsx`):

*   **Cause:** This occurs on older versions of macOS (11.x Big Sur or earlier). The default `esbuild` binary is often built for macOS 12.0+.
*   **Solution A (Recommended):** Upgrade your macOS to version 12.0 (Monterey) or higher.
*   **Solution B (Workaround):** Try installing items that don't require the high-version binary or use a Node version that better handles the platform mapping. Some users have success by trying:
    ```bash
    # Try using NPM instead of Yarn if one fails
    rm -rf node_modules package-lock.json yarn.lock
    npm install
    ```
*   **Solution C (Advanced):** If you are stuck on an older OS, you may need to override the `esbuild` version in your `package.json` to one known to work with older macOS (though this may break compatibility with `tsx`).

---

## 🏗 Database & Storage Configuration

The Vault supports dual-mode storage to balance rapid prototyping with production-grade persistence.

### Option 1: Cloud Mode (Supabase) - Recommended
For institutional use across multiple devices, connect a Supabase backend.
1.  **Initialize Project:** Create a new project at [supabase.com](https://supabase.com).
2.  **Apply Schema:** Execute the provided `supabase_schema.sql` script into the Supabase SQL Editor to initialize tables (tracks, playlists, clients, messages, activities, etc.).
3.  **Environment Sync:** Create a `.env` file in the root directory and populate your keys:
    ```env
    VITE_SUPABASE_URL=your_project_url
    VITE_SUPABASE_ANON_KEY=your_anon_key
    ```

### Option 2: Local Mode (Internal Browser Storage)
If no Supabase credentials are detected, the system automatically falls back to **LocalStorage**.
*   **Zero-Config:** No setup required.
*   **Privacy:** Data remains exclusively within your local browser's storage cache.
*   **Persistence:** Data persists between sessions on the same device but will not sync across other machines.

### Option 3: Local PostgreSQL & pgAdmin 4 Setup
For developers who want a local SQL environment managed via a UI:

#### 1. Software Installation
*   **PostgreSQL:** Download and install the [PostgreSQL Database Server](https://www.postgresql.org/download/). During installation, set a password for the default `postgres` superuser.
*   **pgAdmin 4:** Download the [Desktop Deployment](https://www.pgadmin.org/download/) if it wasn't bundled with your installer.

#### 2. Database Initialization
1.  **Launch pgAdmin 4** and log in with your superuser password.
2.  **Create a New User (Role):**
    *   Right-click `Login/Group Roles` > `Create` > `Login/Group Role...`.
    *   **General Tab:** Name it `vault_admin`.
    *   **Definition Tab:** Set a secure password.
    *   **Privileges Tab:** Set `Can login?`, `Superuser`, and `Create databases` to `Yes`.
3.  **Create the Database:**
    *   Right-click `Databases` > `Create` > `Database...`.
    *   **General Tab:** Database Name: `ogbeatz_vault`.
    *   **General Tab:** Owner: `vault_admin`.

#### 3. Schema Application
1.  In the pgAdmin browser tree, expand `Servers` > `PostgreSQL` > `Databases` > `ogbeatz_vault`.
2.  Open the **Query Tool** (Tools > Query Tool).
3.  Click the **Folder Icon** (Open File) and select the `supabase_schema.sql` file from your project folder.
4.  Click the **Play/Lightning Icon (F5)** to execute. Verify the "Query returned successfully" message.
5.  Check the `Schemas` > `public` > `Tables` section to ensure `tracks`, `clients`, etc., are present.

#### 4. Connecting the App to Local Postgres
Since the application uses the Supabase client library, you can use the **Supabase CLI** to map your local Postgres into a familiar API:
1.  **Install CLI:** `npm install supabase --save-dev`
2.  **Init Local Stack:** `npx supabase init`
3.  **Start Local Services:** `npx supabase start`. This spins up a local Docker-based Supabase environment that maps to your local DB logic.
4.  **Update `.env`:** Point your `VITE_SUPABASE_URL` to your local Supabase API port (usually `http://127.0.0.1:54321`).

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
