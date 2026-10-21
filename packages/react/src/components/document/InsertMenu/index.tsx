import MenuRow from '../../editor/MenuRow';
import ToolPopover from '../../editor/ToolPopover';
import { useMessages } from '../../../messages/context';
import type { Editor } from '@tiptap/react';
import { ChevronDown, Code2, ImagePlus, ListChecks, Minus, Plus, Scissors, Table2, type LucideIcon } from 'lucide-react';

const MENU_WIDTH = 232;
const NEW_TABLE = { rows: 3, cols: 3, withHeaderRow: true };

interface Insert{
    label: string;
    icon: LucideIcon;
    isDisabled: boolean;
    run: () => void;
}

interface InsertMenuProps{
    editor: Editor;
    isLocked: boolean;
    isTable: boolean;
    onInsertImage: (() => void) | undefined;
}

const InsertMenu = ({ editor, isLocked, isTable, onInsertImage }: InsertMenuProps) => {
    const t = useMessages();
    const chain = () => editor.chain().focus();
    const inserts: Insert[] = [
        ...(onInsertImage === undefined ? [] : [{ label: t.document.inserts.image, icon: ImagePlus, isDisabled: false, run: onInsertImage }]),
        { label: t.document.inserts.table, icon: Table2, isDisabled: isTable, run: () => chain().insertTable(NEW_TABLE).run() },
        { label: t.document.inserts.codeBlock, icon: Code2, isDisabled: false, run: () => chain().toggleCodeBlock().run() },
        { label: t.document.inserts.checklist, icon: ListChecks, isDisabled: false, run: () => chain().toggleTaskList().run() },
        { label: t.document.inserts.divider, icon: Minus, isDisabled: false, run: () => chain().setHorizontalRule().run() },
        { label: t.document.pageBreak, icon: Scissors, isDisabled: false, run: () => chain().insertContent({ type: 'pageBreak' }).run() }
    ];

    return (
        <ToolPopover label={t.document.insert} variant='labelled' width={MENU_WIDTH} isDisabled={isLocked} icon={<><Plus className='vy:size-4' />{t.document.insert}<ChevronDown className='vy:size-3.5 vy:text-muted' /></>}>
            {(close) => (
                <div className='vy:-m-1.5 vy:flex vy:flex-col'>
                    {inserts.map((insert) => (
                        <MenuRow
                            key={insert.label}
                            disabled={insert.isDisabled}
                            onClick={() => {
                                close();
                                insert.run();
                            }}
                        >
                            <insert.icon className='vy:size-4 vy:text-muted' aria-hidden='true' />
                            {insert.label}
                        </MenuRow>
                    ))}
                </div>
            )}
        </ToolPopover>
    );
};

export default InsertMenu;
