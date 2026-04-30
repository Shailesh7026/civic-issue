'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Upload, X, Image as ImageIcon, Video,
  Loader2, CheckCircle2, AlertTriangle, FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MediaFile {
  file: File
  preview: string
  type: 'image' | 'video'
  compressed?: File
}

interface MediaUploadProps {
  media: MediaFile[]
  setMedia: React.Dispatch<React.SetStateAction<MediaFile[]>>
  maxImages?: number
  maxVideos?: number
  maxImageSizeMB?: number
  maxVideoSizeMB?: number
  allowVideo?: boolean
  label?: string
  helperText?: string
}

// ── Image compression (canvas) ────────────────────────────────────────────────
async function compressImage(file: File, maxWidthPx = 1280, quality = 0.82): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxWidthPx) {
        height = Math.round((height * maxWidthPx) / width)
        width = maxWidthPx
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        blob => {
          if (!blob) { resolve(file); return }
          resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }))
        },
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')) }
    img.src = url
  })
}

export function MediaUpload({
  media,
  setMedia,
  maxImages = 5,
  maxVideos = 0,
  maxImageSizeMB = 8,
  maxVideoSizeMB = 50,
  allowVideo = false,
  label = "Photos & Videos",
  helperText
}: MediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(async (files: FileList) => {
    const arr = Array.from(files)
    const newMedia: MediaFile[] = []
    const currentImages = media.filter(m => m.type === 'image').length
    const currentVideos = media.filter(m => m.type === 'video').length

    for (const file of arr) {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')

      if (!isImage && (!allowVideo || !isVideo)) { 
        toast.error(`${file.name}: unsupported type`)
        continue 
      }

      if (isImage && currentImages + newMedia.filter(m => m.type === 'image').length >= maxImages) {
        toast.error(`Max ${maxImages} images allowed`)
        continue
      }

      if (isVideo && currentVideos + newMedia.filter(m => m.type === 'video').length >= maxVideos) {
        toast.error(`Max ${maxVideos} videos allowed`)
        continue
      }

      if (isImage && file.size > maxImageSizeMB * 1024 * 1024) {
        toast.error(`${file.name}: image too large (max ${maxImageSizeMB}MB)`)
        continue
      }

      if (isVideo && file.size > maxVideoSizeMB * 1024 * 1024) {
        toast.error(`${file.name}: video too large (max ${maxVideoSizeMB}MB)`)
        continue
      }

      const preview = URL.createObjectURL(file)
      let compressed: File | undefined
      if (isImage) {
        try { compressed = await compressImage(file) } catch { compressed = file }
      }

      newMedia.push({ file, preview, type: isImage ? 'image' : 'video', compressed })
    }

    setMedia(prev => [...prev, ...newMedia])
  }, [media, maxImages, maxVideos, maxImageSizeMB, maxVideoSizeMB, allowVideo, setMedia])

  const removeMedia = (idx: number) => {
    setMedia(prev => {
      URL.revokeObjectURL(prev[idx].preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const images = media.filter(m => m.type === 'image')
  const videos = media.filter(m => m.type === 'video')

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold">{label}</label>
        <span className="text-[11px] text-muted-foreground font-medium">
          {images.length}/{maxImages} images{allowVideo && ` · ${videos.length}/${maxVideos} videos`}
        </span>
      </div>

      {/* Drop zone */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all group active:scale-[0.98]"
      >
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
        </div>
        <p className="text-sm font-semibold text-muted-foreground group-hover:text-foreground">
          Click to upload files
        </p>
        <p className="text-[11px] text-muted-foreground">
          {helperText || `Up to ${maxImages} images${allowVideo ? ` and ${maxVideos} videos` : ''}`}
        </p>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={allowVideo ? "image/*,video/*" : "image/*"}
        multiple
        onChange={e => e.target.files && handleFiles(e.target.files)}
      />

      {/* Preview grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-1">
          {media.map((m, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden aspect-square bg-muted border border-border shadow-sm">
              {m.type === 'image' ? (
                <img src={m.preview} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                  <Video className="w-6 h-6 text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground truncate px-2 max-w-full font-medium">
                    {m.file.name}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeMedia(i)
                }}
                className="absolute top-1.5 right-1.5 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="absolute bottom-1.5 left-1.5">
                <Badge className={cn(
                  "text-[9px] px-1.5 py-0 border-0 h-4 flex items-center font-bold uppercase",
                  m.type === 'image' ? "bg-blue-500/90 text-white" : "bg-purple-500/90 text-white"
                )}>
                  {m.type === 'image' ? <ImageIcon className="w-2.5 h-2.5 mr-1" /> : <Video className="w-2.5 h-2.5 mr-1" />}
                  {m.type}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
