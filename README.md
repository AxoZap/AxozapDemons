
  # Demon showcase website

  A Geometry Dash demon showcase website, powered by [Appwrite](https://appwrite.io/).

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Appwrite setup

  The backend uses an **Appwrite Function** + **Appwrite Database** instead of
  Supabase. You need to set up three things in your Appwrite project:

  ### 1. Create the database & collection (automated)

  Install `node-appwrite` and run the setup script:

  ```bash
  npm install node-appwrite
  APPWRITE_API_KEY=<your-api-key> node setup-appwrite.mjs
  ```

  This creates:
  | Resource | ID |
  |---|---|
  | Database | `demons_db` |
  | Collection | `demons` |
  | Attributes | `name` (string 256), `difficulty` (string 20), `rating` (string 10), `gauntlet` (bool), `weekly` (bool), `event` (bool), `attempts` (integer, optional) |

  ### 2. Deploy the Appwrite Function

  The function source lives in `src/appwrite/functions/api/`.

  | Setting | Value |
  |---|---|
  | Runtime | Node.js 18+ |
  | Entrypoint | `src/main.js` |
  | Function ID | `demons-api` |
  | Execute permission | **Any** |

  You can deploy via the Appwrite Console (upload a tarball of the `api/` folder)
  or via the [Appwrite CLI](https://appwrite.io/docs/tooling/command-line/installation).

  ### 3. Set function environment variables

  | Variable | Required | Description |
  |---|---|---|
  | `APPWRITE_API_KEY` | ✅ | API key with Database read/write scope |
  | `DATABASE_ID` | ✅ | `demons_db` |
  | `COLLECTION_ID` | ✅ | `demons` |
  | `ADMIN_PASSWORD` | ✅ | Password for admin actions (add/edit/delete) |
  | `GOOGLE_SERVICE_ACCOUNT` | ❌ | JSON string of Google service-account key (for Sheets sync) |
  | `GOOGLE_SHEET_ID` | ❌ | Google Sheets spreadsheet ID |
  | `GOOGLE_SHEET_NAME` | ❌ | Tab/sheet name inside the spreadsheet |

  ### 4. Frontend config

  The frontend config is in `src/utils/appwrite/config.ts`:

  ```ts
  export const endpoint = 'https://nyc.cloud.appwrite.io/v1';
  export const projectId = '699f8420001f897d627a';
  export const functionId = 'demons-api';
  ```

  Update `functionId` if you used a different ID when creating the function.
  