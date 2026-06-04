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
        className={className}
        style={{
          backgroundColor: '#1a1a1a',
          ...style,
        }}
        aria-hidden={!alt}
      />
    );
  }

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      {...rest}
    />
  );
}
