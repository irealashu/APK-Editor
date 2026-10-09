# APK Editor

APK Editor is a browser-based Android APK inspection and modification tool built with React, TypeScript, Vite, and JSZip. It lets you open an APK, inspect its structure, edit key metadata and resources, and rebuild a signed APK directly in the browser.

## Features

- Upload and inspect APK, XAPK, and ZIP package files
- Drag-and-drop support for quick APK loading
- View app overview details including package name, version, SDK info, and file statistics
- Inspect Android manifest metadata and component declarations
- Edit common app properties such as app name, package metadata, and manifest values
- Replace visual assets such as icons and other resource-based elements
- Browse the APK file tree and modify files directly
- Edit string resources and color values
- Detect and clean ad-related SDK components and resources
- Manage keystore profiles and APK signing
- Rebuild and download the final APK package

## Screens and workflow

The app is organized as a guided 5-step editor:

1. Overview — review APK details and metadata
2. Mode — choose the edit type
3. Edit — apply common, visual, manifest, string, or ad-cleanup changes
4. Sign — configure or generate a keystore and signing details
5. Build — assemble and download the final APK

## Tech stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- JSZip
- Lucide React icons

## Getting started

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Then open the local Vite URL in your browser, typically:

```text
http://localhost:3000
```

## Production build

```bash
npm run build
```

## Project structure

```text
APK-Editor/
├── src/
│   ├── components/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Notes

- The application runs fully in the browser and does not require a backend service.
- APK editing and rebuilding is intended for local development and experimentation with Android package files.
- Signing and modifying APKs should be done responsibly and in line with app ownership and distribution requirements.

## License

This project does not currently include a license file in the repository root. If needed, add a license before publishing or distributing the project broadly.
