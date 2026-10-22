import { LAYERS } from '../layers';
import { useMessages } from '../../../messages/context';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button, Dialog, Heading, Modal as AriaModal, ModalOverlay } from 'react-aria-components';

export type ModalWidth = 'default' | 'wide';

interface ModalProps{
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    title: string;
    width?: ModalWidth;
    children: ReactNode;
}

const WIDTHS: Record<ModalWidth, string> = {
    default: 'vy:max-w-md',
    wide: 'vy:max-w-[44rem]'
};

const Modal = ({ isOpen, onOpenChange, title, width = 'default', children }: ModalProps) => {
    const t = useMessages();

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable className={`vy-ui vy:fixed vy:inset-0 ${LAYERS.modal} vy:flex vy:items-center vy:justify-center vy:bg-black/40 vy:p-4`}>
            <AriaModal className={`vy:max-h-full vy:w-full vy:overflow-y-auto vy:rounded-3xl vy:bg-background vy:text-foreground vy:shadow-xl vy:ring-1 vy:ring-foreground/10 vy:outline-none ${WIDTHS[width]}`}>
                <Dialog className='vy:relative vy:flex vy:flex-col vy:gap-4 vy:p-6 vy:outline-none'>
                    <Heading slot='title' className='vy:break-words vy:pe-8 vy:text-[1.0625rem] vy:font-semibold'>{title}</Heading>
                    <Button
                        aria-label={t.ui.close}
                        onPress={() => onOpenChange(false)}
                        className='vy:absolute vy:right-4 vy:top-4 vy:grid vy:size-8 vy:place-items-center vy:rounded-full vy:text-muted vy:outline-none vy:data-focus-visible:outline-2 vy:data-focus-visible:outline-foreground vy:data-hovered:bg-foreground/[0.06] vy:data-hovered:text-foreground'
                    >
                        <X className='vy:size-4' aria-hidden='true' />
                    </Button>
                    {children}
                </Dialog>
            </AriaModal>
        </ModalOverlay>
    );
};

export default Modal;
