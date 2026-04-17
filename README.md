# 🏹 Drona AI: Intelligent Resume Screening & Selection
**A Surgical, Forensic AI Recruitment Platform**

This document serves as a comprehensive, easy-to-understand history of every major feature and architectural upgrade we built into **Drona AI**.

---

## 1. 🌐 The Full-Stack Bridge
**What we did:** We transformed a visual frontend interface into a fully working application by building a Python Server (`backend/app.py`). 
**Why it matters:** This allowed your React Dashboard to securely send uploaded PDF files over to Python, where the files are converted into raw text and processed by the system.

## 2. 🧠 Native AI Brain Integration
**What we did:** We plugged Google's **Gemini 3.0 Flash AI** natively into the backend using your secure `.env` API key. We also programmed strict instructions (Prompt Engineering) forcing the AI to strictly output highly mathematical JSON structures.
**Why it matters:** Instead of hardcoded dummy data, the application now acts like a human recruiter! It literally reads the Job Description, contrasts it against the Candidate's PDF, identifies skill gaps, and calculates a dynamic score based on text analysis.

## 3. 🎯 Humanized Grading Adjustments
**What we did:** We fixed an issue where the AI was grading resumes far too harshly. We injected strict, explicitly tailored prompts into `backend/prompts.py`.
**Why it matters:** The AI was instructed to heavily reward the candidate and significantly boost their score if their resume had similar technologies or intersecting keyword overlaps with the job description!

## 4. ⚡ Mass-Scale Concurrency (The 100 Resume Fix)
**What we did:** We completely tore out the standard `while-loop` architecture on the server and replaced it with a Python **Thread Pool Executor**. 
**Why it matters:** By spawning 5 parallel "lanes", the server can process huge drag-and-drop batches (like 50 to 100 resumes) completely simultaneously! We also built in "rate-limit avoidance," meaning if the server ever hits an API limit, it safely pauses exactly 2 seconds and perfectly resumes, guaranteeing your system will *never* crash from high load!

## 5. 🗃️ Complete Historical Database (SQLite)
**What we did:** The system originally suffered from "amnesia" (refreshing the page deleted everything). We hard-coded `backend/database.py` which spawns a dedicated SQLite database living permanently on your machine.
**Why it matters:** Every single mark, score, and skill gap the AI processes is now permanently injected into a database table. Even if you turn your computer off for a week, your previously processed candidates will still be perfectly loaded onto the dashboard the next time you boot up!

## 6. 📁 Campaign & Workspace Segmentation
**What we did:** We introduced the concept of **Workspaces**. We rebuilt the "Create" Job panel and added a sleek row of tabs right at the top of your visual dashboard.
**Why it matters:** Recruiters can now spin up separate databases for separate jobs. You can create a "Junior ML Engineer" workspace and a "Senior Backend" workspace. Clicking the UI Tabs instantly flips the whole dashboard between the two profiles completely fluidly alongside their historical records!

## 7. ⌨️ The Hybrid Job Title Combobox 
**What we did:** We combined a Dropdown Menu and a Text Box into a single magical HTML5 `datalist` element on your Campaign Creation window.
**Why it matters:** You can now instantly click standard roles from a dropdown (like 'DevOps' or 'Data Scientist') **OR** just manually click the box and type out absolutely any custom "Job Title" text you want without navigating confusing menus!

## 8. 🛡️ Hardened Minimum Target Logic
**What we did:** We removed the AI's ability to arbitrarily "Shortlist" or "Reject" candidates. Instead, we added an interactive Range Slider to the UI so you can define an exact mathematical threshold (e.g., 85). We built a database migration script to tie that score specifically to the backend.
**Why it matters:** Mathematical precision! The moment the AI calculates a score of `82`, our rigid Python logic strictly evaluates if it hits the threshold. We programmed it to violently overwrite the AI's guesswork, ensuring candidates are flawlessly and logically rejected or shortlisted every single time based *only* on your direct slider threshold.

## 9. ✏️ Active Campaign Management (Edit/Delete)
**What we did:** We expanded the database by writing dedicated `UPDATE` and `DELETE` SQL scripts. On the React UI, we integrated an `<EditWorkspacePanel />` component that seamlessly binds right into the Dashboard header.
**Why it matters:** Recruiters can now organically pivot an ongoing campaign! Without erasing existing records, you can click "Edit" to dynamically adjust a previously locked Job Description or manually change the AI threshold halfway through hiring. Alternatively, you can permanently wipe a dead workspace right out of the database clicking the Red Delete icon.

## 11. 🎨 Unified Design System & Light Mode Optimization
**What we did:** We completely refactored the CSS architecture into a centralized "Design System" in `src/index.css`. We ripped out hardcoded dark-mode HEX colors from individual components and replaced them with dynamic CSS tokens like `var(--panel-bg)` and `var(--surface-color)`.
**Why it matters:** This fixed the "eye irritation" issues in Light Mode. The application now seamlessly and beautifully transitions between a professional "Enterprise White" theme and a "Midnight Neon" dark mode, ensuring perfect legibility and a premium feel regardless of the user's theme preference. 

---
*Last updated: April 16, 2026*
