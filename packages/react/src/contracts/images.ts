import type { ComponentType } from 'react';

export interface PickedImage{
    fileId: string;
    url: string;
    alt: string;
    credit: string | null;
}

export interface ImagePickerProps{
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onPick: (image: PickedImage) => void;
}

export type ImagePicker = ComponentType<ImagePickerProps>;
