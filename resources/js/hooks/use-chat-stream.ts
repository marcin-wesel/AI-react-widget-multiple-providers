import { useState } from 'react';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface UseChatStreamReturn {
    messages: ChatMessage[];
    sendMessage: (userMessage: string, provider?: 'azure' | 'openai' | 'claude', includeHistory?: boolean) => Promise<void>;
    isStreaming: boolean;
    error: string | null;
    clearMessages: () => void;
}

export function useChatStream(): UseChatStreamReturn {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const sendMessage = async (userMessage: string, provider: 'azure' | 'openai' | 'claude' = 'azure', includeHistory: boolean = false) => {
        setIsStreaming(true);
        setError(null);
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        try {
            const csrfTokenMeta = document.querySelector('meta[name="csrf-token"]');
            const csrfToken = csrfTokenMeta ? csrfTokenMeta.getAttribute('content') : '';

            if (!csrfToken) {
                console.warn('Brak tokena CSRF');
            }

            // Prepare history if includeHistory is true
            let history: ChatMessage[] = [];
            if (includeHistory) {
                setMessages(prev => {
                    // Filter out empty messages and limit to last 20 messages
                    const filteredHistory = prev
                        .slice(0, -2) // Exclude the just-added user message and placeholder assistant message
                        .filter(msg => msg.content.trim() !== '')
                        .slice(-20); // Limit to last 20 messages
                    history = filteredHistory;
                    return prev;
                });
            }

            const response = await fetch('/unified-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || ''
                },
                body: JSON.stringify({
                    provider,
                    message: userMessage,
                    ...(includeHistory && history.length > 0 && { history })
                })
            });

            if (!response.ok) throw new Error('Network response was not ok');
            if (!response.body) throw new Error('ReadableStream not supported');

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = ''; // Ważne: Bufor na niekompletne fragmenty linii

            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmedLine = line.trim();

                    if (!trimmedLine || trimmedLine.startsWith(':'))
                        continue;

                    if (trimmedLine.startsWith('data: ')) {
                        const dataStr = trimmedLine.substring(6).trim();

                        if (dataStr === '[DONE]')
                            break;

                        try {
                            const parsed = JSON.parse(dataStr);
                            const contentFragment = parsed.content;

                            if (contentFragment) {
                                setMessages(prev => {
                                    const newHistory = [...prev];
                                    const lastMsg = newHistory[newHistory.length - 1];

                                    if (lastMsg && lastMsg.role === 'assistant') {
                                        lastMsg.content += contentFragment;
                                    }
                                    return newHistory;
                                });
                            }
                        } catch (e) {
                            console.warn('Błąd parsowania SSE JSON:', e, dataStr);
                        }
                    }
                }
            }

        } catch (err) {
            console.error(err);
            setError("Wystąpił błąd.");
        } finally {
            setIsStreaming(false);
        }
    };

    const clearMessages = () => {
        setMessages([]);
        setError(null);
    };

    return { messages, sendMessage, isStreaming, error, clearMessages };
}