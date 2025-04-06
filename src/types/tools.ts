export interface Tool {
    name: string;
    description: string;
}

export interface ToolsListResponse {
    tools: Tool[];
    page: number;
    per_page: number;
    total: number;
}

export interface ToolsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (selectedTools: string[]) => void;
    initialSelectedTools: string[];
}
