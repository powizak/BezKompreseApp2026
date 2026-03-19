import { Share } from '@capacitor/share';

export const shareContent = async (title: string, text: string, url: string, dialogTitle: string = 'Sdílet') => {
    try {
        const canShare = await Share.canShare();
        if (canShare.value) {
            await Share.share({
                title,
                text,
                url,
                dialogTitle
            });
        } else {
            throw new Error('Share API not available');
        }
    } catch (err) {
        console.log('Falling back to clipboard', err);
        // Fallback for desktop: copy to clipboard
        navigator.clipboard.writeText(url);
        alert('Odkaz byl zkopírován do schránky!');
    }
};
