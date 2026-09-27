import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type SyntheticEvent,
  type VideoHTMLAttributes,
} from 'react';

export interface SafeVideoProps extends Omit<
  VideoHTMLAttributes<HTMLVideoElement>,
  'children'
> {
  src?: string;
}

const SafeVideo = forwardRef<HTMLVideoElement, SafeVideoProps>(
  (
    {
      src,
      autoPlay,
      muted,
      playsInline = true,
      preload,
      className,
      onCanPlay,
      onLoadedData,
      onError,
      ...props
    },
    forwardedRef,
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [loadState, setLoadState] = useState({
      src,
      isLoading: Boolean(src),
      failed: false,
    });
    const currentLoadState =
      loadState.src === src
        ? loadState
        : { src, isLoading: Boolean(src), failed: false };

    useImperativeHandle(
      forwardedRef,
      () => videoRef.current as HTMLVideoElement,
      [],
    );

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !src) return;

      if (muted) {
        video.muted = true;
        video.defaultMuted = true;
      }

      video.load();

      if (!autoPlay) return;

      const play = () => {
        const playPromise = video.play();
        if (playPromise) {
          playPromise.catch(() => {
            // Mobile browsers may block autoplay in low power or data saver modes.
          });
        }
      };

      if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        play();
        return;
      }

      video.addEventListener('canplay', play, { once: true });
      return () => video.removeEventListener('canplay', play);
    }, [autoPlay, muted, src]);

    if (!src || currentLoadState.failed) return null;

    const markLoaded = () =>
      setLoadState({ src, isLoading: false, failed: false });

    return (
      <video
        key={src}
        ref={videoRef}
        src={src}
        autoPlay={autoPlay}
        muted={muted}
        playsInline={playsInline}
        preload={preload ?? (autoPlay ? 'auto' : 'metadata')}
        aria-busy={currentLoadState.isLoading || undefined}
        className={[
          className,
          currentLoadState.isLoading ? 'dt-safe-media--loading' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onCanPlay={(event: SyntheticEvent<HTMLVideoElement, Event>) => {
          markLoaded();
          onCanPlay?.(event);
        }}
        onLoadedData={(event: SyntheticEvent<HTMLVideoElement, Event>) => {
          markLoaded();
          onLoadedData?.(event);
        }}
        onError={(event: SyntheticEvent<HTMLVideoElement, Event>) => {
          onError?.(event);
          setLoadState({ src, isLoading: false, failed: true });
        }}
        {...props}
      />
    );
  },
);

SafeVideo.displayName = 'SafeVideo';

export default SafeVideo;
