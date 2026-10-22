import type { PickedImage } from '../contracts/images';
import type { FileUrl } from '@pollium/vyva-core/render';
import { useCallback, useMemo, useState } from 'react';

export interface PickedImages{
    fileUrl: FileUrl;
    remember: (image: PickedImage) => void;
}

export const usePickedImages = (hostFileUrl: FileUrl): PickedImages => {
    const [picked, setPicked] = useState<Record<string, string>>({});
    const fileUrl = useMemo<FileUrl>(() => (fileId) => picked[fileId] ?? hostFileUrl(fileId), [picked, hostFileUrl]);
    const remember = useCallback((image: PickedImage) => setPicked((current) => ({ ...current, [image.fileId]: image.url })), []);

    return { fileUrl, remember };
};
