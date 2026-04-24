'use client'

import type { ImageLoaderProps } from 'next/image'

/**
 * Custom Next.js image loader for Cloudinary.
 *
 * By pointing next.config loaderFile here, all <Image> src resolution goes
 * through this function instead of /_next/image. For Cloudinary URLs the
 * browser fetches directly from Cloudinary's CDN — the Next.js server never
 * touches the pixel data, eliminating all server-side re-encoding overhead.
 *
 * For local/non-Cloudinary assets the src is returned unchanged so the
 * browser can fetch them from the public folder or the external origin.
 */
export default function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!src.includes('res.cloudinary.com')) {
    // Local public-folder assets and non-Cloudinary URLs (e.g. Google avatars)
    // are served as-is; no /_next/image proxy involved.
    return src
  }

  const uploadMarker = '/upload/'
  const idx = src.indexOf(uploadMarker)
  if (idx === -1) return src

  const base = src.slice(0, idx + uploadMarker.length)
  const rest = src.slice(idx + uploadMarker.length)

  // Strip any existing transform segment (injected by cldUrl() in components)
  // to avoid stacking e.g. "f_auto,q_auto:good,w_800,c_fill,g_auto/f_auto,q_75,w_640/..."
  const hasTransform = /^[a-z0-9_,:]+\//.test(rest)
  const imagePath = hasTransform ? rest.slice(rest.indexOf('/') + 1) : rest

  const q = quality ?? 75
  return `${base}f_auto,q_${q},w_${width},c_fill,g_auto/${imagePath}`
}
