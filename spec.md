# CloudVault

## Current State
New project. Only scaffold files exist.

## Requested Changes (Diff)

### Add
- Cloud storage app with 2TB capacity display
- Folder management: create, rename, delete folders
- File management: upload, rename, delete, download files
- Nested folder structure (folders inside folders)
- Storage usage indicator (used / 2TB)
- File browser with grid and list views
- File/folder icons based on type
- Breadcrumb navigation for folder paths
- Authorization so each user sees only their own files

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Select `authorization` and `blob-storage` components
2. Generate Motoko backend with:
   - Folder data model (id, name, parentId, ownerId, createdAt)
   - File metadata model (id, name, folderId, ownerId, blobId, size, mimeType, createdAt)
   - CRUD for folders and files
   - Storage usage calculation per user
3. Frontend:
   - Auth login/signup flow
   - Dashboard with storage usage bar
   - Folder tree sidebar
   - Main file browser (grid/list toggle)
   - Upload file button (uses blob-storage)
   - Create folder modal
   - Rename/delete context menus
   - Breadcrumb trail
