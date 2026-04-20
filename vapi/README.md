# Vapi Configuration Package

This folder contains the complete Vapi assistant package for CRAVAB:

- `system-prompt.md`: production prompt with mandatory flow and 24-function set
- `prompts/system-prompt-template.md`: generic reusable template
- `prompts/system-prompt-plumbing.md`: plumbing-specific template
- `tools/functions.json`: full 24-function definitions and JSON schemas for Vapi dashboard
- `docs/SETUP.md`: step-by-step Vapi setup instructions

## Usage

1. Create an assistant in Vapi.
2. Copy `system-prompt.md` (or a template in `prompts/`) into the assistant prompt.
3. Import tool definitions from `tools/functions.json` (24 functions).
4. Point each tool to CRAVAB webhook endpoint.
5. Set the webhook secret in both Vapi and `.env.local`.

## Notes

- Keep tenant routing in CRAVAB backend; do not hardcode tenant IDs in tool specs.
- Prefer server-side validation in `src/app/api/vapi/webhook/route.ts` as source of truth.
- For full product overview, business context, run instructions, and screenshots, see the root `README.md`.
