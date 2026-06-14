import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui';
import { RefreshCw, X } from 'lucide-react';

export function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    if (!offlineReady && !needRefresh) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col gap-3 max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="flex gap-3">
                <div className="flex-1">
                    <h4 className="text-white font-black text-sm uppercase tracking-wider">
                        {offlineReady ? 'Ready for Offline' : 'Update Available'}
                    </h4>
                    <p className="text-slate-400 text-xs mt-1">
                        {offlineReady
                            ? 'App is ready to be used offline.'
                            : 'New content is available, click on reload button to update.'}
                    </p>
                </div>
                <button onClick={close} className="text-slate-400 hover:text-white h-6 w-6">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {needRefresh && (
                <Button
                    onClick={() => updateServiceWorker(true)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs h-9 w-full"
                >
                    <RefreshCw className="w-3.5 h-3.5 mr-2" />
                    Reload Application
                </Button>
            )}
        </div>
    );
}
