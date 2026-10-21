import type { Messages } from './en';

const es: Messages = {
    ui: {
        close: 'Cerrar',
        cancel: 'Cancelar',
        hue: 'Tono',
        hexCode: 'Código hexadecimal',
        actionsOf: (subject) => `Acciones de ${subject}`
    },
    deck: {
        presentation: 'Presentación',
        leavePresentation: 'Salir de la presentación',
        slide: (number) => `Diapositiva ${number}`,
        slideOf: (number, total) => `Diapositiva ${number} de ${total}`
    }
};

export default es;
