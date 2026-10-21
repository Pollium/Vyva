export class EditRefused extends Error{
    constructor(message: string){
        super(message);
        this.name = 'EditRefused';
    }
}
