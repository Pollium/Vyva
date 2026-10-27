import { ConvertError } from './errors';
import { importDocx, importMarkdown, importPdf, importPlainText } from './import/documents';
import { imageTypeOf, importImage, type ImageType } from './import/image';
import type { SaveImage } from './import/images';
import { runOffice, type LegacyOffice, type OfficeEngine } from './import/office';
import { importPdfSlides } from './import/pdf-slides';
import { importPptx } from './import/pptx';
import type { Content } from '@pollium/vyva-core/content';
import { strFromU8, unzipSync } from 'fflate';

export const MAX_IMPORT_BYTES = 25 * 1024 * 1024;

const ZIP_SIGNATURE = 0x04034b50;
const PDF_SIGNATURE = '%PDF-';
const RTF_SIGNATURE = '{\\rtf';
const OLE_SIGNATURE = Buffer.from('d0cf11e0a1b11ae1', 'hex');
const TEXT_SAMPLE_BYTES = 64 * 1024;
const MAX_FILENAME = 200;
const MAX_MIMETYPE_BYTES = 128;
const BOM = /^﻿/;

const OPEN_DOCUMENTS: Record<string, LegacyOffice> = {
    'application/vnd.oasis.opendocument.text': 'odt',
    'application/vnd.oasis.opendocument.text-template': 'odt',
    'application/vnd.oasis.opendocument.presentation': 'odp',
    'application/vnd.oasis.opendocument.presentation-template': 'odp'
};

const OLE_STREAMS: Array<{ stream: Buffer; format: LegacyOffice }> = [
    { stream: Buffer.from('WordDocument', 'utf16le'), format: 'doc' },
    { stream: Buffer.from('PowerPoint Document', 'utf16le'), format: 'ppt' }
];

type Detected = 'docx' | 'pptx' | 'pdf' | 'markdown' | 'text' | ImageType | LegacyOffice;

export interface ImportOptions{
    saveImage: SaveImage;
    maxBytes?: number;
    officeEngine?: OfficeEngine;
}

export interface ImportedContent{
    title: string;
    content: Content;
}

interface ZipParts{
    names: Set<string>;
    mimetype: string;
}

const zipParts = (buffer: Buffer): ZipParts | null => {
    if(buffer.length < 4 || buffer.readUInt32LE(0) !== ZIP_SIGNATURE) return null;

    try{
        const names = new Set<string>();
        const read = unzipSync(buffer, {
            filter: (file) => {
                names.add(file.name);
                return file.name === 'mimetype' && file.originalSize <= MAX_MIMETYPE_BYTES;
            }
        });
        return { names, mimetype: read.mimetype === undefined ? '' : strFromU8(read.mimetype) };
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
    const zip = zipParts(buffer);
    if(zip !== null){
        if(zip.names.has('word/document.xml')) return 'docx';
        if(zip.names.has('ppt/presentation.xml')) return 'pptx';
        return OPEN_DOCUMENTS[zip.mimetype] ?? null;
    }
    if(buffer.subarray(0, PDF_SIGNATURE.length).toString('latin1') === PDF_SIGNATURE) return 'pdf';
    if(buffer.subarray(0, OLE_SIGNATURE.length).equals(OLE_SIGNATURE)) return OLE_STREAMS.find(({ stream }) => buffer.includes(stream))?.format ?? null;
    if(buffer.subarray(0, RTF_SIGNATURE.length).toString('latin1') === RTF_SIGNATURE) return 'rtf';

    const image = imageTypeOf(buffer);
    if(image !== null) return image;
    if(!isUtf8Text(buffer)) return null;

    const extension = filename.toLowerCase().split('.').at(-1) ?? '';
    if(extension === 'md' || extension === 'markdown') return 'markdown';
    if(extension === 'txt') return 'text';

    return null;
};

const textOf = (buffer: Buffer): string => buffer.toString('utf8').replace(BOM, '');

const upgraded = async (from: LegacyOffice, to: 'docx' | 'pptx', buffer: Buffer, filename: string, officeEngine: OfficeEngine | undefined): Promise<Buffer> => {
    if(officeEngine === undefined) throw new ConvertError('unsupported', `${filename} is a ${from} file, which Vyva imports only through an office engine`);

    const converted = await runOffice(officeEngine, { file: buffer, from, to }, filename);
    if(detect(converted, filename) !== to) throw new ConvertError('office-failed', `The office engine did not turn ${filename} into ${to}`);

    return converted;
};

const convert = async (detected: Detected, buffer: Buffer, filename: string, options: ImportOptions): Promise<ImportedContent> => {
    const { saveImage, officeEngine } = options;
    switch(detected){
        case 'docx':
            return importDocx(buffer, filename, saveImage);
        case 'pptx':
            return importPptx(buffer, filename, saveImage);
        case 'pdf':
            return officeEngine === undefined ? importPdf(buffer, filename) : importPdfSlides(buffer, filename, saveImage, officeEngine);
        case 'markdown':
            return importMarkdown(textOf(buffer), filename);
        case 'text':
            return importPlainText(textOf(buffer), filename);
        case 'image/png':
        case 'image/jpeg':
        case 'image/gif':
        case 'image/webp':
            return importImage(buffer, filename, detected, saveImage);
        case 'doc':
        case 'odt':
        case 'rtf':
            return convert('docx', await upgraded(detected, 'docx', buffer, filename, officeEngine), filename, options);
        case 'ppt':
        case 'odp':
            return convert('pptx', await upgraded(detected, 'pptx', buffer, filename, officeEngine), filename, options);
    }
};

const isEmpty = (content: Content): boolean => content.kind === 'document' ? content.blocks.length === 0 : content.slides.length === 0;

export const importFile = async (data: Uint8Array, filename: string, options: ImportOptions): Promise<ImportedContent> => {
    const { maxBytes = MAX_IMPORT_BYTES } = options;
    if(data.length > maxBytes) throw new ConvertError('too-large', `The file is larger than ${maxBytes} bytes`);

    const buffer = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    const name = filename.replace(/[\\/]/g, '_').slice(-MAX_FILENAME);
    const detected = detect(buffer, name);
    if(detected === null) throw new ConvertError('unsupported', `${name} is not a file Vyva can import`);

    const imported = await convert(detected, buffer, name, options);
    if(isEmpty(imported.content)) throw new ConvertError('empty', `${name} has nothing to import`);

    return imported;
};
