# 🔎 Kamil Wallet Tracker (Solana Fund Flow Tracer MVP)

> A minimal on-chain intelligence tool for tracing token movements across Solana wallets, highlighting Binance inflows/outflows and tracking fund flow patterns with a clean visual dashboard.

## 🚀 Overview

This MVP tracks token transfers starting from one or more wallet addresses, revealing where funds were sent, when, and what tokens were involved. It also flags any Binance-related movements. Built for fund investigators, researchers, and degens wanting to unravel suspicious token flows.

---

## 🧠 Features

- ✅ **Multi-wallet tracing**: Input multiple Solana wallets (comma-separated).
- ✅ **Token filter**: Focus on specific tokens in the trace.
- ✅ **Timeline table**: Clean table view showing `from`, `to`, `token`, `amount`, and `timestamp`.
- ✅ **Binance detection**: Flags inflows/outflows to known Binance wallets.
- ✅ **Export options**: Download trace results as CSV or PDF.
- ✅ **Mobile-friendly UI**: Responsive, client-ready frontend built with TailwindCSS + Next.js.

---

## 📸 Demo Screenshot

*Insert a screenshot here once you’re ready*

---

## 🧱 Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Data Fetching**: API route in `/api/trace-flow`
- **State Management**: React `useState` + props
- **Binance Detection**: Static list (can be replaced by a live API)
- **Exporting**: `papaparse`, `jspdf`, `file-saver`

---

## 🧪 Usage

1. Clone the repo:

   ```bash
   git clone https://github.com/your-username/kamil-wallet-tracker.git
   cd kamil-wallet-tracker
Install dependencies:

bash
Copy code
npm install
Create a .env.local if needed (e.g. for API keys or config)

Run the dev server:

bash
Copy code
npm run dev
Open http://localhost:3000 in your browser and start tracing.

📂 Project Structure
bash
Copy code
/components
  ├── TraceFlowUI.tsx         # Main frontend component with input + table
  ├── FlowTimelineTable.tsx   # Table with export buttons (CSV, PDF)

/pages/api
  ├── trace-flow.ts           # Server-side logic for tracing funds

/utils
  ├── exportUtils.ts          # CSV and PDF download helpers
🪪 Attribution
This tool was built as part of a custom MVP for a Solana fund investigation project. All Binance wallet tags used are public and static (subject to updates).

🛠 Future Ideas (v2/Milestone 2)
 Graph view of wallet relationships (nodes & edges)

 Smart wallet clustering (detect related wallets)

 Real-time alerts for suspicious flows

 Ghost token awakening detection

 Volume-based anomaly flags

📬 Contact
Built with 💻 by Obaka (@yourhandle).
Need a custom blockchain intelligence dashboard? Let’s talk.

📄 License
MIT – do what you want, but don't be evil.

yaml
Copy code

---




