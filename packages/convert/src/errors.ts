export type ConvertErrorCode = 'too-large' | 'unsupported' | 'empty' | 'pdf-failed';

export class ConvertError extends Error{
    readonly code: ConvertErrorCode;

    constructor(code: ConvertErrorCode, message: string, options?: ErrorOptions){
        super(message, options);
        this.name = 'ConvertError';
        this.code = code;
    }
}
