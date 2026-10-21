import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button, Disclosure, DisclosurePanel, Heading } from 'react-aria-components';

interface PanelDisclosureProps{
    title: string;
    summary?: string;
    isExpanded?: boolean;
    onExpandedChange?: (isExpanded: boolean) => void;
    children: ReactNode;
}

const PanelDisclosure = ({ title, summary, isExpanded, onExpandedChange, children }: PanelDisclosureProps) => (
    <Disclosure className='vy:py-3' isExpanded={isExpanded} onExpandedChange={onExpandedChange}>
        {({ isExpanded: isOpen }) => (
            <>
                <Heading level={3}>
                    <Button slot='trigger' className='vy:flex vy:w-full vy:cursor-default vy:items-center vy:gap-1.5 vy:text-[0.8125rem] vy:font-medium vy:text-muted vy:outline-none vy:data-hovered:text-foreground vy:data-focus-visible:outline-2 vy:data-focus-visible:outline-foreground'>
                        {title}
                        {summary === undefined ? null : <span className='vy:ml-auto vy:min-w-0 vy:truncate vy:font-normal'>{summary}</span>}
                        <ChevronDown className={`vy:size-3.5 vy:shrink-0 vy:transition-transform vy:motion-reduce:transition-none ${summary === undefined ? 'vy:ml-auto' : 'vy:ml-1'} ${isOpen ? 'vy:rotate-180' : ''}`} aria-hidden='true' />
                    </Button>
                </Heading>
                <DisclosurePanel>
                    <div className='vy:flex vy:flex-col vy:gap-2.5 vy:pt-2.5'>{children}</div>
                </DisclosurePanel>
            </>
        )}
    </Disclosure>
);

export default PanelDisclosure;
