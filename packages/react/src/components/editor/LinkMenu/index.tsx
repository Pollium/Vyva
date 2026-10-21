import ToolPopover from '../ToolPopover';
import Button from '../../ui/Button';
import TextInput from '../../ui/TextInput';
import { useMessages } from '../../../messages/context';
import { useState, type ReactNode } from 'react';

const SAFE_LINK = /^(https?:\/\/|mailto:)[^\s]+$/i;
const LINK_START = 'https://';
const MENU_WIDTH = 320;

interface LinkMenuProps{
    current: string | null;
    icon: ReactNode;
    isActive?: boolean;
    isDisabled?: boolean;
    onOpen: () => void;
    onApply: (href: string | null) => void;
}

const LinkMenu = ({ current, icon, isActive = false, isDisabled = false, onOpen, onApply }: LinkMenuProps) => {
    const t = useMessages();
    const [href, setHref] = useState('');
    const typed = href.trim();
    const isValid = SAFE_LINK.test(typed);

    return (
        <ToolPopover
            label={t.editor.link}
            icon={icon}
            isActive={isActive}
            isDisabled={isDisabled}
            width={MENU_WIDTH}
            onOpen={() => {
                setHref(current ?? LINK_START);
                onOpen();
            }}
        >
            {(close) => (
                <form
                    className='vy:flex vy:flex-col vy:gap-2'
                    onSubmit={(event) => {
                        event.preventDefault();
                        if(!isValid) return;
                        onApply(typed);
                        close();
                    }}
                >
                    <TextInput
                        label={t.editor.linkAddress}
                        isLabelHidden
                        autoFocus
                        value={href}
                        placeholder={`${LINK_START}…`}
                        errorMessage={typed !== '' && typed !== LINK_START && !isValid ? t.editor.linkInvalid : undefined}
                        onChange={setHref}
                    />
                    <div className='vy:flex vy:justify-end vy:gap-2'>
                        {current === null ? null : (
                            <Button
                                size='sm'
                                variant='ghost'
                                onPress={() => {
                                    onApply(null);
                                    close();
                                }}
                            >
                                {t.editor.removeLink}
                            </Button>
                        )}
                        <Button size='sm' type='submit' isDisabled={!isValid}>{t.editor.apply}</Button>
                    </div>
                </form>
            )}
        </ToolPopover>
    );
};

export default LinkMenu;
