const eventManager = new globalThis.EventManager();

console.log("event manager running");

for await (const data of eventManager) {
  if (data) {
    switch (data.event_type) {
      case "Log":
        if (data.event.level === "Error") {
          console.error("[EM]", data.event.msg);
        } else {
          console.log("[EM]", data.event.msg);
        }
        break;
      case "UncaughtException":
        console.error("[EM]", data.event.exception);
        break;
      default:
        console.log("[EM]", data);
    }
  }
}
