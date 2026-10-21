export const cssToStyle = (css: string): Record<string, string> => {
    const style: Record<string, string> = {};
    for(const declaration of css.split(';')){
        const separator = declaration.indexOf(':');
        if(separator === -1) continue;

        const property = declaration.slice(0, separator).trim();
        const value = declaration.slice(separator + 1).trim();
        if(property === '' || value === '') continue;

        style[property.startsWith('--') ? property : property.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase())] = value;
    }

    return style;
};
