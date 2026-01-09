import { useState } from 'react';

// Definicja typu pojedynczej wiadomości
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

// Typ zwracany przez hooka
interface UseChatStreamReturn {
    messages: ChatMessage[];
    sendMessage: (userMessage: string, provider?: 'azure' | 'openai' | 'claude') => Promise<void>;
    isStreaming: boolean;
    error: string | null;
}

export function useChatStream(): UseChatStreamReturn {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const sendMessage = async (userMessage: string, provider: 'azure' | 'openai' | 'claude' = 'azure') => {
        setIsStreaming(true);
        setError(null);

        // 1. Dodajemy wiadomość użytkownika
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

        // 2. Dodajemy placeholder asystenta
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        try {
            // Pobranie tokena CSRF w sposób bezpieczny dla TS
            const csrfTokenMeta = document.querySelector('meta[name="csrf-token"]');
            const csrfToken = csrfTokenMeta ? csrfTokenMeta.getAttribute('content') : '';

            if (!csrfToken) {
                console.warn('Brak tokena CSRF');
            }

            const response = await fetch('/unified-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || ''
                },
                body: JSON.stringify({
                    provider,
                    message: userMessage
                })
            });

            if (!response.ok) throw new Error('Network response was not ok');
            if (!response.body) throw new Error('ReadableStream not supported');

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = ''; // Ważne: Bufor na niekompletne fragmenty linii

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // 1. Dekodujemy nowy kawałek i dodajemy do bufora
                buffer += decoder.decode(value, { stream: true });

                // 2. Dzielimy bufor na linie
                const lines = buffer.split('\n');

                // 3. Ostatni element tablicy 'lines' może być urwany w połowie,
                // więc zdejmujemy go z tablicy i wrzucamy z powrotem do bufora.
                buffer = lines.pop() || '';

                // 4. Przetwarzamy tylko kompletne linie
                for (const line of lines) {
                    const trimmedLine = line.trim();

                    // Ignorujemy puste linie oraz komentarze SSE (zaczynające się od dwukropka)
                    if (!trimmedLine || trimmedLine.startsWith(':')) continue;

                    // Szukamy linii z danymi
                    if (trimmedLine.startsWith('data: ')) {
                        const dataStr = trimmedLine.substring(6).trim(); // Usuwamy prefix "data: "

                        // Obsługa sygnału końca
                        if (dataStr === '[DONE]') break;

                        try {
                            // Parsujemy JSON przesłany w linii data
                            const parsed = JSON.parse(dataStr);
                            const contentFragment = parsed.content;

                            if (contentFragment) {
                                setMessages(prev => {
                                    const newHistory = [...prev];
                                    const lastMsg = newHistory[newHistory.length - 1];

                                    // Zabezpieczenie: dopisujemy tylko jeśli ostatnia wiadomość jest od bota
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

    return { messages, sendMessage, isStreaming, error };
}