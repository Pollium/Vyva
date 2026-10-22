import BackgroundMenu from '../BackgroundMenu';
import PanelRow from '../../editor/PanelRow';
import PanelSection from '../../editor/PanelSection';
import ColorInput from '../../ui/ColorInput';
import SelectInput from '../../ui/SelectInput';
import TextInput from '../../ui/TextInput';
import { useMessages } from '../../../messages/context';
import { FONT_FAMILIES, MAX_FOOTER_TEXT, type DeckContent, type DeckFooter, type DeckFormat, type DeckTheme, type FontFamily, type Slide, type SlideBackground } from '@pollium/vyva-core/content';

const FORMATS: readonly DeckFormat[] = ['16:9', '4:3', '1:1', 'a4-portrait', 'a4-landscape'];
const THEME_COLORS = ['background', 'text', 'accent', 'muted'] as const;
const FONT_OPTIONS = FONT_FAMILIES.map((font) => ({ value: font, label: font }));
const NO_FOOTER: DeckFooter = { left: '', center: '' };

interface SlidePanelProps{
    deck: DeckContent;
    slide: Slide;
    isLocked: boolean;
    onBackground: (background: SlideBackground | null) => void;
    onBackgroundImage: (() => void) | undefined;
    onTheme: (theme: DeckTheme) => void;
    onThemeDone: () => void;
    onFooter: (footer: DeckFooter) => void;
    onFormat: (format: DeckFormat) => void;
}

const SlidePanel = ({ deck, slide, isLocked, onBackground, onBackgroundImage, onTheme, onThemeDone, onFooter, onFormat }: SlidePanelProps) => {
    const t = useMessages();
    const footer = deck.footer ?? NO_FOOTER;

    const changeFont = (font: FontFamily) => {
        onTheme({ ...deck.theme, font });
        onThemeDone();
    };

    return (
        <fieldset disabled={isLocked} className='vy:flex vy:min-w-0 vy:flex-col vy:disabled:opacity-60'>
            <PanelSection title={t.deck.presentation}>
                <div className='vy:grid vy:grid-cols-2 vy:gap-x-3 vy:gap-y-2'>
                    {THEME_COLORS.map((key) => (
                        <ColorInput key={key} label={t.deck.themeColors[key]} value={deck.theme[key]} onChange={(value) => onTheme({ ...deck.theme, [key]: value })} onChangeEnd={onThemeDone} />
                    ))}
                </div>
                {deck.theme.frame?.footer === true ? (
                    <div className='vy:flex vy:flex-col vy:gap-2'>
                        <TextInput label={t.deck.footerLeft} value={footer.left} maxLength={MAX_FOOTER_TEXT} onChange={(left) => onFooter({ ...footer, left })} />
                        <TextInput label={t.deck.footerCenter} value={footer.center} maxLength={MAX_FOOTER_TEXT} onChange={(center) => onFooter({ ...footer, center })} />
                    </div>
                ) : null}
                <PanelRow label={t.editor.font}>
                    <SelectInput label={t.editor.font} hideLabel className='vy:w-40' value={deck.theme.font} options={FONT_OPTIONS} onChange={changeFont} />
                </PanelRow>
                <PanelRow label={t.deck.format}>
                    <SelectInput label={t.deck.format} hideLabel className='vy:w-40' value={deck.format} options={FORMATS.map((format) => ({ value: format, label: t.deck.formats[format] }))} onChange={onFormat} />
                </PanelRow>
            </PanelSection>

            <PanelSection title={t.deck.thisSlide}>
                <PanelRow label={t.deck.background}>
                    <BackgroundMenu theme={deck.theme} background={slide.background} onChange={onBackground} onPickImage={onBackgroundImage} onDone={onThemeDone} />
                </PanelRow>
            </PanelSection>
        </fieldset>
    );
};

export default SlidePanel;
