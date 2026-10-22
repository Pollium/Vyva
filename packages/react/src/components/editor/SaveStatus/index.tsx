import Button from '../../ui/Button';
import ConfirmDialog from '../../ui/ConfirmDialog';
import type { VyvaSession } from '../../../hooks/use-vyva-session';
import { useMessages } from '../../../messages/context';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface SaveStatusProps{
    session: Pick<VyvaSession<object>, 'saveState' | 'failure' | 'reload' | 'keepMine' | 'flush'>;
}

const SaveStatus = ({ session }: SaveStatusProps) => {
    const t = useMessages();
    const [isConfirming, setConfirming] = useState(false);
    const [isBusy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { saveState, failure } = session;

    const run = async (work: () => Promise<unknown>) => {
        setBusy(true);
        setError(null);
        try{
            await work();
        }catch{
            setError(t.session.loadFailed);
        }finally{
            setBusy(false);
        }
    };

    if(saveState === 'conflict'){
        return (
            <span role='alert' className='vy-ui vy:flex vy:flex-wrap vy:items-center vy:gap-x-2 vy:gap-y-0.5 vy:text-[0.8125rem] vy:text-warning'>
                <AlertTriangle className='vy:size-3.5 vy:shrink-0' aria-hidden='true' />
                {t.session.newerVersion}
                <Button size='sm' variant='tertiary' isDisabled={isBusy} onPress={() => setConfirming(true)}>{t.session.seeNewer}</Button>
                <Button size='sm' variant='tertiary' isDisabled={isBusy} onPress={() => void run(session.keepMine)} aria-description={t.session.keepMineHint}>{t.session.keepMine}</Button>
                <ConfirmDialog
                    isOpen={isConfirming}
                    onOpenChange={setConfirming}
                    title={t.session.seeNewerTitle}
                    description={t.session.seeNewerDescription}
                    confirmLabel={t.session.discardMine}
                    isPending={isBusy}
                    error={error}
                    onConfirm={() => void run(async () => {
                        await session.reload();
                        setConfirming(false);
                    })}
                />
            </span>
        );
    }
    if(saveState === 'failed'){
        return (
            <span role='alert' className='vy-ui vy:flex vy:flex-wrap vy:items-center vy:gap-x-2 vy:gap-y-0.5 vy:text-[0.8125rem] vy:text-danger'>
                <AlertTriangle className='vy:size-3.5 vy:shrink-0' aria-hidden='true' />
                <span className='vy:min-w-0 vy:truncate' title={failure?.message}>{t.session.saveFailed(failure?.message ?? null)}</span>
                <Button size='sm' variant='tertiary' onPress={() => void session.flush()}>{t.session.retry}</Button>
            </span>
        );
    }

    return null;
};

export default SaveStatus;
