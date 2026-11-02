# trinity.ai TypeScript frontend

A responsive, browser-only chatbot frontend based on the supplied template. It keeps the original black-and-white palette, video backdrop, and quote and input animations. Its inline SVG mascot is a motion-ready interpretation of the uploaded orange character.

## Features

- Responsive landing and conversation views
- Suggested prompts and a new-chat action
- Local chat history with search, open, and delete controls
- Settings for the saved display name and clearing chat history
- Local file selection for DOCX, PPTX, Markdown, common CAD formats, and PCB design/export formats
- File names shown in chat; file contents are not uploaded or analyzed until a backend is connected
- Idle motion raises a laddoo toward the character's trunk; while a reply is prepared, it runs across the bar with a swinging hammer and alternating legs

## Run locally

1. Compile the TypeScript: `npx tsc -p tsconfig.json`.
2. Serve this folder with a local web server. For example, run `python -m http.server 8000` here.
3. Open `http://localhost:8000/chatbot.ui.html`.

The chat replies are local example responses; this frontend does not connect to an AI service.
