import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Loader2, RefreshCw, Search, SearchX } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '../ui/dialog';

const DEFAULT_ALLOWED_PROTOCOLS = ['http:', 'https:'];

const isImageDataUrl = (url = '') => /^data:image\//i.test(url);

const withCacheBust = (url, seed = Date.now()) => {
  if (!url || isImageDataUrl(url) || url.startsWith('blob:')) {
    return url;
  }

  try {
    const parsed = new URL(url);
    parsed.searchParams.set('t', String(seed));
    return parsed.toString();
  } catch {
    return url;
  }
};

const getSignedUrlExpiryDate = (url = '') => {
  try {
    const parsed = new URL(url);
    const params = parsed.searchParams;

    const amzDate = params.get('X-Amz-Date');
    const amzExpires = params.get('X-Amz-Expires');
    if (amzDate && amzExpires) {
      const base = Date.UTC(
        Number(amzDate.slice(0, 4)),
        Number(amzDate.slice(4, 6)) - 1,
        Number(amzDate.slice(6, 8)),
        Number(amzDate.slice(9, 11)),
        Number(amzDate.slice(11, 13)),
        Number(amzDate.slice(13, 15))
      );
      return new Date(base + Number(amzExpires) * 1000);
    }

    const unixExpiry = params.get('Expires');
    if (unixExpiry && /^\d+$/.test(unixExpiry)) {
      const numeric = Number(unixExpiry);
      return new Date(numeric > 9999999999 ? numeric : numeric * 1000);
    }

    const azureExpiry = params.get('se');
    if (azureExpiry) {
      return new Date(azureExpiry);
    }

    return null;
  } catch {
    return null;
  }
};

const isSafeImageUrl = (url, allowlist = []) => {
  if (!url) return false;
  if (isImageDataUrl(url) || url.startsWith('blob:')) return true;

  try {
    const parsed = new URL(url);
    if (!DEFAULT_ALLOWED_PROTOCOLS.includes(parsed.protocol)) return false;

    if (!allowlist.length) return true;

    return allowlist.some((domain) => {
      if (!domain) return false;
      const normalized = domain.trim().toLowerCase();
      if (!normalized) return false;
      return parsed.hostname.toLowerCase() === normalized || parsed.hostname.toLowerCase().endsWith(`.${normalized}`);
    });
  } catch {
    return false;
  }
};

const preloadImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.loading = 'eager';
    image.referrerPolicy = 'no-referrer';

    image.onload = () => resolve(url);
    image.onerror = () => reject(new Error('Failed to load image.'));
    image.src = url;
  });

const SelfiePreviewDialog = ({
  open,
  onOpenChange,
  imageUrl,
  title = 'Selfie Preview',
  description = 'Attendance selfie snapshot',
  onRequestFreshUrl,
  allowedDomains = []
}) => {
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [zoom, setZoom] = useState(1);
  const requestRef = useRef(0);

  const safeZoom = useMemo(() => Math.max(1, Math.min(zoom, 3)), [zoom]);

  const loadImage = useCallback(
    async (forceRefresh = false) => {
      const requestId = Date.now();
      requestRef.current = requestId;

      setIsLoading(true);
      setIsError(false);
      setErrorMessage('');

      try {
        let sourceUrl = imageUrl || '';
        const signedExpiry = sourceUrl ? getSignedUrlExpiryDate(sourceUrl) : null;
        const isSignedUrlExpired = signedExpiry ? signedExpiry.getTime() <= Date.now() : false;

        if ((forceRefresh || isSignedUrlExpired) && onRequestFreshUrl) {
          const refreshed = await onRequestFreshUrl();
          if (refreshed) {
            sourceUrl = refreshed;
          }
        }

        if (!sourceUrl) {
          throw new Error('Image not available');
        }

        if (!isSafeImageUrl(sourceUrl, allowedDomains)) {
          throw new Error('Blocked unsafe image URL');
        }

        const candidate = withCacheBust(sourceUrl, `${Date.now()}-${retryCount}`);
        await preloadImage(candidate);

        if (requestRef.current !== requestId) return;

        setPreviewUrl(candidate);
      } catch (error) {
        if (requestRef.current !== requestId) return;
        setIsError(true);
        setPreviewUrl('');
        setErrorMessage(error?.message || 'Image not available');
      } finally {
        if (requestRef.current === requestId) {
          setIsLoading(false);
        }
      }
    },
    [allowedDomains, imageUrl, onRequestFreshUrl, retryCount]
  );

  useEffect(() => {
    if (!open) return;
    setZoom(1);
    loadImage(false);
  }, [open, loadImage]);

  useEffect(() => {
    if (!open) {
      setPreviewUrl('');
      setIsLoading(false);
      setIsError(false);
      setErrorMessage('');
      setZoom(1);
    }
  }, [open]);

  const handleRetry = useCallback(() => {
    setRetryCount((count) => count + 1);
    loadImage(true);
  }, [loadImage]);

  const zoomIn = useCallback(() => setZoom((value) => Math.min(3, value + 0.25)), []);
  const zoomOut = useCallback(() => setZoom((value) => Math.max(1, value - 0.25)), []);
  const resetZoom = useCallback(() => setZoom(1), []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0" hideClose>
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 dark:border-slate-800 dark:bg-slate-950/95">
          <DialogHeader className="mb-3">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
            <div className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
              <Button type="button" size="sm" variant="secondary" onClick={zoomOut} disabled={safeZoom <= 1}>
                <SearchX size={14} />
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={resetZoom}>
                {Math.round(safeZoom * 100)}%
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={zoomIn} disabled={safeZoom >= 3}>
                <Search size={14} />
              </Button>
            </div>

            <div className="grid min-h-[420px] place-items-center p-4 sm:p-6">
              {isLoading ? (
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <Loader2 size={26} className="animate-spin" />
                  <p className="text-sm">Loading selfie preview...</p>
                </div>
              ) : null}

              {!isLoading && isError ? (
                <div className="flex max-w-sm flex-col items-center gap-3 text-center">
                  <div className="rounded-full bg-rose-50 p-3 text-rose-600 dark:bg-rose-900/30">
                    <AlertCircle size={24} />
                  </div>
                  <p className="text-base font-semibold text-slate-800 dark:text-slate-100">Image not available</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {errorMessage || 'The selfie could not be loaded right now.'}
                  </p>
                  <div className="inline-actions">
                    <Button type="button" variant="secondary" onClick={handleRetry}>
                      <RefreshCw size={14} />
                      Retry
                    </Button>
                    <Button type="button" onClick={() => onOpenChange(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              ) : null}

              {!isLoading && !isError && previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Attendance selfie preview"
                  loading="lazy"
                  className="max-h-[72vh] w-auto max-w-full rounded-lg object-contain shadow-[0_20px_60px_-35px_rgba(15,23,42,0.65)] transition-transform duration-200"
                  style={{ transform: `scale(${safeZoom})` }}
                  onError={() => {
                    setIsError(true);
                    setErrorMessage('Image failed to render in browser.');
                  }}
                />
              ) : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default memo(SelfiePreviewDialog);
