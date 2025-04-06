// components/Sidebar.tsx
import React, {useCallback, useEffect, useState} from 'react';
import {ChatHistory} from "../types";
import {SidebarHeader} from "./sidebar/SidebarHeader";
import {NewChatSection} from "./sidebar/NewChatSection";
import {ChatHistoryList} from "./sidebar/ChatHistoryList";
import {SidebarFooter} from "./sidebar/SidebarFooter";
import {ChatService} from "../services/ChatService.ts";


interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onChatSelect?: (chatId: string) => void;
    selectedChatId?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
                                                    isOpen,
                                                    onClose,
                                                    onChatSelect,
                                                    selectedChatId
                                                }) => {
    const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadChatHistories = useCallback(async () => {
        setIsLoading(true);
        try {
            const chatService = new ChatService("");
            const response = await chatService.getChatHistories();
            setChatHistories(response.data.chats || []);
            setError(null);
        } catch (err) {
            setError('Failed to load chat histories');
            console.error(err);
            setChatHistories([]);
        } finally {
            setIsLoading(false);
        }
    }, []);


    useEffect(() => {
        loadChatHistories();
    }, [loadChatHistories]);

    const getFirstMessage = (chat: ChatHistory): string => {
        if (!chat.messages || chat.messages.length === 0) {
            return 'Untitled Chat';
        }

        const firstMessage = chat.messages[0].Text?.trim() || '';
        if (!firstMessage) {
            return 'Untitled Chat';
        }

        return firstMessage.length > 30
            ? `${firstMessage.substring(0, 30)}...`
            : firstMessage;
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString();
    };

    const handleRefresh = () => {
        loadChatHistories();
    };

    const handleHelp = () => {
        window.open('https://github.com/shaharia-lab/mcp-frontend', '_blank');
    };

    const handleSettings = () => {
        // Implement settings functionality
        console.log('Settings clicked');
    };

    return (
        <div className={`fixed top-0 left-0 h-full bg-white shadow-lg z-40 transition-all duration-300 transform ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
        } sidebar-width flex flex-col`}>
            <SidebarHeader onClose={onClose} />
            <NewChatSection onChatSelect={onChatSelect ?? (() => {})} />
            <ChatHistoryList
                isLoading={isLoading}
                error={error}
                chatHistories={chatHistories}
                selectedChatId={selectedChatId}
                onChatSelect={onChatSelect}
                getFirstMessage={getFirstMessage}
                formatDate={formatDate}
            />
            <SidebarFooter
                onRefresh={handleRefresh}
                onHelp={handleHelp}
                onSettings={handleSettings}
            />
        </div>
    );
};
