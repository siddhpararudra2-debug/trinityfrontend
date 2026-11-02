# Vesper.ai TypeScript frontend

A responsive, browser-only chatbot frontend based on the supplied Trinty template. It keeps the original black-and-white palette, video backdrop, and quote and input animations.

## Features

- Responsive landing and conversation views
- Suggested prompts and a new-chat action
- Local chat history with search, open, and delete controls
- Settings for the saved display name and clearing chat history
- Conversations stored in the browser on this device

## Run locally

1. Compile the TypeScript: `npx tsc -p tsconfig.json`.
2. Serve this folder with a local web server. For example, run `python -m http.server 8000` here.
3. Open `http://localhost:8000/chatbot.ui.html`.

The chat replies are local example responses; this frontend does not connect to an AI service.
