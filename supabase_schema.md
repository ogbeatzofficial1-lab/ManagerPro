# Supabase Schema Reference Hand-Book

A comprehensive directory of the tables, column schemas, data types, default constraints, and structural relationships configured for **OG BEATZ**. 

---

## Table Relationships Overview

```
 [profiles]           [todos]

 [activities] ───────────────┐
                             │ (References)
 [tracks] ◄──────── [share_links] ────────► [clients]
   ▲                           │               ▲
   │                           ▼               │
   │                      [playlists]          │
   │                                           │
   ├─────────────── [promo_videos]             │
   │                                           │
   ├─────────────── [promo_packs]              │
   │                                           │
   └───────────────────────────────────── [messages]
```

---

## Tables Dictionary

### 1. `tracks`
Stores metadata and file resources for individual production tracks, mixes, and audio assets.

| Column | Type | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `uuid_generate_v4()` | `PRIMARY KEY` | Unique identifier for each track. |
| `name` | `TEXT` | *None* | `NOT NULL` | Name of the track. |
| `artist` | `TEXT` | `'OGBeatz'` | `NOT NULL` | Producer or artist credit. |
| `duration` | `INTEGER` | `0` | `NOT NULL` | Audio length in seconds. |
| `bpm` | `INTEGER` | `120` | `NOT NULL` | Beats Per Minute speed. |
| `key_signature` | `TEXT` | `'C Major'` | `NOT NULL` | Harmonic musical key. |
| `file_url` | `TEXT` | `NULL` | | Public CDN or Storage path to the audio file. |
| `image_url` | `TEXT` | `NULL` | | Cover artwork image URL. |
| `size` | `BIGINT` | `0` | `NOT NULL` | File footprint size in bytes. |
| `type` | `TEXT` | `'audio/mpeg'` | `NOT NULL` | MIME type of the file. |
| `plays` | `INTEGER` | `0` | `NOT NULL` | Total play counter. |
| `likes` | `INTEGER` | `0` | `NOT NULL` | Total user like counter. |
| `tags` | `TEXT[]` | `'{}'` | | Search index labels or genre tags. |
| `status` | `TEXT` | `'processing'` | `CHECK (status IN ('ready', 'processing', 'error'))` | Ingestion status for processing WAV/MP3 files. |
| `created_at` | `TIMESTAMPTZ`| `NOW()` | | Timestamp when track was metadata-registered. |

---

### 2. `playlists`
Groups multiple audio assets into collections or beat tapes.

| Column | Type | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `uuid_generate_v4()` | `PRIMARY KEY`| Unique playlist tracking ID. |
| `name` | `TEXT` | *None* | `NOT NULL` | Title of the playlist. |
| `description`| `TEXT` | `NULL` | | Optional description copy card. |
| `track_ids` | `UUID[]` | `'{}'` | | Multi-value list containing aligned tracks IDs. |
| `start_color`| `TEXT` | `'#f97316'` | | Visual hex gradient start. |
| `end_color` | `TEXT` | `'#ea580c'` | | Visual hex gradient end. |
| `image_url` | `TEXT` | `NULL` | | Curated cover art image card. |
| `created_at` | `TIMESTAMPTZ`| `NOW()` | | Timestamp when playlist was created. |

---

### 3. `clients`
Represents direct business contacts, artists, Managers, or A&R personnel reviewing content.

| Column | Type | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `uuid_generate_v4()` | `PRIMARY KEY`| Unique tracking ID. |
| `name` | `TEXT` | *None* | `NOT NULL` | Human legal/artist name. |
| `email` | `TEXT` | *None* | `UNIQUE NOT NULL` | Verified communication address. |
| `avatar_url` | `TEXT` | `NULL` | | Custom thumbnail avatar icon link. |
| `company` | `TEXT` | `NULL` | | Label/Publishing house affiliate name. |
| `status` | `TEXT` | `'offline'` | `CHECK (status IN ('online', 'offline', 'away'))` | Live status signal. |
| `last_active`| `TIMESTAMPTZ`| `NOW()` | | Tracks last verified client activity. |
| `tags` | `TEXT[]` | `'{}'` | | Administrative grouping flags. |
| `created_at` | `TIMESTAMPTZ`| `NOW()` | | Database insert timestamp. |

---

### 4. `share_links`
Generates cryptographically clean, shareable URL tokens mapping Tracks/Playlists to specific Clients.

| Column | Type | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `uuid_generate_v4()` | `PRIMARY KEY` | Unique record identity ID. |
| `token` | `TEXT` | *None* | `UNIQUE NOT NULL` | Crypotgraphic query token used in links. |
| `track_id` | `UUID` | `NULL` | `REFERENCES tracks(id) ON DELETE CASCADE` | Optional single track relationship. |
| `playlist_id`| `UUID` | `NULL` | `REFERENCES playlists(id) ON DELETE CASCADE`| Optional multi-track playlist linkage. |
| `client_id` | `UUID` | `NULL` | `REFERENCES clients(id) ON DELETE CASCADE` | Specific recipient profile relationship. |
| `recipient_email`| `TEXT` | `NULL`| | Alternative fallback email card indicator. |
| `download_enabled`| `BOOLEAN` | `true` | | Controls permission to query raw audio files. |
| `expires_at` | `TIMESTAMPTZ`| `NULL` | | Set time limit window for links. |
| `access_count`| `INTEGER` | `0` | | Total times the secure client portal loaded. |
| `created_at` | `TIMESTAMPTZ`| `NOW()` | | Entry creation timestamp. |

---

### 5. `activities`
Continuous system logs tracking real-time client events (plays, downloads, messages, status shifts).

| Column | Type | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `uuid_generate_v4()` | `PRIMARY KEY` | High-fidelity activity log tracking entry. |
| `type` | `TEXT` | *None* | `NOT NULL` | Metric label (e.g. `'play'`, `'download'`). |
| `track_id` | `UUID` | `NULL` | `REFERENCES tracks(id) ON DELETE SET NULL` | Target trace track relation. |
| `playlist_id`| `UUID` | `NULL` | `REFERENCES playlists(id) ON DELETE SET NULL` | Target trace playlist relation. |
| `client_id` | `UUID` | `NULL` | `REFERENCES clients(id) ON DELETE SET NULL` | Client agent source relationship. |
| `user` | `UUID` | `NULL` | | Custom User identifier. |
| `action` | `TEXT` | `NULL` | | Specific custom event action verb. |
| `target` | `TEXT` | `NULL` | | Name/Path descriptor representation. |
| `details` | `TEXT` | `NULL` | | System metadata context information. |
| `timestamp` | `TIMESTAMPTZ`| `NOW()` | | Log timestamp. |

---

### 6. `messages`
Real-time messaging between clients and producers within active reviews.

| Column | Type | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `uuid_generate_v4()` | `PRIMARY KEY` | message ID. |
| `client_id` | `UUID` | `NULL` | `REFERENCES clients(id) ON DELETE CASCADE` | Source/Destination client metadata link. |
| `recipient_id`| `TEXT` | `NULL` | | Target audience scope. |
| `content` | `TEXT` | *None* | `NOT NULL` | Inside text content payload. |
| `image_url` | `TEXT` | `NULL` | | Attached media screenshot reference link. |
| `direction` | `TEXT` | *None* | `CHECK (direction IN ('inbound', 'outbound'))` | Client relative communication flow tracking. |
| `timestamp` | `TIMESTAMPTZ`| `NOW()` | | Send/Receive timing index. |
| `is_read` | `BOOLEAN` | `false` | | Read receipt indicator. |

---

### 7. `promo_videos`
Promo videos generated aligning track reference mixes with social formatting specs.

| Column | Type | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `uuid_generate_v4()` | `PRIMARY KEY` | Tracking ID. |
| `track_id` | `UUID` | `NULL` | `REFERENCES tracks(id) ON DELETE CASCADE`| Aligned track audio asset relation. |
| `playlist_id`| `UUID` | `NULL` | `REFERENCES playlists(id) ON DELETE CASCADE` | Aligned compilation reference. |
| `video_url` | `TEXT` | *None* | `NOT NULL` | Storage url holding finalized visual render. |
| `thumbnail_url`| `TEXT` | `NULL` | | Poster artwork reference path. |
| `style` | `TEXT` | *None* | `NOT NULL` | Dynamic theme choice (e.g., Cyber Industrial). |
| `status` | `TEXT` | `'processing'` | `CHECK (status IN ('processing', 'ready', 'error'))` | Active worker transcode and render status. |
| `created_at` | `TIMESTAMPTZ`| `NOW()` | | Timestamp when build was requested. |
| `video_data` | `JSONB` | `'{}'::jsonb` | | Dynamic vector configs, aspect ratio settings. |
| `thumbnail_data`| `JSONB` | `'{}'::jsonb` | | Raw styles & rendering engine variables. |

---

### 8. `promo_packs`
AI-generated social copy packs for promotional campaigns.

| Column | Type | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `uuid_generate_v4()` | `PRIMARY KEY` | Promotional pack record identifier. |
| `track_id` | `UUID` | `NULL` | `REFERENCES tracks(id) ON DELETE CASCADE` | Reference mix tracker link. |
| `youtube_copy`| `TEXT` | `NULL` | | Ready-to-paste video title, specs list description. |
| `instagram_copy`| `TEXT` | `NULL`| | Curated hashtag copy block. |
| `generic_copy`| `TEXT` | `NULL` | | Pitch message template meant for managers. |
| `created_at` | `TIMESTAMPTZ`| `NOW()` | | Insertion timestamp. |

---

### 9. `profiles`
The master administrative producer brand settings data.

| Column | Type | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `uuid_generate_v4()` | `PRIMARY KEY` | Master configuration record identity. |
| `name` | `TEXT` | `NULL` | | Brand administrator display name. |
| `artist_name`| `TEXT` | `NULL` | | Brand/Studio label signature (e.g., OGBeatz). |
| `bio` | `TEXT` | `NULL` | | Studio bio/elevator pitch copy. |
| `email` | `TEXT` | `NULL` | | Direct administrative business email. |
| `avatar_url` | `TEXT` | `NULL` | | Brand custom avatar icon picture source URL. |
| `social_links`| `JSONB` | `'{}'::jsonb` | | Dynamic dictionary containing custom handle links. |
| `created_at` | `TIMESTAMPTZ`| `NOW()` | | Record setup timestamp. |

---

### 10. `todos`
Local client task queues and review guidelines checklist entries.

| Column | Type | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `uuid_generate_v4()` | `PRIMARY KEY` | Checkbox item ID. |
| `title` | `TEXT` | *None* | `NOT NULL` | Direct task description copy. |
| `completed` | `BOOLEAN` | `false` | | Task resolution state index. |
| `created_at` | `TIMESTAMPTZ`| `NOW()` | | Creation timestamp in queue tracking. |

---

## Row Level Security (RLS) Status

All database tables are pre-configured to handle both restricted server-side actions or complete public developer sandboxing mode. 

By default, the SQL blueprint executes `DISABLE ROW LEVEL SECURITY` and associates an unrestricted **"Public Access"** policy for fast testing without needing intricate JWT parameters or complex credential headers:

```sql
ALTER TABLE tracks DISABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON tracks FOR ALL USING (true) WITH CHECK (true);
```

---

## Developer Integration Guide

To copy-paste code segments, retrieve initialization wrappers, or check typical CRUD structures, please refer to the matching [Supabase Development Integration Guide](./supabase_dev_guide.md) created in the root directory.

