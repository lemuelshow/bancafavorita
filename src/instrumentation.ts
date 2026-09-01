export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { startResultsPoller } = await import("./lib/results-poller");
  startResultsPoller();
}
