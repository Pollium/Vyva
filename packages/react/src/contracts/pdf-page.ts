import { createContext, type ReactNode } from 'react';

export interface PdfPageProps{
    url: string;
    page: number;
    width: number;
    height: number;
    scale: number;
    isSelectable: boolean;
}

export type RenderPdfPage = (props: PdfPageProps) => ReactNode;

export const PdfPageContext = createContext<RenderPdfPage | null>(null);
