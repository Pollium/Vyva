import { GALLERY } from './gallery';
import type { ImagePickerProps } from '@pollium/vyva-react/contracts/images';

const ImageGallery = ({ isOpen, onOpenChange, onPick }: ImagePickerProps) => {
    if(!isOpen) return null;

    return (
        <div role='dialog' aria-modal='true' aria-label='Pick an image' className='fixed inset-0 z-[90] grid place-items-center bg-black/40 p-4' onClick={() => onOpenChange(false)}>
            <div className='w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl' onClick={(event) => event.stopPropagation()}>
                <h2 className='mb-3 text-base font-semibold'>Pick an image</h2>
                <ul className='grid grid-cols-2 gap-3'>
                    {GALLERY.map((image) => (
                        <li key={image.fileId}>
                            <button type='button' className='w-full overflow-hidden rounded-xl ring-1 ring-black/10 hover:ring-2 hover:ring-black/40' onClick={() => onPick(image)}>
                                <img src={image.url} alt={image.alt} className='aspect-[3/2] w-full object-cover' />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ImageGallery;
