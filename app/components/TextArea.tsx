"use client";
import React, { useState, useEffect } from "react";
import { GoSidebarCollapse, GoSidebarExpand } from "react-icons/go";
import { BsSun, BsMoon } from "react-icons/bs";

export function TextArea() {
    const [text, setText] = useState("");
    const [messages, setMessages] = useState<
        ({ type: "chat"; userId: string; content: string } |
        { type: "join"; userId: string } |
        { type: "leave"; userId: string })[]
    >([]);
    const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
    const [websocket, setWebSocket] = useState<WebSocket | null>(null);
    const [username, setUsername] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [copiedStates, setCopiedStates] = useState<Record<number, boolean>>({});
    const [theme, setTheme] = useState<"light" | "dark">("light");

    // Theme definitions
    const lightTheme = {
        background: "#fff",
        text: "#000",
        chatBackground: "#f9f9f9",
        ownMessageBg: "#dcf8c6",
        otherMessageBg: "#fff",
        border: "#ccc",
        sidebarBg: "#fff",
        inputBorder: "#ddd",
        buttonBg: "#007bff",
        buttonText: "#fff",
    };

    const darkTheme = {
        background: "#1a1a1a",
        text: "#fff",
        chatBackground: "#2a2a2a",
        ownMessageBg: "#2e7d32",
        otherMessageBg: "#424242",
        border: "#555",
        sidebarBg: "#333",
        inputBorder: "#666",
        buttonBg: "#0288d1",
        buttonText: "#fff",
    };

    const currentTheme = theme === "light" ? lightTheme : darkTheme;

    // Determine WebSocket URL based on environment
    const isProduction = process.env.NODE_ENV === "production";
    const WS_URL = isProduction
        ? "wss://raw-websocket-server-production.up.railway.app"
        : "ws://localhost:3001";

    // Generate a funny username
    function generateFunnyUsername() {
        const adjectives = [
            "Sassy", "Wacky", "Goofy", "Silly", "Zany",
            "Quirky", "Bouncy", "Dorky", "Funky", "Nutty"
        ];
        const nouns = [
            "Penguin", "Squirrel", "Pickle", "Waffle", "Noodle",
            "Biscuit", "Llama", "Taco", "Goblin", "Pancake"
        ];
        const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
        const addNumber = Math.random() > 0.5;
        const randomNum = Math.floor(Math.random() * 100);
        return addNumber ? `${randomAdj} ${randomNoun} ${randomNum}` : `${randomAdj} ${randomNoun}`;
    }

    // Set username from localStorage or generate a new one
    useEffect(() => {
        const storedName = localStorage.getItem("funnyUserName");
        if (!storedName) {
            const funnyUserName = generateFunnyUsername();
            localStorage.setItem("funnyUserName", funnyUserName);
            setUsername(funnyUserName);
        } else {
            setUsername(storedName);
        }
    }, []);

    // Establish WebSocket connection
    useEffect(() => {
        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            console.log("WebSocket connected.");
            setIsConnected(true);
            const userId = localStorage.getItem("funnyUserName");
            ws.send(JSON.stringify({ type: "register", userId }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "users") {
                    setConnectedUsers(data.users);
                } else if (data.type === "join") {
                    setConnectedUsers(prev => [...new Set([...prev, data.userId])]);
                    setMessages(prev => [...prev, { type: "join", userId: data.userId }]);
                } else if (data.type === "leave") {
                    setConnectedUsers(prev => prev.filter(id => id !== data.userId));
                    setMessages(prev => [...prev, { type: "leave", userId: data.userId }]);
                } else if (data.type === "chat") {
                    setMessages(prev => [...prev, { type: "chat", userId: data.userId, content: data.content }]);
                } else if (data.type === "error") {
                    console.error("Server error:", data.message);
                }
            } catch (error) {
                console.error("Invalid JSON format:", error);
            }
        };

        ws.onclose = () => {
            console.log("WebSocket closed.");
            setIsConnected(false);
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            setIsConnected(false);
        };

        setWebSocket(ws);

        return () => {
            ws.close();
        };
    }, [WS_URL]); // Re-run if WS_URL changes

    // Send chat message
    const sendMessage = () => {
        if (websocket && websocket.readyState === WebSocket.OPEN && text.trim()) {
            websocket.send(JSON.stringify({ type: "chat", userId: username, content: text }));
            setText("");
        }
    };

    // Rest of the JSX remains unchanged
    return (
        <div
            style={{
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                background: currentTheme.background,
                color: currentTheme.text,
                overflowX: "hidden",
            }}
        >
            {/* Header */}
            <div
                className="flex justify-between p-3 px-5 items-center"
                style={{
                    background: currentTheme.background,
                    borderBottom: `1px solid ${currentTheme.border}`,
                    flexShrink: 0,
                }}
            >
                <div className="flex items-center">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        style={{ marginRight: "10px", background: "none", border: "none", cursor: "pointer", color: currentTheme.text }}
                    >
                        {isSidebarOpen ? <GoSidebarExpand size={23} /> : <GoSidebarCollapse size={23} />}
                    </button>
                    <button
                        className="text-2xl font-bold"
                        onClick={() => window.location.reload()}
                        style={{ background: "none", border: "none", cursor: "pointer", color: currentTheme.text }}
                    >
                        Chat App
                    </button>
                </div>
                <div className="flex items-center gap-1">
                    <div style={{ color: "#42a5f5", fontWeight: "600" }}>{username}</div>
                    <div style={{ position: "relative" }}>
                        <div
                            style={{
                                width: "10px",
                                height: "10px",
                                borderRadius: "50%",
                                backgroundColor: isConnected ? "green" : "red",
                                marginLeft: "5px",
                            }}
                        ></div>
                        <span
                            style={{
                                position: "absolute",
                                top: "100%",
                                left: "50%",
                                transform: "translateX(-50%)",
                                background: currentTheme.background,
                                color: currentTheme.text,
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                visibility: "hidden",
                                opacity: 0,
                                transition: "opacity 0.2s",
                            }}
                            className="connection-tooltip"
                        >
                            {isConnected ? "Server Connected" : "Server Disconnected"}
                        </span>
                        <style jsx>{`
                            div:hover .connection-tooltip {
                                visibility: visible;
                                opacity: 1;
                            }
                        `}</style>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                {/* Connected Users Sidebar */}
                {isSidebarOpen && (
                    <div
                        style={{
                            width: "200px",
                            borderRight: `1px solid ${currentTheme.border}`,
                            padding: "10px",
                            overflowY: "auto",
                            background: currentTheme.sidebarBg,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            flexShrink: 0,
                        }}
                    >
                        <div>
                            <strong>Online Users</strong>
                            <ul style={{ listStyle: "none", padding: 0 }}>
                                {connectedUsers.map((user, index) => (
                                    <li key={index} style={{ padding: "5px 0" }}>{user}</li>
                                ))}
                            </ul>
                        </div>
                        <div style={{ display: "flex", justifyContent: "end", padding: "10px 0" }}>
                            <button
                                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                                style={{
                                    background: theme === "light" ? darkTheme.background : lightTheme.background,
                                    border: "none",
                                    cursor: "pointer",
                                    color: theme === "light" ? darkTheme.text : lightTheme.text,
                                    padding: "8px",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "32px",
                                    height: "32px",
                                }}
                            >
                                {theme === "light" ? <BsMoon size={20} /> : <BsSun size={20} />}
                            </button>
                        </div>
                    </div>
                )}

                {/* Chat Area */}
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                    }}
                >
                    {/* Chat History */}
                    <div
                        style={{
                            flex: 1,
                            overflowY: "auto",
                            padding: "10px",
                            background: currentTheme.chatBackground,
                        }}
                    >
                        {messages.map((msg, index) => {
                            if (msg.type === "chat") {
                                const isCurrentUser = msg.userId === username;
                                return (
                                    <div
                                        key={index}
                                        style={{
                                            display: "flex",
                                            justifyContent: isCurrentUser ? "flex-end" : "flex-start",
                                            margin: "10px 0",
                                        }}
                                    >
                                        <span
                                            style={{
                                                display: "inline-block",
                                                padding: "8px 12px",
                                                borderRadius: "10px",
                                                background: isCurrentUser ? currentTheme.ownMessageBg : currentTheme.otherMessageBg,
                                                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                                                maxWidth: "70%",
                                                whiteSpace: "pre-wrap",
                                                wordBreak: "break-word",
                                                color: currentTheme.text,
                                            }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                <strong>{msg.userId}</strong>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(msg.content);
                                                        setCopiedStates((prev) => ({ ...prev, [index]: true }));
                                                        setTimeout(() => {
                                                            setCopiedStates((prev) => ({ ...prev, [index]: false }));
                                                        }, 3000);
                                                    }}
                                                    style={{
                                                        marginLeft: "10px",
                                                        padding: "4px 8px",
                                                        fontSize: "12px",
                                                        background: "transparent",
                                                        border: "none",
                                                        borderRadius: "5px",
                                                        cursor: "pointer",
                                                        color: currentTheme.text,
                                                    }}
                                                >
                                                    {copiedStates[index] ? "Copied!" : "Copy"}
                                                </button>
                                            </div>
                                            <div style={{ marginTop: "8px" }}>{msg.content}</div>
                                        </span>
                                    </div>
                                );
                            } else if (msg.type === "join") {
                                return (
                                    <div
                                        key={index}
                                        style={{ textAlign: "center", color: "green", fontStyle: "italic" }}
                                    >
                                        {msg.userId} has joined the chat.
                                    </div>
                                );
                            } else if (msg.type === "leave") {
                                return (
                                    <div
                                        key={index}
                                        style={{ textAlign: "center", color: "red", fontStyle: "italic" }}
                                    >
                                        {msg.userId} has left the chat.
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </div>

                    {/* Message Input */}
                    <div
                        style={{
                            padding: "10px",
                            borderTop: `1px solid ${currentTheme.border}`,
                            display: "flex",
                            background: currentTheme.background,
                            flexShrink: 0,
                        }}
                    >
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            placeholder="Type your message..."
                            style={{
                                flex: 1,
                                padding: "8px",
                                marginRight: "10px",
                                border: `1px solid ${currentTheme.inputBorder}`,
                                borderRadius: "4px",
                                resize: "none",
                                height: "40px",
                                background: currentTheme.background,
                                color: currentTheme.text,
                            }}
                        />
                        <button
                            onClick={sendMessage}
                            style={{
                                padding: "8px 16px",
                                background: currentTheme.buttonBg,
                                color: currentTheme.buttonText,
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                            }}
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}