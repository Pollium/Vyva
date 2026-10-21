import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: ['src/**/*.{ts,tsx}', '!src/**/tests/**'],
    platform: 'browser',
    unbundle: true,
    dts: true
});
