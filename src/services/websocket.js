export function createWS(onMessage) {
  const ws = new WebSocket("ws://localhost:8000/api/ws");

  ws.onopen = () => console.log("WS connected");
  ws.onmessage = onMessage;
  ws.onerror = () => {};
  ws.onclose = () => {};

  return ws;
}
