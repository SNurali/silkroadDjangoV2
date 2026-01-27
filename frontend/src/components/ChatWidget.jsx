import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Paperclip, Image as ImageIcon, Briefcase, MapPin, User, AlertCircle } from 'lucide-react';
import api, { sendChatMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function ChatWidget() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState(() => localStorage.getItem('chat_conv_id'));
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const pollingRef = useRef(null);

    // Persist conversationId
    useEffect(() => {
        if (conversationId) {
            localStorage.setItem('chat_conv_id', conversationId);
        }
    }, [conversationId]);

    // Initial welcome or restore history
    useEffect(() => {
        if (isOpen) {
            if (conversationId) {
                // Restore history if we have an ID
                fetchHistory();
            } else if (messages.length === 0) {
                setMessages([
                    { id: 'welcome', sender: 'bot', text: t('chatbot.welcome') }
                ]);
            }
        }
    }, [isOpen, conversationId, t, messages.length]); // Added t and messages.length back for the welcome message condition

    const fetchHistory = async () => {
        if (!conversationId) return;
        try {
            // Assuming 'api' is imported or available globally
            const response = await api.get(`/chat/support/history/${conversationId}/`);
            setMessages(response.data);
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    };

    // Polling for new messages
    useEffect(() => {
        if (isOpen && conversationId) {
            startPolling();
        } else {
            stopPolling();
        }
        return () => stopPolling();
    }, [isOpen, conversationId]);

    const startPolling = () => {
        if (pollingRef.current) return;
        console.log("DEBUG: Starting chat polling for ID", conversationId);
        pollingRef.current = setInterval(async () => {
            try {
                // We use the ID to fetch full history
                // Assuming 'api' is imported or available globally
                const response = await api.get(`/chat/support/history/${conversationId}/`);

                // Use functional update to ensure we have the latest messages state
                setMessages(prevMessages => {
                    if (response.data.length > prevMessages.length) {
                        console.log("DEBUG: New messages received via polling");
                        return response.data;
                    }
                    return prevMessages;
                });
            } catch (error) {
                console.error("Polling failed", error);
            }
        }, 4000); // Poll every 4 seconds
    };

    const stopPolling = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    };

    const handleSend = async (overrideText = null) => {
        const textToSend = overrideText || inputText;
        if (!textToSend.trim() && !attachment) return;

        const currentAttachment = attachment;
        const currentText = textToSend;

        // Optimistic update
        const userMsg = {
            id: Date.now(),
            sender: 'user',
            text: currentText,
            attachment: currentAttachment ? {
                url: URL.createObjectURL(currentAttachment),
                type: currentAttachment.type,
                name: currentAttachment.name
            } : null
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setAttachment(null);
        setIsLoading(true);

        try {
            let payload;
            if (currentAttachment) {
                payload = new FormData();
                payload.append('text', currentText);
                if (conversationId) payload.append('conversation_id', conversationId);
                payload.append('attachment', currentAttachment);
            } else {
                payload = {
                    text: currentText,
                    conversation_id: conversationId
                };
            }

            const response = await sendChatMessage(payload);

            if (response.conversation_id) {
                setConversationId(response.conversation_id);
            }

            const botMsg = {
                id: Date.now() + 1,
                sender: 'bot',
                text: response.bot_message
            };
            setMessages(prev => [...prev, botMsg]);

        } catch (error) {
            console.error("Failed to send message", error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'bot',
                text: 'Sorry, I am having trouble connecting to the server.'
            }]);
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

    const renderMessageText = (text) => {
        // Simple markdown-like link parsing [Link Text](/path)
        const parts = text.split(/(\[.*?\]\(.*?\))/g);
        return parts.map((part, index) => {
            const match = part.match(/\[(.*?)\]\((.*?)\)/);
            if (match) {
                return <Link key={index} to={match[2]} className="text-blue-200 hover:underline font-semibold" onClick={() => setIsOpen(false)}>{match[1]}</Link>;
            }
            return part;
        });
    };

    const QuickActions = () => (
        <div className="flex gap-2 overflow-x-auto p-2 pb-0 scrollbar-hide bg-gray-50 border-t border-gray-100">
            <button onClick={() => handleSend(t('chatbot.actions.find_hotel'))} className="flex-shrink-0 flex items-center gap-1 bg-white border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-700 hover:bg-gray-100 transition shadow-sm">
                <MapPin size={12} className="text-blue-500" /> {t('chatbot.actions.find_hotel')}
            </button>
            <button onClick={() => handleSend(t('chatbot.actions.find_tour'))} className="flex-shrink-0 flex items-center gap-1 bg-white border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-700 hover:bg-gray-100 transition shadow-sm">
                <Briefcase size={12} className="text-green-500" /> {t('chatbot.actions.find_tour')}
            </button>
            <button onClick={() => handleSend(t('chatbot.actions.human_support'))} className="flex-shrink-0 flex items-center gap-1 bg-white border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-700 hover:bg-gray-100 transition shadow-sm">
                <User size={12} className="text-red-500" /> {t('chatbot.actions.human_support')}
            </button>
        </div>
    );

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col"
                        style={{ maxHeight: '600px', height: '520px' }}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex justify-between items-center shadow-md">
                            <div className="flex items-center gap-2">
                                <div className="bg-white/20 p-1.5 rounded-full">
                                    <MessageCircle size={18} />
                                </div>
                                <span className="font-semibold tracking-wide">{t('chatbot.title')}</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 space-y-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${msg.sender === 'user'
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                            }`}
                                    >
                                        {msg.attachment && (
                                            <div className="mb-2">
                                                {msg.attachment.type.startsWith('image/') ? (
                                                    <img
                                                        src={msg.attachment.url}
                                                        alt="Attachment"
                                                        className="rounded-lg max-h-48 object-cover w-full border border-white/20"
                                                    />
                                                ) : (
                                                    <div className="flex items-center gap-2 bg-black/10 p-2 rounded">
                                                        <Paperclip size={16} />
                                                        <span className="truncate">{msg.attachment.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {msg.text && (
                                            <p className="whitespace-pre-wrap">
                                                {msg.sender === 'bot' ? renderMessageText(msg.text) : msg.text}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 flex gap-1 items-center">
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Actions */}
                        <QuickActions />

                        {/* Input Area */}
                        <div className="p-3 bg-white border-t border-gray-100">
                            {attachment && (
                                <div className="mb-2 flex items-center gap-2 bg-blue-50 p-2 rounded-lg text-sm text-blue-700 border border-blue-100">
                                    <ImageIcon size={16} />
                                    <span className="truncate max-w-[200px]">{attachment.name}</span>
                                    <button
                                        onClick={() => setAttachment(null)}
                                        className="ml-auto hover:text-blue-900"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                            <div className="flex items-end gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileSelect}
                                    accept="image/*"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-full hover:bg-gray-100 mb-1"
                                    title="Attach image"
                                >
                                    <Paperclip size={20} />
                                </button>
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder={t('chatbot.placeholder')}
                                    rows="1"
                                    className="flex-1 border border-gray-200 rounded-2xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none max-h-24 scrollbar-hide"
                                    style={{ minHeight: '40px' }}
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={(!inputText.trim() && !attachment) || isLoading}
                                    className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm mb-1"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
            </motion.button>
        </div>
    );
}
