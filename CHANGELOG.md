# Changelog

## [1.1.0] - 2026-02-01

### Added
- **Admin Roles**: First registered user is automatically assigned 'admin' role.
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
