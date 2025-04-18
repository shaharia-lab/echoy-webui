import {ChatHistory} from "../types";
import {APIClient, APIResponse} from "./APIClient.ts";
import {ChatPayload} from "../types/chat.ts";

export interface ChatResponse {
    chat_uuid: string;
    answer: string;
    input_token: number;
    output_token: number;
}

export interface ApiChatMessage {
    Text: string;
    IsUser: boolean;
}

export interface ClientChatMessage {
    content: string;
    isUser: boolean;
}

interface StreamChunk {
    content: string;
    meta_key?: string;
    done?: boolean;
}

interface PaginatedChatHistoriesResponse {
    chats: ChatHistory[];
    page: number;
    per_page: number;
    total: number;
}


// Updated ChatService
export class ChatService extends APIClient {
    constructor(token: string = '') {
        super(import.meta.env.VITE_MCP_BACKEND_API_ENDPOINT, token);
    }

    async getChatHistories(): Promise<APIResponse<PaginatedChatHistoriesResponse>> {
        return this.fetchWithError<PaginatedChatHistoriesResponse>('/api/v1/chats');
    }

    async sendMessage(payload: ChatPayload): Promise<APIResponse<ChatResponse>> {
        return this.fetchWithError<ChatResponse>('/api/v1/chats', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async loadChatHistory(chatId: string): Promise<APIResponse<{ messages: ApiChatMessage[] }>> {
        return this.fetchWithError<{ messages: ApiChatMessage[] }>(`/api/v1/chats/${chatId}`);
    }

    async sendStreamMessage(
        payload: ChatPayload,
        onChunk: (chunk: StreamChunk) => void,
        onHeaderChatUuid?: (chatUuid: string) => void
    ): Promise<void> {
        try {
            const response = await this.fetchStream('/api/v1/chats/stream', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            response.headers.forEach((value, name) => {
                console.log(`${name}: ${value}`);
            });

            const chatUuid = response.headers.get('X-MKit-Chat-UUID');

            if (chatUuid && onHeaderChatUuid) {
                onHeaderChatUuid(chatUuid);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Response body is not readable');
            }

            const decoder = new TextDecoder();
            let buffer = '';

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });

                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.trim()) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const jsonStr = line.substring(6);
                                    const parsed = JSON.parse(jsonStr) as StreamChunk;
                                    onChunk(parsed);
                                    if (parsed.done) {
                                        return;
                                    }
                                } catch (e) {
                                    console.error('Failed to parse chunk:', e, line);
                                }
                            }
                        }
                    }
                }

                if (buffer.trim() && buffer.startsWith('data: ')) {
                    try {
                        const jsonStr = buffer.substring(6);
                        const parsed = JSON.parse(jsonStr) as StreamChunk;
                        onChunk(parsed);
                    } catch (e) {
                        console.error('Failed to parse final chunk:', e);
                    }
                }
            } finally {
                reader.releaseLock();
            }
        } catch (error) {
            console.error('Stream error:', error);
            throw error;
        }
    }
}
