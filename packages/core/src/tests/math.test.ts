import { describe, expect, it } from 'vitest';
import { inlineMarkdown, markdownToHtmlBlocks } from '../markdown-blocks';
import { withMath } from '../math';

describe('math', () => {
    it('renders LaTeX between delimiters as MathML and leaves prices and code alone', () => {
        const html = withMath('<p>El lote óptimo es $Q^* = \\sqrt{\\frac{2DS}{H}}$ y cuesta $30 por pedido y $10 por unidad.</p><p><code>echo $HOME$PATH</code></p>');

        expect(html).toContain('<math');
        expect(html).toContain('<msqrt>');
        expect(html).toContain('cuesta $30 por pedido y $10 por unidad.');
        expect(html).toContain('<code>echo $HOME$PATH</code>');
    });

    it('renders a display equation on its own and keeps the LaTeX intact through Markdown', () => {

        expect(inlineMarkdown('Costo **total**: $CT = DC + \\frac{D}{Q}S + \\frac{Q}{2}H$')).toBe('Costo <strong>total</strong>: $CT = DC + \\frac{D}{Q}S + \\frac{Q}{2}H$');
        const [block] = markdownToHtmlBlocks('$$\\sigma_L = \\sqrt{\\sigma_d^2 L}$$');
        expect(block).toBe('<p>$$\\sigma_L = \\sqrt{\\sigma_d^2 L}$$</p>');
        expect(withMath(block)).toContain('display="block"');
    });
});
