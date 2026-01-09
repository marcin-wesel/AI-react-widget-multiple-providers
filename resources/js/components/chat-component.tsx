import React, { useState, useRef, useEffect } from 'react';
import { useChatStream } from '../hooks/use-chat-stream';
import './ChatComponent.css';

// 1. Definicja typu pojedynczej wiadomości
// Określa, jakich pól spodziewamy się w obiekcie 'msg'
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system' | string; // Możesz zawęzić typy ról, jeśli je znasz
    content: string;
}

const ChatComponent: React.FC = () => {
    // Zakładamy, że hook useChatStream jest już otypowany lub zwraca kompatybilne dane
    const { messages, sendMessage, isStreaming, error } = useChatStream();
    
    const [input, setInput] = useState<string>('');
    const [provider, setProvider] = useState<'azure' | 'openai' | 'claude'>('azure');
    const [minimized, setMinimized] = useState<boolean>(() => {
        try {
            const raw = localStorage.getItem('chat_minimized');
            return raw === '1';
        } catch {
            return false;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('chat_minimized', minimized ? '1' : '0');
        } catch {
            // ignore
        }
    }, [minimized]);
    
    // 2. Typowanie useRef dla elementu HTML (div)
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll do dołu przy nowej wiadomości
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // 3. Typowanie zdarzenia wysłania formularza
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isStreaming) return;

        sendMessage(input, provider);
        setInput('');
    };

    return (
        <div className={`chat-container ${minimized ? 'minimized' : ''}`}>
            <div className={`chat-header ${minimized ? 'minimized' : ''}`}>
                <h3>Asystent AI {provider === 'azure' ? '(Azure)' : provider === 'openai' ? '(OpenAI)' : '(Claude)'}</h3>

                <div className="provider-controls">
                    <label htmlFor="provider-select">Provider:</label>
                    <select id="provider-select" value={provider} onChange={(e) => setProvider(e.target.value as 'azure' | 'openai' | 'claude')}>
                        <option value="azure">Azure OpenAI</option>
                        <option value="openai">OpenAI API</option>
                        <option value="claude">Claude (Anthropic)</option>
                    </select>
                </div>
                <button
                    className="minimize-toggle"
                    aria-label={minimized ? 'Expand chat' : 'Minimize chat'}
                    onClick={() => setMinimized(v => !v)}
                >
                    {minimized ? '➕' : '➖'}
                </button>
            </div>

            <div className={`messages-list ${minimized ? 'hidden' : ''}`}>
                {messages.length === 0 && (
                    <div className="empty-state">Rozpocznij rozmowę...</div>
                )}
                
                {/* 4. Mapowanie z jawnym typem (opcjonalne, jeśli TS wywnioskuje to z hooka) */}
                {messages.map((msg: ChatMessage, index: number) => (
                    <div key={index} className={`message-row ${msg.role}`}>
                        <div className="message-bubble">
                            {/* Tutaj trafia treść wiadomości */}
                            {msg.content}
                        </div>
                    </div>
                ))}

                {error && <div className="error-msg">{error}</div>}
                {/* Ref przypisany do konkretnego elementu */}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className={`chat-input-area ${minimized ? 'hidden' : ''}`}>
                <input
                    type="text"
                    value={input}
                    // TypeScript automatycznie wie, że 'e' to ChangeEvent dla inputa
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Wpisz wiadomość..."
                    disabled={isStreaming}
                />
                <button type="submit" disabled={isStreaming || !input.trim()}>
                    {isStreaming ? 'Piszę...' : 'Wyślij'}
                </button>
            </form>
        </div>
    );
};

export default ChatComponent;