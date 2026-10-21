import { SELECTION_ACTIONS, type SelectionAction } from '../../../contracts/selection-action';
import { useMediaQuery } from '../../../hooks/use-media-query';
import { useMessages } from '../../../messages/context';
import type { Editor } from '@tiptap/react';
import { TextSelection } from '@tiptap/pm/state';
import { BubbleMenu } from '@tiptap/react/menus';
import { MessageCircle, Sparkles } from 'lucide-react';

const TOUCH_SCREEN = '(pointer: coarse)';
const TOUCH_OFFSET = 16;
const POINTER_OFFSET = 8;

const BUTTON = 'vy:flex vy:h-7 vy:pointer-coarse:h-9 vy:items-center vy:gap-1.5 vy:rounded-full vy:px-2.5 vy:transition-colors vy:hover:bg-background/15 vy:motion-reduce:transition-none';

interface SelectionActionsProps{
    editor: Editor;
    onAction: (action: SelectionAction, text: string) => void;
}

const SelectionActions = ({ editor, onAction }: SelectionActionsProps) => {
    const t = useMessages();
    const isTouch = useMediaQuery(TOUCH_SCREEN);
    const run = (action: SelectionAction) => {
        const { from, to } = editor.state.selection;
        onAction(action, editor.state.doc.textBetween(from, to, ' '));
    };

    return (
        <BubbleMenu
            editor={editor}
            options={{ placement: isTouch ? 'bottom' : 'top', offset: isTouch ? TOUCH_OFFSET : POINTER_OFFSET }}
            shouldShow={({ editor: current, state }) => current.isEditable && current.view.hasFocus() && state.selection instanceof TextSelection && !state.selection.empty && !current.isActive('codeBlock')}
        >
            <div role='toolbar' aria-label={t.document.selectionActions} className='vy:flex vy:items-center vy:gap-0.5 vy:rounded-full vy:bg-foreground vy:p-1 vy:text-[0.8125rem] vy:text-background vy:shadow-lg'>
                {SELECTION_ACTIONS.map((action, index) => (
                    <button key={action} type='button' className={BUTTON} onMouseDown={(event) => event.preventDefault()} onClick={() => run(action)}>
                        {index === 0 ? <Sparkles className='vy:size-3.5' aria-hidden='true' /> : null}
                        {t.document.selection[action]}
                    </button>
                ))}
                <span aria-hidden='true' className='vy:mx-0.5 vy:h-4 vy:w-px vy:bg-background/20' />
                <button type='button' className={BUTTON} onMouseDown={(event) => event.preventDefault()} onClick={() => run('ask')}>
                    <MessageCircle className='vy:size-3.5' aria-hidden='true' />
                    {t.document.selection.ask}
                </button>
            </div>
        </BubbleMenu>
    );
};

export default SelectionActions;
