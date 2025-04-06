import React from 'react';
import {ArrowPathIcon, Cog6ToothIcon,} from "@heroicons/react/24/outline";
import {FaGithub} from "react-icons/fa";

interface SidebarFooterProps {
    onRefresh?: () => void;
    onHelp?: () => void;
    onSettings?: () => void;
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({
                                                                onRefresh,
                                                                onHelp,
                                                                onSettings
                                                            }) => {
    const isAuthenticated = false;
    const user = {
        "name": "John Doe",
        "picture": "https://example.com/user.jpg",
        "email": "john.doe@example.com"
    }
    return (
        <div className="mt-auto border-t border-gray-200">
            {isAuthenticated && user && (
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        {user.picture ? (
                            <img
                                src={user.picture}
                                alt={user.name || 'User'}
                                className="w-8 h-8 rounded-full"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-600 text-sm">
                                    {(user.name || 'U')[0].toUpperCase()}
                                </span>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {user.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {user.email}
                            </p>
                        </div>
                    </div>
                </div>
            )}
            <div className="p-4 flex items-center justify-between">
                <div className="flex gap-4">
                    <button
                        onClick={onRefresh}
                        className="text-gray-600 hover:text-gray-900"
                        title="Refresh Chat History"
                    >
                        <ArrowPathIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onHelp}
                        className="text-gray-600 hover:text-gray-900"
                        title="Get help & support from GitHub repository"
                    >
                        <FaGithub className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onSettings}
                        className="text-gray-600 hover:text-gray-900"
                        title="Settings"
                    >
                        <Cog6ToothIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
