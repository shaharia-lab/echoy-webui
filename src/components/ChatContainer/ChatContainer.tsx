import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ChatContainerProps, ChatPayload, MessageHandlerConfig} from "../../types/chat.ts";
import {ApiChatMessage, ChatService, ClientChatMessage} from "../../services/ChatService.ts";
import {useNotification} from "../../context/useNotification.ts";
import {Message} from "../Message/Message.tsx";
import {ChatInput} from "../ChatInput/ChatInput.tsx";
import {ToolService} from "../../services/ToolService.ts";

export const ChatContainer: React.FC<ChatContainerProps> = ({
                                                                modelSettings,
                                                                selectedChatId
                                                            }) => {
    const { addNotification } = useNotification();
    const [messages, setMessages] = useState<ClientChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [chatUuid, setChatUuid] = useState<string | null>(null);
    const [selectedTools, setSelectedTools] = useState<string[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
    const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
    const [useStreaming, setUseStreaming] = useState(true);
    const [availableTools, setAvailableTools] = useState<string[]>([]);

    const handleError = useCallback((error: unknown) => {
        addNotification(
            'error',
            error instanceof Error || (typeof error === 'object' && error && 'message' in error)
                ? (error as { message: string }).message
                : 'Failed to send message'
        );
    }, [addNotification]);


    const handleStreamingChange = (value: boolean) => {
        setUseStreaming(value);
    };

    const handleProviderChange = (provider: string, modelId: string) => {
        setSelectedProvider(provider);
        setSelectedModelId(modelId);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    useEffect(() => {
        const loadTools = async () => {
            try {
                const toolService = new ToolService("");
                const response = await toolService.getTools();

                if (response.error) {
                    console.error('Error loading tools:', response.error);
                    handleError(response.error);
                    return;
                }

                if (response.data) {
                    setAvailableTools(response.data.tools.map(tool => tool.name));
                }
            } catch (error) {
                console.error('Error fetching tools:', error);
                handleError(error);
                return;
            }
        };

        loadTools();
    }, []);


    useEffect(() => {
        const loadChatHistory = async () => {
            if (!selectedChatId) {
                setMessages([]); // Clear messages for new chat
                setChatUuid(null);
                return;
            }

            try {
                const chatService = new ChatService("");
                const response = await chatService.loadChatHistory(selectedChatId);

                if (response.error) {
                    console.error('Error loading chat history:', response.error);
                    return;
                }

                if (response.data) {
                    const formattedMessages = response.data.messages.map((msg: ApiChatMessage): ClientChatMessage => ({
                        content: msg.Text,
                        isUser: msg.IsUser
                    }));

                    setMessages(formattedMessages);
                    setChatUuid(selectedChatId);
                }
            } catch (error) {
                console.error('Error loading chat history:', error);
            }
        };

        loadChatHistory();
    }, [selectedChatId]);

    const handleMessageSubmit = async (
        message: string,
        config: MessageHandlerConfig
    ) => {
        setIsLoading(true);

        // Add user message
        const newMessage: ClientChatMessage = {
            content: message,
            isUser: true
        };
        setMessages(prev => [...prev, newMessage]);

        try {
            const chatService = new ChatService("");

            const payload: ChatPayload = {
                question: message,
                selectedTools,
                modelSettings,
                ...(config.streamResponse && config.streamSettings && {
                    stream_settings: {
                        chunk_size: config.streamSettings.chunkSize,
                        delay_ms: config.streamSettings.delayMs
                    }
                }),
                ...(chatUuid && { chat_uuid: chatUuid }),
                ...(selectedProvider && selectedModelId && {
                    llmProvider: {
                        provider: selectedProvider,
                        modelId: selectedModelId
                    }
                })
            };

            if (chatUuid) {
                payload.chat_uuid = chatUuid;
            }

            if (config.streamResponse) {
                await handleStreamingResponse(chatService, payload);
            } else {
                await handleSyncResponse(chatService, payload);
            }
        } catch (error) {
            addNotification(
                'error',
                error instanceof Error ? error.message : 'Failed to send message'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleStreamingResponse = async (
        chatService: ChatService,
        payload: ChatPayload
    ) => {
        const assistantMessage: ClientChatMessage = {
            content: '',
            isUser: false
        };

        setMessages(prev => [...prev, assistantMessage]);

        let accumulatedContent = '';

        await chatService.sendStreamMessage(
            payload,
            (chunk) => {
                if (chunk.content || chunk.content === '') {
                    accumulatedContent += chunk.content;

                    setMessages(prev => {
                        const newMessages = [...prev];
                        const lastIndex = newMessages.length - 1;
                        if (lastIndex >= 0 && !newMessages[lastIndex].isUser) {
                            newMessages[lastIndex] = {
                                ...newMessages[lastIndex],
                                content: accumulatedContent
                            };
                        }
                        return newMessages;
                    });
                }
            },
            (headerChatUuid) => {
                if (headerChatUuid && !chatUuid) {
                    setChatUuid(headerChatUuid);
                }
            }
        );
    };

    const handleSyncResponse = async (
        chatService: ChatService,
        payload: ChatPayload
    ) => {
        const data = await chatService.sendMessage(payload);

        if (data.data.chat_uuid && !chatUuid) {
            setChatUuid(data.data.chat_uuid);
        }

        setMessages(prev => [...prev, {
            content: data.data.answer,
            isUser: false
        }]);
    };

    return (
        <div className="max-w-6xl mx-auto chat-container overflow-hidden flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
            {messages.map((message, index) => (
                    <Message
                        key={index}
                        content={message.content}
                        isUser={message.isUser}
                    />
                ))}
                {isLoading && (
                    <div className="flex items-center justify-center p-4">
                        <div className="animate-pulse text-gray-500">
                            Processing...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <ChatInput
                onSubmit={handleMessageSubmit}
                isLoading={isLoading}
                selectedTools={selectedTools}
                onToolsChange={setSelectedTools}
                selectedProvider={selectedProvider}
                selectedModelId={selectedModelId}
                onProviderChange={handleProviderChange}
                useStreaming={useStreaming}
                onStreamingChange={handleStreamingChange}
                availableTools={availableTools}
            />
        </div>
    );
};
