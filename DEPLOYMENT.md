# 🚀 Quick Deployment Guide

Follow these steps to host your Intelligent Resume Screening & Job Matching System live on the web for free!

---

## Part 1: Setting up GitHub
1.  **Create a New Repo:** Go to GitHub and create a new repository called `intelligent-resume-screening`.
2.  **Push your Code:** Follow the instructions on GitHub to push your local folder to that repository.
    ```bash
    git init
    git add .
    git commit -m "First deployment"
    git branch -M main
    git remote add origin https://github.com/YOUR_USERNAME/repo-name.git
    git push -u origin main
    ```

---

## Part 2: Hosting the Backend (Render.com)
1.  **Sign Up:** Go to [Render.com](https://render.com) and create a free account.
2.  **New Web Service:** Click **+ New** > **Web Service**.
3.  **Connect GitHub:** Select your repository.
4.  **Configuration:**
    *   **Name:** `resume-backend`
    *   **Root Directory:** `backend`
    *   **Environment:** `Python`
    *   **Build Command:** `pip install -r requirements.txt`
    *   **Start Command:** `gunicorn app:app`
5.  **Environment Variables:** Click the **Environment** tab and add:
    *   `SUPABASE_URL`: (Copy from your Supabase settings)
    *   `SUPABASE_KEY`: (Copy from your Supabase settings)
    *   `GEMINI_API_KEY`: (Your Google AI key)
6.  **Deploy:** Click Deploy. Once it finishes, copy the URL provided (e.g., `https://resume-backend.onrender.com`).

---

## Part 3: Hosting the Frontend (Vercel)
1.  **Sign Up:** Go to [Vercel.com](https://vercel.com) and create a free account.
2.  **Add New Project:** Connect your GitHub account and select your repository.
3.  **Configuration:**
    *   **Framework Preset:** Vite
    *   **Root Directory:** `./` (the main folder)
4.  **Environment Variables:** Add these:
    *   `VITE_SUPABASE_URL`: (Your Supabase URL)
    *   `VITE_SUPABASE_ANON_KEY`: (Your Supabase Anon Key)
    *   `VITE_API_URL`: (The URL you copied from Render in Part 2)
5.  **Deploy:** Click Deploy.

---

## ✅ You're Live!
Your website will now be accessible to anyone at your Vercel URL (e.g., `https://intelligent-resume-screening.vercel.app`).

### Notes:
*   **Cold Starts:** Since Render is on a free tier, it might take 30-50 seconds to "wake up" the first time you visit it after a while.
*   **Security:** Your API keys are now hidden on the backend and won't be exposed to the public.
