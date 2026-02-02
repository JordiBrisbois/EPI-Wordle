# Changelog

## [1.2.0] - 2026-02-02

### Added
- **Smart Word Lists**: Implemented a dual-list system to distinguish between common "solution" words and valid dictionary "guess" words.
- **Offline Data**: Word lists are now stored locally in `scripts/data`, allowing the setup script to run without an internet connection.
- **Database**: Added `is_solution` column to `words` table to support the new word logic.

### Changed
- **Word Import**: `scripts/fetch-words.js` now reads from local JSON files and handles deduplication and normalization (accents removal) automatically.
- **Game Logic**: Target words are now selected only from the common words list (~1500 words) to ensure fairness, while guesses can be any valid 5-letter word (~6000 words).

## [1.1.0] - 2026-02-01

### Added
- **Security**: Added CORS middleware to control cross-origin access.
- **Configuration**: Integrated `dotenv` to load environment variables from `.env` file.
- **Documentation**: Added `.env.example` for secure secret management.

### Admin Roles
- **Chat Moderation**: Admins can now delete any message. Users can delete their own.
- **System Messages**: Added "Bon jeu a tous !" welcome message on server start.
- **Real-time Stats**: Profile stats now refresh automatically when opening the profile view.

### Fixed
- **Login Persistence**: Fixed issue where session was lost on refresh by adjusting cookie security settings for localhost.
- **Server Restart**: Resolved `EADDRINUSE` errors by improving server shutdown process.
- **Chat Deletion**: Fixed 404 errors by correcting API route mismatch (`/delete/:id`) and ensuring system messages have unique IDs.
- **API Client**: Added missing `getMe()` method to `api.js`.

### Changed
- **Server Config**: Updated `start.bat` to enforce `development` mode for local testing.
- **Database**: Added `active_games` table to schema to fix crash on game start.
- **UI**: Updated chat timestamp format to 24h (HH:mm).
