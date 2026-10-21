const en = {
    ui: {
        close: 'Close',
        cancel: 'Cancel',
        hue: 'Hue',
        hexCode: 'Hex code',
        actionsOf: (subject: string) => `Actions for ${subject}`
    }
};

export type Messages = typeof en;

export default en;
