<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1cgIXwZvc8fXEUR2UWE2jDVNpPsaiNQED

## Run Locally

### Frontend (Vite + React)

**Prerequisites:** Node.js 18+

1. Install dependencies: `npm install`
2. (Optional) Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Start the dev server: `npm run dev`

The Vite dev server proxies API requests to `http://localhost:5000` by default. Override the proxy target by setting `VITE_API_PROXY` in your environment if necessary.

### Backend (Flask)

**Prerequisites:** Python 3.11+

1. Create a virtual environment and activate it.
2. Install dependencies: `pip install -r backend/requirements.txt`
3. Run the API server: `python -m backend.app`

When Flask is not available (for example in restricted environments), the backend falls back to a lightweight stub so that tests can still exercise the API surface.

### Full build

Build the frontend and serve it from Flask by running `npm run build`. The generated files in `dist/` are served by the backend when available.

### Tests

Run the Python test suite (which exercises the Flask endpoints and extraction workflow with short time windows) using:

```
pytest
```
