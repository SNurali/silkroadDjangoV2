import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Send, User, Bot, AlertCircle } from 'lucide-react';

export default function SupportChat() {
    const { id } = useParams();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchHistory();
        const interval = setInterval(fetchHistory, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchHistory = async () => {
        try {
            const response = await api.get(`/chat/support/history/${id}/`);
            setMessages(response.data);
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const text = inputText;
        setInputText('');
        setIsLoading(true);

        try {
            await api.post(`/chat/support/send/${id}/`, { text });
            fetchHistory(); // Refresh immediately
        } catch (error) {
            console.error("Failed to send reply", error);
            alert("Failed to send message");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100 p-4">
            <div className="bg-white rounded-lg shadow-md flex-1 max-w-4xl mx-auto w-full flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <AlertCircle /> Support Console - Conversation #{id}
                    </h1>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'support' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex flex-col max-w-[70%] ${msg.sender === 'support' ? 'items-end' : 'items-start'}`}>
                                <div className={`flex items-center gap-2 text-xs text-gray-500 mb-1`}>
                                    {msg.sender === 'user' && <User size={12} />}
                                    {msg.sender === 'bot' && <Bot size={12} />}
                                    <span className="capitalize">{msg.sender}</span>
                                    <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div className={`p-3 rounded-lg text-sm shadow-sm ${msg.sender === 'support'
                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                        : msg.sender === 'bot'
                                            ? 'bg-gray-200 text-gray-800'
                                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                                    }`}>
                                    {msg.attachment ? (
                                        <div className="text-xs italic">[Attachment: {msg.attachment}]</div>
                                    ) : null}
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-gray-200">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type a reply as Support Agent..."
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !inputText.trim()}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2 font-medium"
                        >
                            <Send size={18} /> Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
