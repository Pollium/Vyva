import Image from '@tiptap/extension-image';
import { Extension, Node, mergeAttributes } from '@tiptap/react';

const BLOCK_TYPES = ['paragraph', 'heading', 'bulletList', 'orderedList', 'taskList', 'blockquote', 'codeBlock', 'table', 'horizontalRule', 'image', 'pageBreak'];

export const BlockId = Extension.create({
    name: 'blockId',
    addGlobalAttributes(){
        return [{
            types: BLOCK_TYPES,
            attributes: {
                blockId: {
                    default: null,
                    keepOnSplit: false,
                    parseHTML: (element) => element.getAttribute('data-block-id'),
                    renderHTML: (attributes) => typeof attributes.blockId === 'string' ? { 'data-block-id': attributes.blockId } : {}
                }
            }
        }];
    }
});

export const PageBreak = Node.create({
    name: 'pageBreak',
    group: 'block',
    atom: true,
    selectable: true,
    parseHTML(){
        return [{ tag: 'div[data-type="page-break"]' }];
    },
    renderHTML({ HTMLAttributes }){
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'page-break' })];
    }
});

const PIXELS = /^(\d+(?:\.\d+)?)px$/;

export const FileImage = Image.extend({
    addAttributes(){
        return {
            ...this.parent?.(),
            fileId: {
                default: null,
                parseHTML: (element) => element.getAttribute('data-file-id'),
                renderHTML: (attributes) => typeof attributes.fileId === 'string' ? { 'data-file-id': attributes.fileId } : {}
            },
            width: {
                default: null,
                parseHTML: (element) => {
                    const pixels = PIXELS.exec(element.style.width);
                    return pixels === null ? element.style.width || null : Math.round(Number(pixels[1]));
                },
                renderHTML: (attributes) => {
                    const width = typeof attributes.width === 'number' ? `${Math.round(attributes.width)}px` : attributes.width;
                    return typeof width === 'string' && width !== '' ? { style: `width: ${width}` } : {};
                }
            },
            height: {
                default: null,
                parseHTML: () => null,
                renderHTML: () => ({})
            },
            align: {
                default: null,
                parseHTML: (element) => {
                    const align = element.getAttribute('data-align');
                    return align === 'left' || align === 'center' || align === 'right' ? align : null;
                },
                renderHTML: (attributes) => typeof attributes.align === 'string' ? { 'data-align': attributes.align } : {}
            }
        };
    }
}).configure({
    inline: false,
    allowBase64: false,
    resize: { enabled: true, directions: ['top-left', 'top-right', 'bottom-left', 'bottom-right'], minWidth: 48, minHeight: 32, alwaysPreserveAspectRatio: true }
});
