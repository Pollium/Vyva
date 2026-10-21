import type { Messages } from './en';

const es: Messages = {
    ui: {
        close: 'Cerrar',
        cancel: 'Cancelar',
        hue: 'Tono',
        hexCode: 'Código hexadecimal',
        actionsOf: (subject) => `Acciones de ${subject}`
    },
    session: {
        newerVersion: 'Hay una versión más nueva de este contenido.',
        seeNewer: 'Ver la nueva',
        keepMine: 'Guardar la mía',
        keepMineHint: 'Tu versión queda como la actual.',
        seeNewerTitle: '¿Ver la versión nueva?',
        seeNewerDescription: 'Se descartan los cambios que hiciste y que no alcanzaron a guardarse. Si los quieres conservar, elige «Guardar la mía».',
        discardMine: 'Descartar mis cambios',
        loadFailed: 'No pudimos traer la versión nueva. Revisa tu conexión e inténtalo de nuevo.',
        saveFailed: (reason) => reason === null ? 'No se pudo guardar.' : `No se pudo guardar: ${reason}`,
        retry: 'Reintentar'
    },
    deck: {
        presentation: 'Presentación',
        leavePresentation: 'Salir de la presentación',
        slide: (number) => `Diapositiva ${number}`,
        slideOf: (number, total) => `Diapositiva ${number} de ${total}`
    }
};

export default es;
