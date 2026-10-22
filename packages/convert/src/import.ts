import { ConvertError } from './errors';
import { importDocx, importMarkdown, importPdf, importPlainText } from './import/documents';
import type { SaveImage } from './import/images';
import { importPptx } from './import/pptx';
import type { Content } from '@pollium/vyva-core/content';
import { unzipSync } from 'fflate';

export const MAX_IMPORT_BYTES = 25 * 1024 * 1024;

const ZIP_SIGNATURE = 0x04034b50;
const PDF_SIGNATURE = '%PDF-';
const TEXT_SAMPLE_BYTES = 64 * 1024;
const MAX_FILENAME = 200;
const BOM = /^﻿/;

type Detected = 'docx' | 'pptx' | 'pdf' | 'markdown' | 'text';

export interface ImportOptions{
    saveImage: SaveImage;
    maxBytes?: number;
}

export interface ImportedContent{
    title: string;
    content: Content;
}

const zipParts = (buffer: Buffer): Set<string> | null => {
    if(buffer.length < 4 || buffer.readUInt32LE(0) !== ZIP_SIGNATURE) return null;

    try{
        const names = new Set<string>();
        unzipSync(buffer, {
            filter: (file) => {
                names.add(file.name);
                return false;
            }
        });
        return names;
    }catch{
        return null;
    }
};

const isUtf8Text = (buffer: Buffer): boolean => {
    const sample = buffer.subarray(0, TEXT_SAMPLE_BYTES);
    if(sample.includes(0)) return false;

    try{
        new TextDecoder('utf-8', { fatal: true }).decode(sample);
        return true;
    }catch{
        return false;
    }
};

const detect = (buffer: Buffer, filename: string): Detected | null => {
    const parts = zipParts(buffer);
    if(parts !== null){
        if(parts.has('word/document.xml')) return 'docx';
        return parts.has('ppt/presentation.xml') ? 'pptx' : null;
    }
    if(buffer.subarray(0, PDF_SIGNATURE.length).toString('latin1') === PDF_SIGNATURE) return 'pdf';
    if(!isUtf8Text(buffer)) return null;

    const extension = filename.toLowerCase().split('.').at(-1) ?? '';
    if(extension === 'md' || extension === 'markdown') return 'markdown';
    if(extension === 'txt') return 'text';

    return null;
};

const convert = async (detected: Detected, buffer: Buffer, filename: string, saveImage: SaveImage): Promise<ImportedContent> => {
    if(detected === 'docx') return importDocx(buffer, filename, saveImage);
    if(detected === 'pptx') return importPptx(buffer, filename, saveImage);
    if(detected === 'pdf') return importPdf(buffer, filename);

    const text = buffer.toString('utf8').replace(BOM, '');
    return detected === 'markdown' ? importMarkdown(text, filename) : importPlainText(text, filename);
};

const isEmpty = (content: Content): boolean => content.kind === 'document' ? content.blocks.length === 0 : content.slides.length === 0;

export const importFile = async (data: Uint8Array, filename: string, { saveImage, maxBytes = MAX_IMPORT_BYTES }: ImportOptions): Promise<ImportedContent> => {
    if(data.length > maxBytes) throw new ConvertError('too-large', `The file is larger than ${maxBytes} bytes`);

    const buffer = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    const name = filename.replace(/[\\/]/g, '_').slice(-MAX_FILENAME);
    const detected = detect(buffer, name);
    if(detected === null) throw new ConvertError('unsupported', `${name} is not a file Vyva can import`);

    const imported = await convert(detected, buffer, name, saveImage);
    if(isEmpty(imported.content)) throw new ConvertError('empty', `${name} has nothing to import`);

    return imported;
};
