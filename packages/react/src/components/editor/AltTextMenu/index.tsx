import AltTextForm from '../AltTextForm';
import ToolPopover from '../ToolPopover';
import { useMessages } from '../../../messages/context';
import { Captions } from 'lucide-react';

const MENU_WIDTH = 288;

interface AltTextMenuProps{
    value: string;
    isDisabled?: boolean;
    onApply: (alt: string) => void;
}

const AltTextMenu = ({ value, isDisabled = false, onApply }: AltTextMenuProps) => {
    const t = useMessages();

    return (
        <ToolPopover label={t.editor.altText} icon={<Captions className='vy:size-4' />} isDisabled={isDisabled} width={MENU_WIDTH}>
            {(close) => (
                <AltTextForm
                    value={value}
                    onApply={(alt) => {
                        onApply(alt);
                        close();
                    }}
                />
            )}
        </ToolPopover>
    );
};

export default AltTextMenu;
