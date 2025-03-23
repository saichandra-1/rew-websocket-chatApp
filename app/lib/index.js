const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

const wss = new WebSocket.Server({ port: 3001 });

const clients = new Map();

wss.on("connection", (ws) => {
    const socketId = uuidv4();
    clients.set(socketId, { socket: ws, userId: null });

    ws.on("message", (message) => {
        console.log(`Message from ${socketId}: ${message}`);
        try {
            const data = JSON.parse(message);
            if (data.type === "register" && data.userId) {
                // Associate userId with socket
                clients.get(socketId).userId = data.userId;
                // Send list of connected users to the new client
                const connectedUserIds = Array.from(clients.values())
                    .filter(client => client.userId !== null)
                    .map(client => client.userId);
                ws.send(JSON.stringify({
                    type: "users",
                    users: connectedUserIds
                }));
                // Broadcast join message to all clients
                const joinMessage = JSON.stringify({
                    type: "join",
                    userId: data.userId
                });
                clients.forEach((client) => {
                    if (client.socket.readyState === WebSocket.OPEN) {
                        client.socket.send(joinMessage);
                    }
                });
            } else if (data.type === "chat" && data.content) {
                const client = clients.get(socketId);
                if (client.userId) {
                    // Broadcast chat message to all clients
                    const broadcastMessage = JSON.stringify({
                        type: "chat",
                        userId: client.userId,
                        content: data.content
                    });
                    clients.forEach((c) => {
                        if (c.socket.readyState === WebSocket.OPEN) {
                            c.socket.send(broadcastMessage);
                        }
                    });
                } else {
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "User not registered"
                    }));
                }
            }
        } catch (error) {
            console.error("Invalid message format:", error);
            ws.send(JSON.stringify({
                type: "error",
                message: "Invalid message format"
            }));
        }
    });

    ws.on("close", () => {
        const client = clients.get(socketId);
        if (client && client.userId) {
            // Broadcast leave message
            const leaveMessage = JSON.stringify({
                type: "leave",
                userId: client.userId
            });
            clients.forEach((c) => {
                if (c.socket.readyState === WebSocket.OPEN) {
                    c.socket.send(leaveMessage);
                }
            });
        }
        clients.delete(socketId);
        console.log(`Socket ${socketId} disconnected`);
    });

    ws.on("error", (error) => {
        console.error(`Error on socket ${socketId}:`, error);
    });
});

console.log("WebSocket server running on ws://localhost:3001");