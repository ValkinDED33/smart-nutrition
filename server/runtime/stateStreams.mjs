import { sendError } from "../lib/http.mjs";

export const createStateStreamRuntime = ({ stateService }) => {
  const stateStreams = new Map();

  const addStateStream = (userId, response) => {
    const streams = stateStreams.get(userId) ?? new Set();
    streams.add(response);
    stateStreams.set(userId, streams);
  };

  const removeStateStream = (userId, response) => {
    const streams = stateStreams.get(userId);

    if (!streams) {
      return;
    }

    streams.delete(response);

    if (streams.size === 0) {
      stateStreams.delete(userId);
    }
  };

  const broadcastStateMeta = async (user) => {
    const streams = stateStreams.get(user.id);

    if (!streams || streams.size === 0) {
      return;
    }

    const payload = JSON.stringify(await stateService.getSnapshotMeta(user));

    streams.forEach((streamResponse) => {
      streamResponse.write(`event: state-updated\n`);
      streamResponse.write(`data: ${payload}\n\n`);
    });
  };

  const handleStateStream = async ({ request, response, authService }) => {
    const auth = await authService.authenticateRequest(request);

    if (!auth) {
      sendError(response, 401, "INVALID_CREDENTIALS", "Session expired.");
      return;
    }

    response.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    });
    response.write(`event: connected\n`);
    response.write(`data: ${JSON.stringify(await stateService.getSnapshotMeta(auth.user))}\n\n`);
    addStateStream(auth.user.id, response);

    const heartbeatId = setInterval(() => {
      response.write(`event: ping\ndata: {}\n\n`);
    }, 20_000);

    request.on("close", () => {
      clearInterval(heartbeatId);
      removeStateStream(auth.user.id, response);
    });
  };

  return {
    stateStreams,
    broadcastStateMeta,
    handleStateStream,
  };
};
