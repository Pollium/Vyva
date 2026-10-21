const en = {
    ui: {
        close: 'Close',
        cancel: 'Cancel',
        hue: 'Hue',
        hexCode: 'Hex code',
        actionsOf: (subject: string) => `Actions for ${subject}`
    },
    session: {
        newerVersion: 'There is a newer version of this content.',
        seeNewer: 'See the new one',
        keepMine: 'Keep mine',
        keepMineHint: 'Your version becomes the current one.',
        seeNewerTitle: 'See the new version?',
        seeNewerDescription: 'The changes you made that were not saved yet are discarded. To keep them, choose “Keep mine”.',
        discardMine: 'Discard my changes',
        loadFailed: 'We could not load the new version. Check your connection and try again.',
        saveFailed: (reason: string | null) => reason === null ? 'Could not save.' : `Could not save: ${reason}`,
        retry: 'Retry'
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
