# @networking-executives/shared

Shared event management package used by both `networking-executives` (main UI) and `networking-executives-admin`.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Firebase (network-executive)                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
┌───────────────────┐                 ┌───────────────────┐
│ networking-       │                 │ networking-       │
│ executives        │                 │ executives-admin  │
│ (GitHub + Vercel) │                 │ (GitHub + Vercel) │
└────────┬──────────┘                 └────────┬──────────┘
         │                                     │
         └──────────────┬──────────────────────┘
                        ▼
              ┌───────────────────┐
              │ shared (GitLab)   │
              │ git submodule     │
              └───────────────────┘
```

## Local Development

### Setup (after cloning parent project)

```bash
git submodule update --init --recursive
yarn install
cd shared && yarn install && yarn build && cd ..
yarn dev
```

### Working on Shared Code

```bash
# Terminal 1: Watch mode
cd shared && yarn dev

# Terminal 2: Run parent app
yarn dev
```

### Committing Changes

```bash
# Commit in shared
cd shared
git add . && git commit -m "message" && git push origin main

# Update reference in parent
cd ..
git add shared
git commit -m "Update shared submodule"
git push
```

### Pulling Updates

```bash
git submodule update --remote shared
cd shared && yarn install && yarn build && cd ..
```

## Package Structure

```
src/
├── schemas/event.js       # Event schema & validation
├── utils/
│   ├── normalizer.js      # Data normalization
│   └── dateUtils.js       # Date/timezone formatting
├── services/
│   ├── eventService.js    # Firestore CRUD
│   ├── geocodingService.js
│   ├── timezoneService.js
│   └── imageService.js
└── hooks/
    ├── useEventForm.js
    ├── useGeocoding.js
    ├── useTimezone.js
    ├── useImageUpload.js
    └── useEventValidation.js
```

## Usage

```javascript
import {
  // Schema & constants
  EVENT_TYPES, EVENT_STATUS, eventValidationSchema,
  // Utilities
  normalizeEventData, formatDate, formatEventDateRange,
  // Services (require initialization)
  initializeEventService, createEvent, updateEvent,
  // Hooks
  useEventForm, useGeocoding, useTimezone
} from '@networking-executives/shared';
```

### Service Initialization

```javascript
import { initializeEventService } from '@networking-executives/shared';
import { db } from './config/firebase';
import { collection, doc, setDoc, getDoc, ... } from 'firebase/firestore';

initializeEventService(db, { collection, doc, setDoc, getDoc, ... });
```

## Deployment (Vercel)

Both apps use `scripts/vercel-install.sh` which handles GitLab SSH auth for submodule access.

**Vercel Environment Variable:**
- `GITLAB_SSH_KEY` - Base64-encoded SSH private key with GitLab read access

**Vercel Install Command:** `bash scripts/vercel-install.sh`
