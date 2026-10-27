import { ConvertError } from '../errors';

export type LegacyOffice = 'doc' | 'ppt' | 'odt' | 'odp' | 'rtf';

export interface OfficeJob{
    file: Uint8Array;
    from: 'pdf' | LegacyOffice;
    to: 'docx' | 'pptx';
}

export type OfficeEngine = (job: OfficeJob) => Promise<Uint8Array>;

export const runOffice = async (engine: OfficeEngine, job: OfficeJob, filename: string): Promise<Buffer> => {
    const converted = await engine(job).catch((error: unknown) => {
        throw error instanceof ConvertError ? error : new ConvertError('office-failed', `${filename} could not be turned into ${job.to}`, { cause: error });
    });

    return Buffer.from(converted);
};
