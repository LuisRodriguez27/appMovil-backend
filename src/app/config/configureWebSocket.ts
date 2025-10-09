import http from "http";
import {WebSocket} from "../WebSocket";
import {Server as WebSocketServer} from "socket.io";
import {ContainerBuilder} from "node-dependency-injection";

export function configureWebSocket(server: http.Server, container: ContainerBuilder): WebSocket {
    const io = new WebSocketServer(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    return new WebSocket(io, container)
}