import React, { useEffect, useRef, useState } from 'react';
import {
  extractDigitalStoragePath,
  getSignedDigitalUrl,
  resolveDigitalImageForDisplay,
} from '../../lib/supabase';

type DigitalImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  'src'
> & {
  /** Storage path, legacy public URL, or data: URL from the database / form state. */
  storageRef?: string | null;
};

export function DigitalImage({
  storageRef,
  alt = '',
  className,
  style,
  ...rest
}: DigitalImageProps) {
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const retriedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    retriedRef.current = false;

    if (!storageRef) {
      setDisplaySrc(null);
      return;
    }

    resolveDigitalImageForDisplay(storageRef).then((url) => {
      if (!cancelled) setDisplaySrc(url);
    });

    return () => {
      cancelled = true;
    };
  }, [storageRef]);

  useEffect(() => {
    setIsLoaded(false);
  }, [displaySrc]);

  const handleError = () => {
    if (retriedRef.current || !storageRef) return;
    retriedRef.current = true;

    const path = extractDigitalStoragePath(storageRef);
    if (!path) return;

    getSignedDigitalUrl(path).then((fresh) => {
      if (fresh) setDisplaySrc(fresh);
    });
  };

  if (!displaySrc) {
    return (
      <div
        className={[className, 'cv-digital-image', 'animate-pulse'].filter(Boolean).join(' ')}
        style={{
          backgroundColor: 'var(--cv-elevated)',
          ...style,
        }}
        aria-hidden={!alt}
      />
    );
  }

  return (
    <img
      {...rest}
      src={displaySrc}
      alt={alt}
      className={[className, 'cv-digital-image'].filter(Boolean).join(' ')}
      style={{
        ...style,
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}
      onLoad={(event) => {
        setIsLoaded(true);
        rest.onLoad?.(event);
      }}
      onError={handleError}
    />
  );
}
