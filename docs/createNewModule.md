# Frontend Module Deactivation Guide - Linguify

## Deactivating a Frontend Module

This guide explains how to temporarily deactivate a frontend module without deleting it. **Note: This only applies to frontend modules, not backend components.**

### Rename the Module Directory with Underscore Prefix

In Next.js frontend applications, directories with names starting with an underscore (`_`) are ignored by the automatic routing system.

1. Navigate to the frontend module directory (e.g., `frontend/src/app/(dashboard)/(apps)/revision`)
2. Rename it by adding an underscore prefix (e.g., `_revision`)

```bash
# Using PowerShell
ren revision _revision
```

### Troubleshooting Permission Errors

If you see "Access Denied" errors:

1. Close any applications using the files (IDE, dev server)
2. Run PowerShell as Administrator:
   - Right-click on PowerShell
   - Select "Run as administrator"
   - Try the command again

3. Or use File Explorer:
   - Navigate to the module directory
   - Right-click and select "Rename"
   - Add the underscore prefix

## Reactivating a Frontend Module

To make the module available again:

```bash
# Using PowerShell
ren _revision revision
```