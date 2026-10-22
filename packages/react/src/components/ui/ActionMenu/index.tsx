import Popover from '../Popover';
import { useMessages } from '../../../messages/context';
import { EllipsisVertical } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button, Menu, MenuTrigger } from 'react-aria-components';

interface ActionMenuProps{
    subject: string;
    children: ReactNode;
}

const ActionMenu = ({ subject, children }: ActionMenuProps) => {
    const t = useMessages();

    return (
        <MenuTrigger>
            <Button
                aria-label={t.ui.actionsOf(subject)}
                className='vy:relative vy:grid vy:size-8 vy:shrink-0 vy:place-items-center vy:rounded-md vy:text-muted vy:outline-none vy:transition-colors vy:data-focus-visible:outline-2 vy:data-focus-visible:outline-offset-2 vy:data-focus-visible:outline-foreground vy:data-hovered:bg-foreground/[0.06] vy:data-hovered:text-foreground vy:motion-reduce:transition-none'
            >
                <EllipsisVertical className='vy:size-4' aria-hidden='true' />
            </Button>

            <Popover placement='bottom end' className='vy-ui'>
                <Menu className='vy:min-w-44 vy:p-1.5 vy:outline-none'>{children}</Menu>
            </Popover>
        </MenuTrigger>
    );
};

export default ActionMenu;
