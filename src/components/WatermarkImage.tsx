import React from 'react';
import logo from '../assets/logo-r.png';

interface WatermarkImageProps {
    src: string;
    alt: string;
    className?: string;
    style?: React.CSSProperties;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    logoSize?: number; // in pixels
    logoOpacity?: number; // 0 to 1
}

export const WatermarkImage: React.FC<WatermarkImageProps> = ({
    src,
    alt,
    className = '',
    style = {},
    position = 'bottom-right',
    logoSize = 50,
    logoOpacity = 0.35,
}) => {
    // Position styles for watermark
    const positionStyles: Record<string, React.CSSProperties> = {
        'top-left': { top: '8px', left: '8px' },
        'top-right': { top: '8px', right: '8px' },
        'bottom-left': { bottom: '8px', left: '8px' },
        'bottom-right': { bottom: '8px', right: '8px' },
        'center': {
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
        },
    };

    return (
        <div
            className={`watermark-container ${className}`}
            style={{
                position: 'relative',
                display: 'inline-block',
                overflow: 'hidden',
                ...style,
            }}
        >
            {/* Main Image */}
            <img
                src={src}
                alt={alt}
                className="w-full h-full object-cover"
                style={{
                    userSelect: 'none',
                    WebkitUserDrag: 'none',
                    pointerEvents: 'none',
                } as React.CSSProperties}
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
            />

            {/* Watermark Logo */}
            <div
                className="watermark-logo"
                style={{
                    position: 'absolute',
                    ...positionStyles[position],
                    width: `${logoSize}px`,
                    height: `${logoSize}px`,
                    opacity: logoOpacity,
                    pointerEvents: 'none',
                    zIndex: 5,
                }}
            >
                <img
                    src={logo}
                    alt="Watermark"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
                    }}
                    draggable={false}
                />
            </div>

            {/* Transparent overlay to prevent direct image access */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 10,
                    background: 'transparent',
                }}
                onContextMenu={(e) => e.preventDefault()}
            />
        </div>
    );
};

export default WatermarkImage;
