import http from "http";
import { Server } from "socket.io";
import { createApp } from "./app";
import { allowedOrigins, env } from "./config/env";
import { registerSocketServer } from "./lib/socket-server";
import { setupSocket } from "./socket";

const app = createApp();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

registerSocketServer(io);
setupSocket(io);

server.listen(env.PORT, () => {
  console.log(`SyncDoc backend listening on port ${env.PORT}`);
});
