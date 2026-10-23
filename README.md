# 🍳 Live KDS (Kitchen Display System & KOT)

A high-performance, real-time Kitchen Display System inspired by the seamless order fulfillment flow of **Swiggy & Zomato Merchant/Kitchen POS**.

Built with React 18 and Vite. Responsive across **Smart TVs, Desktop PCs, Tablets (iPads/Android), and Mobile Phones**.

---

## 🚀 Features

* **Swiggy/Zomato Flow**:
  1. **New Order Arrival**: High-priority audio siren + flashing banner + instant one-touch Accept.
  2. **In Kitchen (Preparing)**: Live timer with color-coded urgency (Green < 10m, Amber 10-20m, Red > 20m). Interactive item checklist with strike-off.
  3. **Ready to Serve / Handover**: One-tap dispatch when food is prepared.
  4. **Recent / Recall Drawer**: 1-tap undo if a ticket is bumped accidentally.
* **Redundant Kitchen Sound System**:
  - Web Audio API dual-tone synthesized bell (853Hz + 960Hz) works even with no internet/file downloads.
  - Pre-buffered HTML5 audio fallback (`/sounds/kot_bell.wav`).
  - Mobile touch-unlock banner bypassing browser autoplay restrictions on phones/tablets.
* **Multi-Device Responsive**:
  - **PC / Smart TV / Kitchen Wall Monitor**: Wide 4-column Kanban board or Matrix Grid with F11 fullscreen kiosk support and screen wake-lock.
  - **Tablet**: High-touch 2-column view with 52px+ touch targets for kitchen staff.
  - **Phone**: Bottom navigation tabs (`New`, `Prep`, `Ready`) and swipeable order sheets.
* **Thermal KOT Printing**:
  - Instant print preview formatted for 58mm and 80mm thermal ESC/POS receipt printers.
* **Order Filters**:
  - Filter by `ALL`, `DINE-IN 🍽️`, `TAKEAWAY 🛍️`, `DELIVERY 🛵`.
  - Search by Table number, Bill number, or Item name.

---

## 🛠️ How to Run

1. Make sure your FastAPI backend is running on `http://localhost:8001` (or configure `.env`).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the KDS dev server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3005` in your browser.
   To open on a tablet or mobile phone on the same Wi-Fi network, use the network IP shown in the terminal (e.g., `http://192.168.1.X:3005`).

---

## 📦 Pushing to a New Git Repository

This standalone project is self-contained. To push it to a brand new repository:

```bash
git init
git add .
git commit -m "Initial commit: Swiggy-style Live KDS & KOT app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_NEW_KDS_REPO.git
git push -u origin main
```
