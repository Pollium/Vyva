import Button from '../Button';
import Modal from '../Modal';
import { useMessages } from '../../../messages/context';

interface ConfirmDialogProps{
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    title: string;
    description: string;
    confirmLabel: string;
    isPending: boolean;
    error: string | null;
    onConfirm: () => void;
}

const ConfirmDialog = ({ isOpen, onOpenChange, title, description, confirmLabel, isPending, error, onConfirm }: ConfirmDialogProps) => {
    const t = useMessages();

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} title={title}>
            <p className='vy:text-[0.875rem] vy:text-muted'>{description}</p>

            {error === null ? null : <p role='alert' className='vy:text-[0.8125rem] vy:text-danger'>{error}</p>}

            <div className='vy:flex vy:justify-end vy:gap-2'>
                <Button variant='secondary' onPress={() => onOpenChange(false)}>{t.ui.cancel}</Button>
                <Button variant='danger' isPending={isPending} onPress={onConfirm}>{confirmLabel}</Button>
            </div>
        </Modal>
    );
};

export default ConfirmDialog;
