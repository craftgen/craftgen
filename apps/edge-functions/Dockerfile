FROM ghcr.io/supabase/edge-runtime:v1.54.9

COPY ./functions /home/deno/functions

CMD [ "start", "--main-service", "/home/deno/functions/main" , "--event-worker", "/home/deno/functions/event"]
