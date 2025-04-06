export interface Model {
    name: string;
    description: string;
    modelId: string;
}

export interface Provider {
    ID: string;
    Name: string;
    Description: string;
    Models: Model[];
}

export interface LLMProvidersModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (provider: string, modelId: string) => void;
    initialProvider: string | null | undefined;
    initialModelId: string | null | undefined;
}

export interface LLMProvidersResponse {
    providers: Provider[];
    page: number;
    per_page: number;
    total: number;
}

