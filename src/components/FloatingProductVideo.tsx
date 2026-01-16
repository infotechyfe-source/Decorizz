import React, { useEffect, useState, useRef } from 'react';
import { X, Play, Volume2, VolumeX, Maximize2, Move } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { isYouTubeUrl, getYouTubeId, isGoogleDriveUrl, getDriveEmbedUrl, getDriveDirectVideoUrl } from '../utils/video';

type VideoItem = {
    id: string;
    title: string;
    url: string;
    caption?: string;
    thumbnail?: string;
    productId?: string | null;
};

interface FloatingProductVideoProps {
    productId: string;
}

export const FloatingProductVideo: React.FC<FloatingProductVideoProps> = ({ productId }) => {
    const [video, setVideo] = useState<VideoItem | null>(null);
    const [isVisible, setIsVisible] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Drag state
    const [position, setPosition] = useState({ x: 16, y: 100 }); // Initial position (right: 16px, bottom: 100px)
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchProductVideo();
    }, [productId]);

    const fetchProductVideo = async () => {
        try {
            setIsLoading(true);

            const response = await fetch(
                `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/videos`,
                { headers: { Authorization: `Bearer ${publicAnonKey}` } }
            );

            if (response.ok) {
                const data = await response.json();
                const videos = data.videos || data.items || [];

                // Find video linked to this product (with trim for whitespace handling)
                const productVideo = videos.find((v: VideoItem) => {
                    if (!v.productId) return false;
                    const videoProductId = String(v.productId).trim();
                    const targetProductId = String(productId).trim();
                    return videoProductId === targetProductId;
                });

                if (productVideo) {
                    setVideo(productVideo);
                }
            }
        } catch (error) {
            console.error('Error fetching product video:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Track if we actually moved during drag
    const [hasMoved, setHasMoved] = useState(false);

    // Drag handlers - prevent page scroll
    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        dragRef.current = {
            startX: clientX,
            startY: clientY,
            initialX: position.x,
            initialY: position.y,
        };
        setIsDragging(true);
        setHasMoved(false);
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleDragMove = (e: MouseEvent | TouchEvent) => {
            e.preventDefault(); // Prevent page scroll
            if (!dragRef.current) return;

            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

            const deltaX = dragRef.current.startX - clientX;
            const deltaY = dragRef.current.startY - clientY;

            // Check if we actually moved more than 5 pixels
            if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                setHasMoved(true);
            }

            // Calculate new position (remember: position is from right and bottom)
            const newX = Math.max(10, Math.min(window.innerWidth - 170, dragRef.current.initialX + deltaX));
            const newY = Math.max(10, Math.min(window.innerHeight - 230, dragRef.current.initialY + deltaY));

            setPosition({ x: newX, y: newY });
        };

        const handleDragEnd = () => {
            setIsDragging(false);
            dragRef.current = null;
        };

        // Use passive: false to allow preventDefault on touch events
        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);
        window.addEventListener('touchmove', handleDragMove, { passive: false });
        window.addEventListener('touchend', handleDragEnd);

        return () => {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [isDragging]);

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsVisible(false);
    };

    const handleExpand = () => {
        if (!isDragging) {
            setIsExpanded(true);
        }
    };

    const handleCollapse = () => {
        setIsExpanded(false);
        setIsMuted(true);
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMuted(!isMuted);
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
        }
    };

    // Don't render if no video or hidden
    if (!video || !isVisible) {
        return null;
    }

    // Render video element based on source type
    const renderVideo = (expanded: boolean) => {
        const baseClasses = expanded
            ? "w-full h-full object-contain"
            : "w-full h-full object-cover rounded-lg";

        if (isYouTubeUrl(video.url)) {
            const youtubeId = getYouTubeId(video.url);
            return (
                <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=${expanded ? 1 : 0}&modestbranding=1&rel=0&playsinline=1&loop=1&playlist=${youtubeId}`}
                    title={video.title}
                    className={baseClasses}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen={expanded}
                />
            );
        } else if (isGoogleDriveUrl(video.url)) {
            const streamUrl = getDriveDirectVideoUrl(video.url);
            if (streamUrl) {
                return (
                    <video
                        ref={videoRef}
                        src={streamUrl}
                        className={baseClasses}
                        autoPlay
                        muted={isMuted}
                        playsInline
                        loop
                        preload="auto"
                    />
                );
            }
            return (
                <iframe
                    src={getDriveEmbedUrl(video.url)}
                    title={video.title}
                    className={baseClasses}
                    allow="autoplay; fullscreen"
                    referrerPolicy="no-referrer"
                    allowFullScreen={expanded}
                />
            );
        } else {
            return (
                <video
                    ref={videoRef}
                    src={video.url}
                    className={baseClasses}
                    autoPlay
                    muted={isMuted}
                    playsInline
                    loop
                    preload="auto"
                />
            );
        }
    };

    // Expanded fullscreen modal
    if (isExpanded) {
        return (
            <div
                className="fixed inset-0 flex items-center justify-center"
                style={{ zIndex: 9999, backgroundColor: 'rgba(0, 0, 0, 0.95)' }}
                onClick={handleCollapse}
            >
                {/* Close button - Top right corner */}
                <button
                    onClick={handleCollapse}
                    className="absolute flex items-center justify-center transition-all hover:scale-110"
                    style={{
                        top: '20px',
                        right: '20px',
                        width: '48px',
                        height: '48px',
                        backgroundColor: '#fff',
                        borderRadius: '50%',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        zIndex: 10000,
                    }}
                >
                    <X className="w-6 h-6" style={{ color: '#000' }} />
                </button>

                {/* Reel-like vertical video container */}
                <div
                    className="relative overflow-hidden"
                    style={{
                        width: 'auto',
                        maxWidth: '450px',
                        height: '90vh',
                        aspectRatio: '9/16', // Vertical reel aspect ratio
                        borderRadius: '16px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {renderVideo(true)}

                    {/* Mute toggle - bottom right */}
                    <button
                        onClick={toggleMute}
                        className="absolute flex items-center justify-center transition-colors"
                        style={{
                            bottom: '80px',
                            right: '16px',
                            width: '44px',
                            height: '44px',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            backdropFilter: 'blur(8px)',
                            borderRadius: '50%',
                        }}
                    >
                        {isMuted ? (
                            <VolumeX className="w-5 h-5 text-white" />
                        ) : (
                            <Volume2 className="w-5 h-5 text-white" />
                        )}
                    </button>

                    {/* Video title - bottom */}
                    <div
                        className="absolute bottom-0 left-0 right-0 p-4 text-white"
                        style={{
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                        }}
                    >
                        <p className="font-semibold text-lg">{video.title}</p>
                        {video.caption && <p className="text-sm text-gray-300 mt-1">{video.caption}</p>}
                    </div>
                </div>
            </div>
        );
    }


    // Floating thumbnail (collapsed state)
    return (
        <div
            ref={containerRef}
            className="fixed group"
            style={{
                right: `${position.x}px`,
                bottom: `${position.y}px`,
                width: '160px',
                height: '220px',
                zIndex: 9998,
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                border: '2px solid rgba(255,255,255,0.3)',
                transition: isDragging ? 'none' : 'box-shadow 0.3s',
                cursor: isDragging ? 'grabbing' : 'pointer',
            }}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            onClick={() => {
                // Only expand if we didn't drag (no movement)
                if (!hasMoved) {
                    handleExpand();
                }
            }}
        >
            {/* Video container with rounded corners and shadow */}
            <div
                className="relative w-full h-full overflow-hidden"
                style={{
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
                }}
            >
                {/* Video player */}
                {renderVideo(false)}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Close button - clearly visible */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleClose(e);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="absolute flex items-center justify-center transition-all hover:scale-110 z-30"
                    style={{
                        top: '8px',
                        right: '8px',
                        width: '28px',
                        height: '28px',
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        borderRadius: '50%',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                >
                    <X className="w-4 h-4" style={{ color: '#333' }} />
                </button>

                {/* Bottom label */}
                <div className="absolute bottom-2 left-2 right-2 pointer-events-none z-20">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-white text-xs font-medium truncate">Watch Video</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
