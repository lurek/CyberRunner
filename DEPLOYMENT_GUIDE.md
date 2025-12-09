# Deployment Guide for Cyber Runner 3D

This guide explains how to deploy your game to free hosting services like Netlify or Vercel.

## Pre-requisites

The project has already been built. The production-ready files are located in the `dist` folder.
If you need to rebuild the project at any time, run:

```bash
npm run build
```

## Option 1: Netlify (Recommended - Easiest)

**✅ Project Pre-configured:** I have added a `netlify.toml` file and a `public/_redirects` file to ensure your game works perfectly on Netlify, including handling page refreshes.

Netlify provides a simple "Drag & Drop" interface for deploying static sites.

1.  **Go to Netlify Drop**: Open your browser and navigate to [https://app.netlify.com/drop](https://app.netlify.com/drop).
2.  **Log in / Sign up**: If you aren't logged in, you'll need to sign up or log in with GitHub, GitLab, Bitbucket, or Email.
3.  **Locate the `dist` folder**: Open your file explorer on your computer and navigate to:
    `E:\Software Project\Cyber-Runner\dist`
4.  **Drag and Drop**: Drag the entire `dist` folder onto the area on the Netlify page that says "Drag and drop your site folder here".
5.  **Wait for Upload**: Netlify will upload your files and publish them instantly.
6.  **Done!**: You will be given a URL (e.g., `random-name-12345.netlify.app`). You can click this to play your game.

### (Optional) Netlify CLI
If you prefer using the command line:
1.  Install Netlify CLI: `npm install -g netlify-cli`
2.  Login: `netlify login`
3.  Deploy: `netlify deploy --prod --dir=dist`

## Option 2: Vercel

Vercel is another excellent option for React apps.

1.  **Install Vercel CLI**:
    ```bash
    npm install -g vercel
    ```
2.  **Login**:
    ```bash
    vercel login
    ```
3.  **Deploy**:
    Run the following command in the project root (`E:\Software Project\Cyber-Runner`):
    ```bash
    vercel
    ```
    - Follow the prompts (usually just press Enter for defaults).
    - When asked `Which settings do you want to use?`, you can usually accept the defaults detected for Vite.
    - Ensure the "Output Directory" is set to `dist`.

## Option 3: GitHub Pages

Since this is a Vite project, deploying to GitHub Pages requires a bit more configuration (setting the `base` path in `vite.config.js`).
If you prefer GitHub Pages, let me know, and I can configure the project for it.

## Important Notes

-   **Firebase**: Your project uses Firebase. Ensure your Firebase security rules allow requests from your new domain (Netlify/Vercel). You might need to add your new domain to the "Authorized Domains" list in the Firebase Console (Authentication -> Settings -> Authorized Domains).
-   **CORS**: If you have any backend services other than Firebase, ensure they allow requests from your new domain.
