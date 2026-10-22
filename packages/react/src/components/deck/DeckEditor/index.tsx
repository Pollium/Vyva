import CodeEditorDialog from '../CodeEditorDialog';
import DeckToolbar from '../DeckToolbar';
import ElementPanel from '../ElementPanel';
import LayoutPicker from '../LayoutPicker';
import NewSlideMenu from '../NewSlideMenu';
import PlainCodeEditor from '../PlainCodeEditor';
import SlidePanel from '../SlidePanel';
import SlideRail from '../SlideRail';
import SlideStage from '../SlideStage';
import TableDialog from '../TableDialog';
import ZoomControl from '../ZoomControl';
import PresentMode from '../../PresentMode';
import Inspector from '../../editor/Inspector';
import type { CodeEditor } from '../../../contracts/code-editor';
import type { EditorSession } from '../../../contracts/editor-session';
import type { ImagePicker } from '../../../contracts/images';
import type { InspectorPanel } from '../../../contracts/inspector-panel';
import { useDeckEditor } from '../../../hooks/use-deck-editor';
import { useDeckImages } from '../../../hooks/use-deck-images';
import { useDeckShortcuts } from '../../../hooks/use-deck-shortcuts';
import { useInspector } from '../../../hooks/use-inspector';
import { usePickedImages } from '../../../hooks/use-picked-images';
import { INITIAL_FIT } from '../../../hooks/use-stage-fit';
import { useWheelStep } from '../../../hooks/use-wheel-step';
import { useMessages } from '../../../messages/context';
import { align, arrange, newCode, newShape, newTable, updateElements, withSlide, withText } from '../../../utils/deck/deck-ops';
import { layoutPresetsOf } from '../../../utils/deck/layout-presets';
import type { CodeElement, SlideElement, TableElement } from '@pollium/vyva-core/content';
import { reformat, retheme } from '@pollium/vyva-core/deck-theme';
import { CONTENT_CSS, type FileUrl } from '@pollium/vyva-core/render';
import { useImperativeHandle, useRef, useState, type Ref } from 'react';

export interface DeckEditorHandle{
    present: () => void;
    showPanel: () => void;
}

interface DeckEditorProps{
    session: EditorSession;
    readOnly: boolean;
    fileUrl: FileUrl;
    imagePicker?: ImagePicker;
    codeEditor?: CodeEditor;
    panel?: InspectorPanel;
    onImprove?: (element: SlideElement, slideNumber: number) => void;
    ref?: Ref<DeckEditorHandle>;
}

const DeckEditor = ({ session, readOnly, fileUrl: hostFileUrl, imagePicker: Picker, codeEditor = PlainCodeEditor, panel, onImprove, ref }: DeckEditorProps) => {
    const t = useMessages();
    const { fileUrl, remember } = usePickedImages(hostFileUrl);
    const editor = useDeckEditor({ session, readOnly });
    const images = useDeckImages(editor, remember);
    const inspector = useInspector();
    const [zoom, setZoom] = useState<number | null>(null);
    const [fit, setFit] = useState(INITIAL_FIT);
    const [isPresenting, setPresenting] = useState(false);
    const stage = useRef<HTMLDivElement | null>(null);
    const onKeyDown = useDeckShortcuts({ editor, readOnly, isPresenting });
    const { deck, index, slide, selected, selection, editing, dialog, live } = editor;
    const single = selection.length === 1 ? selection[0] : null;
    const presets = layoutPresetsOf(t).filter((preset) => Picker !== undefined || !preset.needsImage);
    const pickImage = Picker === undefined ? undefined : (target: 'add' | 'replace' | 'background') => () => editor.openDialog({ kind: 'image', target: { kind: target } });

    useWheelStep(stage, editing === null && zoom === null ? editor.step : null);

    const present = () => {
        editor.finishEditing();
        setPresenting(true);
    };

    const openDialogOf = (kind: 'table' | 'code') => {
        editor.finishEditing();
        if(single !== null) editor.openDialog({ kind, id: single.id });
    };

    useImperativeHandle(ref, () => ({ present, showPanel: () => inspector.show('panel') }));

    const code = dialog?.kind === 'code' ? slide.elements.find((element): element is CodeElement => element.id === dialog.id && element.type === 'code') ?? null : null;
    const table = dialog?.kind === 'table' ? slide.elements.find((element): element is TableElement => element.id === dialog.id && element.type === 'table') ?? null : null;

    return (
        <div onKeyDown={onKeyDown} className='vy:flex vy:h-full vy:min-h-0 vy:min-w-0 vy:flex-1 vy:flex-col vy:bg-foreground/[0.03] vy:text-foreground vy:max-lg:landscape:grid vy:max-lg:landscape:grid-cols-[auto_minmax(0,1fr)] vy:max-lg:landscape:grid-rows-[minmax(0,1fr)_auto] vy:lg:flex-row vy:lg:gap-3 vy:lg:p-3'>
            <style>{CONTENT_CSS}</style>
            <SlideRail
                deck={deck}
                current={index}
                fileUrl={fileUrl}
                isLocked={readOnly}
                onSelect={editor.goTo}
                onMove={editor.moveSlideTo}
                onDuplicate={editor.duplicateSlideAt}
                onRemove={editor.removeSlideAt}
                onRelayout={(at) => {
                    editor.goTo(at);
                    editor.openDialog({ kind: 'layout', at });
                }}
                addButton={<NewSlideMenu presets={presets} isLocked={readOnly} onPick={images.addSlideFrom} />}
            />

            <div className='vy:flex vy:min-h-0 vy:min-w-0 vy:flex-1 vy:flex-col'>
                <DeckToolbar
                    selection={selection}
                    editing={editing}
                    textEditor={editing?.kind === 'text' ? editor.textEditor : null}
                    isLocked={readOnly}
                    onAddText={() => editor.addText(t.deck.writeHere)}
                    onAddImage={pickImage?.('add')}
                    onAddShape={(shape) => editor.add(newShape(deck, shape))}
                    onAddTable={() => editor.add(newTable(deck, t.deck.newTableColumns))}
                    onAddCode={() => editor.add(newCode(deck, t.deck.newCode))}
                    onEditCode={() => openDialogOf('code')}
                    onEditTable={() => openDialogOf('table')}
                    onReplaceImage={pickImage?.('replace')}
                    onDuplicate={() => editor.insertCopies(selection)}
                    onDelete={editor.remove}
                    onImprove={onImprove === undefined || single === null ? undefined : () => onImprove(single, index + 1)}
                    onFinishEdit={editor.finishEditing}
                />

                <div ref={stage} className='vy:flex vy:min-h-0 vy:flex-1 vy:flex-col'>
                    <SlideStage
                        history={editor.history}
                        slideIndex={index}
                        fileUrl={fileUrl}
                        selected={selected}
                        editing={editing}
                        isLocked={readOnly}
                        zoom={zoom}
                        onFit={setFit}
                        onSelect={editor.select}
                        onStartEdit={editor.startEditing}
                        onFinishEdit={editor.finishEditing}
                        onTextChange={(id, html) => live.type((current) => updateElements(current, index, [id], (element) => withText(element, html, current.theme)))}
                        onCellChange={(id, rows) => live.change((current) => updateElements(current, index, [id], (element) => element.type === 'table' ? { ...element, rows } : element))}
                        onCell={(id, cell) => editor.setEditing({ kind: 'cell', id, cell })}
                        onTextEditor={editor.setTextEditor}
                    />
                </div>

                <div className='vy:flex vy:shrink-0 vy:justify-center vy:pt-1 vy:max-lg:landscape:hidden'>
                    <ZoomControl scale={zoom ?? fit} isFit={zoom === null} onZoom={setZoom} />
                </div>
            </div>

            <Inspector
                inspector={inspector}
                panel={panel}
                properties={selection.length === 0 ? (
                    <SlidePanel
                        deck={deck}
                        slide={slide}
                        isLocked={readOnly}
                        onBackground={(background) => live.change((current) => withSlide(current, index, (target) => ({ ...target, background })))}
                        onBackgroundImage={pickImage?.('background')}
                        onTheme={(theme) => live.change((current) => retheme(current, theme))}
                        onThemeDone={live.finish}
                        onFooter={(footer) => live.type((current) => ({ ...current, footer }))}
                        onFormat={(format) => editor.apply((current) => reformat(current, format))}
                    />
                ) : (
                    <ElementPanel
                        deck={deck}
                        slideNumber={index + 1}
                        selection={selection}
                        editing={editing}
                        textEditor={editing?.kind === 'text' ? editor.textEditor : null}
                        isLocked={readOnly}
                        onPatch={editor.patch}
                        onArrange={(how) => editor.apply((current) => arrange(current, index, selected, how))}
                        onAlign={(how) => editor.apply((current) => align(current, index, selected, how))}
                        onToggleLock={() => {
                            const isLocking = !selection.every((element) => element.isLocked);
                            editor.patch((element) => ({ ...element, isLocked: isLocking }));
                        }}
                        onEditCode={() => openDialogOf('code')}
                    />
                )}
            />

            {Picker === undefined || dialog?.kind !== 'image' ? null : (
                <Picker isOpen onOpenChange={(isOpen) => { if(!isOpen) editor.closeDialog(); }} onPick={(image) => void images.place(dialog.target, image)} />
            )}
            {dialog?.kind === 'layout' ? <LayoutPicker presets={presets} slideNumber={dialog.at + 1} onPick={(preset) => images.relayout(dialog.at, preset)} onClose={editor.closeDialog} /> : null}
            {table === null ? null : (
                <TableDialog
                    table={table}
                    isLocked={readOnly}
                    onClose={editor.closeDialog}
                    onSave={(rows, hasHeader) => {
                        editor.apply((current) => updateElements(current, index, [table.id], (element) => element.type === 'table' ? { ...element, rows, hasHeader } : element));
                        editor.closeDialog();
                    }}
                />
            )}
            {code === null ? null : (
                <CodeEditorDialog
                    element={code}
                    isLocked={readOnly}
                    editor={codeEditor}
                    onClose={editor.closeDialog}
                    onSave={(source, language) => {
                        editor.apply((current) => updateElements(current, index, [code.id], (element) => element.type === 'code' ? { ...element, code: source, language } : element));
                        editor.closeDialog();
                    }}
                />
            )}
            {isPresenting ? <PresentMode deck={deck} start={index} fileUrl={fileUrl} onClose={() => setPresenting(false)} /> : null}
        </div>
    );
};

export default DeckEditor;
