const en = {
    ui: {
        close: 'Close',
        cancel: 'Cancel',
        hue: 'Hue',
        hexCode: 'Hex code',
        actionsOf: (subject: string) => `Actions for ${subject}`
    },
    deck: {
        presentation: 'Presentation',
        leavePresentation: 'Leave the presentation',
        slide: (number: number) => `Slide ${number}`,
        slideOf: (number: number, total: number) => `Slide ${number} of ${total}`
    }
};

export type Messages = typeof en;

export default en;
