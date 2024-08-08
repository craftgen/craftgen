# Self-Host Supabase Edge Functions Demo

## Deploy to Fly.io

- Clone this repository.
- Copy your edge functions to `./functions` directory.
- [Optional] Modify the `./functions/main/index.ts` to add custom request handling and routing logic.
- Open `fly.toml` and update the app name and optionally the region etc.
- In your terminal, run `fly apps create` and sepcify the app name you just set in your `fly.toml` file.
- Finally, run `fly deploy`.

## Run locally

- Build the container image: `docker compose up --build`
- Visit http://localhost:8000/oak

File changes in the `/functions` directory will automatically be detected, except for the `/main/index.ts` function as it is a long running server.
