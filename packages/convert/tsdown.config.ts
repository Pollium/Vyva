import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: ['src/**/*.ts', '!src/tests/**'],
    platform: 'node',
    fixedExtension: false,
    unbundle: true,
    dts: true
});
