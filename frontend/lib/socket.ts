import { io, type Socket } from "socket.io-client";

export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

export const createSocket = (token: string): Socket =>
  io(SOCKET_URL, {
    transports: ["websocket"],
    auth: {
      token
    }
  });

