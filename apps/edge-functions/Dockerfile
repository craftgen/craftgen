FROM ghcr.io/supabase/edge-runtime:v1.54.9

# copy symlinked packages to functions folder

COPY ./functions /home/deno/functions

CMD [ "start", "--main-service", "/home/deno/functions/main" , "--event-worker", "/home/deno/functions/event", "--import-map", "/home/deno/functions/import_map.json"]
