import type { EditorSession } from '../contracts/editor-session';
import type { PickedImage } from '../contracts/images';
import { usePickedImages } from './use-picked-images';
import { documentOf } from '../utils/content-kind';
import { blocksToEditorHtml, editorHtmlToBlocks } from '../utils/document-html';
import { BlockId, FileImage, PageBreak } from '../utils/tiptap-extensions';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Highlight from '@tiptap/extension-highlight';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { TableKit } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyleKit } from '@tiptap/extension-text-style';
import { Placeholder } from '@tiptap/extensions';
import { useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { DocumentDesign } from '@vyva/core/content';
import type { FileUrl } from '@vyva/core/render';
import { common, createLowlight } from 'lowlight';
import { useEffect, useRef, useState } from 'react';

const lowlight = createLowlight(common);

const extensionsOf = (placeholder: string) => [
    StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3, 4] },
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https', protocols: ['http', 'https', 'mailto'] }
    }),
    TextStyleKit.configure({ fontFamily: false }),
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TableKit.configure({ table: { resizable: true } }),
    TaskList,
    TaskItem.configure({ nested: true }),
    CodeBlockLowlight.configure({ lowlight, defaultLanguage: 'bash' }),
    FileImage,
    PageBreak,
    BlockId,
    Placeholder.configure({ placeholder })
];

interface DocumentEditorOptions{
    session: EditorSession;
    readOnly: boolean;
    hostFileUrl: FileUrl;
    placeholder: string;
    label: string;
}

export interface DocumentEditing{
    editor: Editor;
    design: DocumentDesign;
    fileUrl: FileUrl;
    changeDesign: (design: DocumentDesign) => void;
    insertImage: (image: PickedImage) => void;
    setLogo: (image: PickedImage | null) => void;
}

export const useDocumentEditor = ({ session, readOnly, hostFileUrl, placeholder, label }: DocumentEditorOptions): DocumentEditing => {
    const { fileUrl, remember } = usePickedImages(hostFileUrl);
    const [initial] = useState(() => documentOf(session.content));
    const [design, setDesign] = useState(initial.design);
    const designRef = useRef(design);
    const appliedVersion = useRef(session.remoteVersion);
    const syncedHtml = useRef<string | null>(null);
    const { change } = session;

    const save = (read: () => string, nextDesign = designRef.current) => {
        change({ content: () => ({ kind: 'document', design: nextDesign, blocks: editorHtmlToBlocks(read()) }) });
    };

    const [options] = useState(() => ({
        extensions: extensionsOf(placeholder),
        content: blocksToEditorHtml(initial.blocks, fileUrl),
        editable: !readOnly,
        editorProps: { attributes: { class: 'vy:outline-none', 'aria-label': label } }
    }));
    const editor = useEditor({
        ...options,
        immediatelyRender: true,
        onCreate: ({ editor: current }) => {
            syncedHtml.current = current.getHTML();
        },
        onUpdate: ({ editor: current }) => {
            if(syncedHtml.current !== null){
                if(current.getHTML() === syncedHtml.current) return;
                syncedHtml.current = null;
            }

            save(() => current.getHTML());
        }
    });

    useEffect(() => {
        editor.setEditable(!readOnly, false);
    }, [editor, readOnly]);

    useEffect(() => {
        if(appliedVersion.current === session.remoteVersion) return;
        appliedVersion.current = session.remoteVersion;

        const fresh = documentOf(session.content);
        designRef.current = fresh.design;
        setDesign(fresh.design);
        editor.commands.setContent(blocksToEditorHtml(fresh.blocks, fileUrl), { emitUpdate: false });
        syncedHtml.current = editor.getHTML();
    }, [editor, fileUrl, session.content, session.remoteVersion]);

    const changeDesign = (next: DocumentDesign) => {
        designRef.current = next;
        setDesign(next);
        save(() => editor.getHTML(), next);
    };

    const insertImage = (image: PickedImage) => {
        remember(image);
        editor.chain().focus().insertContent({ type: 'image', attrs: { src: image.url, alt: image.alt, fileId: image.fileId } }).run();
    };

    const setLogo = (image: PickedImage | null) => {
        if(image !== null) remember(image);
        changeDesign({ ...designRef.current, headerLogoFileId: image?.fileId ?? null });
    };

    return { editor, design, fileUrl, changeDesign, insertImage, setLogo };
};
