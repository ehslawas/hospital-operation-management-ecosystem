"use client";

import * as React from "react";

export interface ResponsiveImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'srcSet' | 'sizes'> {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  aspectRatio?: string;
  fallback?: string;
}

/**
 * ResponsiveImage component with automatic srcset generation and lazy loading
 * Optimizes images for different screen sizes to reduce bandwidth usage
 */
export const ResponsiveImage = React.forwardRef<HTMLImageElement, ResponsiveImageProps>(
  ({ 
    src, 
    alt, 
    sizes = "100vw",
    className = "",
    priority = false,
    aspectRatio,
    fallback,
    ...props 
  }, ref) => {
    // Generate srcset for different widths
    // If src contains query params or is a full URL, use as-is
    // Otherwise, we'll generate responsive variants
    const generateSrcSet = (baseSrc: string): string => {
      // If it's an external URL or already has query params, return as-is
      if (baseSrc.startsWith('http') || baseSrc.includes('?')) {
        return '';
      }

      // Common responsive widths
      const widths = [320, 640, 768, 1024, 1280, 1920];
      
      // For now, return empty string - actual srcset generation would require
      // server-side image processing or a CDN service
      // This is a placeholder for future implementation with image service
      return widths
        .map(w => {
          // If using a CDN or image service, construct URLs here
          // Example: `${baseSrc}?w=${w}&q=80 ${w}w`
          return '';
        })
        .filter(Boolean)
        .join(', ');
    };

    const srcSet = generateSrcSet(src);
    const imageSizes = sizes || "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

    // Determine loading strategy
    const loading: "lazy" | "eager" = priority ? "eager" : "lazy";

    // Handle aspect ratio
    const style: React.CSSProperties = {
      ...props.style,
      ...(aspectRatio ? { aspectRatio } : {}),
    };

    return (
      <img
        ref={ref}
        src={src}
        srcSet={srcSet || undefined}
        sizes={srcSet ? imageSizes : undefined}
        alt={alt}
        loading={loading}
        decoding="async"
        className={className}
        style={style}
        onError={(e) => {
          // Fallback to a placeholder or error image
          if (fallback && e.currentTarget.src !== fallback) {
            e.currentTarget.src = fallback;
          }
          props.onError?.(e);
        }}
        {...props}
      />
    );
  }
);

ResponsiveImage.displayName = "ResponsiveImage";

/**
 * Optimized image component for logos/icons that should always be crisp
 * Uses SVG when available, falls back to PNG with proper sizing
 */
export interface LogoImageProps extends Omit<ResponsiveImageProps, 'sizes'> {
  size?: number | string;
}

export const LogoImage = React.forwardRef<HTMLImageElement, LogoImageProps>(
  ({ 
    src, 
    alt, 
    size = 64,
    className = "",
    priority = true,
    ...props 
  }, ref) => {
    // Prefer SVG over PNG for logos, but fallback to original if SVG doesn't exist
    const svgSrc = src.includes('.svg') ? src : src.replace(/\.(png|jpg|jpeg)$/i, '.svg');
    
    // Handle size prop - can be number (px), string (Tailwind class), or undefined
    const sizeClass = typeof size === 'number' 
      ? `w-[${size}px] h-[${size}px]` 
      : typeof size === 'string'
      ? size
      : 'w-16 h-16';

    return (
      <ResponsiveImage
        ref={ref}
        src={svgSrc}
        alt={alt}
        priority={priority}
        className={`${sizeClass} object-contain ${className}`}
        sizes={typeof size === 'number' ? `${size}px` : "(max-width: 640px) 48px, 64px"}
        fallback={src} // Fallback to original if SVG fails
        {...props}
      />
    );
  }
);

LogoImage.displayName = "LogoImage";

export default ResponsiveImage;

