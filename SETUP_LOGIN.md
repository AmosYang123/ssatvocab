# 🔑 SSAT Vocab - Authentication Setup Guide

This guide will walk you through the **exact** steps to set up Social Logins (Google, GitHub, etc.) and the "Quick Access" system in Supabase.

---

## 🛠️ Step 0: Essential Supabase Settings (Do this first!)

**Purpose:** Allows "Quick Accounts" (fake emails) to work without waiting for email verification.

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project.
3. Click the **Authentication** icon (the lock symbol) in the far-left sidebar.
4. In the secondary sidebar (next to the icons), find the **Configuration** section and click **Providers**.
5. **Configure Email Provider:**
    * Find **Email** in the list of providers and click it to expand.
    * **Toggle OFF:** `Confirm email`. (Crucial! If this is on, Quick Accounts won't work).
    * **Toggle OFF:** `Secure change password`.
    * Click **Save** at the bottom of the Email section.
6. **Set Site URL:**
    * In the same secondary sidebar, click **URL Configuration**.
    * **Site URL:** Enter your Vercel URL (e.g., `https://your-app-name.vercel.app`) or `http://localhost:5173` for testing.
    * Click **Save**.

---

## 🌐 Get Your "Redirect URL"

You will need this for every social provider below.

1. Go to **Authentication** > **Providers**.
2. Click on any provider (like Google) just to see the settings.
3. Copy the URL in the box labeled **Redirect URL** (it looks like `https://xyz.supabase.co/auth/v1/callback`).

---

## 🔵 1. Set Up Google Login

1. **Site:** Go to [Google Cloud Console](https://console.cloud.google.com/).
2. **Project:** Click the dropdown at the top left > **New Project** > Give it a name > **Create**.
3. **Consent Screen:**
    * Search for "OAuth consent screen" in the top bar.
    * Select **External** > **Create**.
    * Enter **App name** ("SSAT Vocab"), **User support email**, and **Developer contact info**.
    * Click **Save and Continue** until the end (ignore Scopes for now).
4. **Credentials:**
    * Search for "Credentials" in the top bar.
    * Click **+ Create Credentials** > **OAuth client ID**.
    * **Application type:** Select `Web application`.
    * **Authorized redirect URIs:** Click **+ ADD URI** and paste your **Supabase Redirect URL**.
    * Click **Create**.
5. **Finish:** Copy the `Client ID` and `Client Secret` and paste them into **Supabase** under **Authentication > Providers > Google**.

---

## ⬛ 2. Set Up GitHub Login

1. **Site:** Go to your [GitHub Settings](https://github.com/settings/profile).
2. **OAuth App:** Scroll down on the left to **Developer settings** > **OAuth Apps** > **New OAuth App**.
3. **Fields:**
    * **Application name:** `SSAT Vocab Mastery`.
    * **Homepage URL:** Your app URL (e.g., `https://your-app.vercel.app`).
    * **Authorization callback URL:** Paste your **Supabase Redirect URL**.
4. **Finalize:** Click **Register application**.
5. **Secret:** Click **Generate a new client secret**.
6. **Finish:** Copy the `Client ID` and the new `Client Secret` into **Supabase** under **Authentication > Providers > GitHub**.

---

## � Final Verification

1. In Supabase, once a provider (Google or GitHub) is enabled and saved, try clicking the button on your app's login page.
2. If it says `provider_not_enabled`, double-check that you hit "Save" inside the Supabase Provider settings!
