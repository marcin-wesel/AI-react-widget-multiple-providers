import React, { useState, useRef, useEffect } from 'react';
import { useChatStream } from '../hooks/use-chat-stream';
import { useTranslations } from '@/locales';
import './ChatComponent.css';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system' | string;
    content: string;
}

const ChatComponent: React.FC = () => {
    const { t } = useTranslations();
    const { messages, sendMessage, isStreaming, error, clearMessages } = useChatStream();
    
    const [input, setInput] = useState<string>('');
    const [provider, setProvider] = useState<'azure' | 'openai' | 'claude'>('azure');
    const [includeHistory, setIncludeHistory] = useState<boolean>(() => {
        try {
            const raw = localStorage.getItem('chat_include_history');
            return raw === '1';
        } catch {
            return false;
        }
    });
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

    useEffect(() => {
        try {
            localStorage.setItem('chat_include_history', includeHistory ? '1' : '0');
        } catch {
            // ignore
        }
    }, [includeHistory]);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isStreaming) return;

        sendMessage(input, provider, includeHistory);
        setInput('');
    };

    const handleClearMessages = () => {
        if (confirm(t('chat.clearHistoryConfirm'))) {
            clearMessages();
        }
    };

    // Calculate the number of messages in context
    const messageCount = messages.filter(msg => msg.content.trim() !== '').length;

    return (
        <div className={`chat-container ${minimized ? 'minimized' : ''}`}>
            <div className={`chat-header ${minimized ? 'minimized' : ''}`}>
                <h3>{t('chat.title')} {provider === 'azure' ? `(${t('chat.providers.azure')})` : provider === 'openai' ? `(${t('chat.providers.openai')})` : `(${t('chat.providers.claude')})`}</h3>

                <div className="provider-controls">
                    <label htmlFor="provider-select">{t('chat.providerLabel')}</label>
                    <select id="provider-select" value={provider} onChange={(e) => setProvider(e.target.value as 'azure' | 'openai' | 'claude')}>
                        <option value="azure">{t('chat.providers.azure')}</option>
                        <option value="openai">{t('chat.providers.openai')}</option>
                        <option value="claude">{t('chat.providers.claude')}</option>
                    </select>
                </div>

                <div className="history-controls">
                    <label className="history-toggle-label">
                        <input 
                            type="checkbox" 
                            className="history-checkbox"
                            checked={includeHistory}
                            onChange={(e) => setIncludeHistory(e.target.checked)}
                        />
                        <span className="history-toggle-text">
                            {includeHistory ? '📝' : '📄'} {t('chat.historyLabel')}
                        </span>
                    </label>
                    {messages.length > 0 && (
                        <button 
                            className="clear-history-btn" 
                            onClick={handleClearMessages}
                            title={t('chat.clearHistoryTitle')}
                        >
                            🗑️
                        </button>
                    )}
                </div>

                <button
                    className="minimize-toggle"
                    aria-label={minimized ? 'Expand chat' : 'Minimize chat'}
                    onClick={() => setMinimized(v => !v)}
                >
                    {minimized ? '➕' : '➖'}
                </button>
            </div>

            {includeHistory && messageCount > 0 && !minimized && (
                <div className="history-status">
                    <span className="history-indicator">💬 {messageCount} {t('chat.messagesInContext')}</span>
                </div>
            )}

            <div className={`messages-list ${minimized ? 'hidden' : ''}`}>
                {messages.length === 0 && (
                    <div className="empty-state">Rozpocznij rozmowę...</div>
                )}
                
                {messages.map((msg: ChatMessage, index: number) => (
                    <div key={index} className={`message-row ${msg.role}`}>
                        <div className="message-bubble">
                            {msg.content}
                        </div>
                    </div>
                ))}

                {error && <div className="error-msg">{error}</div>}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className={`chat-input-area ${minimized ? 'hidden' : ''}`}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t('chat.inputPlaceholder')}
                    disabled={isStreaming}
                />
                <button type="submit" disabled={isStreaming || !input.trim()}>
                    {isStreaming ? 'Piszę...' : t('chat.sendButton')}
                </button>
            </form>
        </div>
    );
};

export default ChatComponent;