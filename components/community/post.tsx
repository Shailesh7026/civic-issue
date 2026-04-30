'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowBigUp,
  EllipsisIcon,
  MessageCircleIcon,
  Share2
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { upvoteIssue } from '@/lib/api/community'
import { useUserStore } from '@/store/useUserStore'

interface PostProps {
  issue: any
}

export const Post = ({ issue }: PostProps) => {
  const { profile } = useUserStore()
  // Optimistic UI for upvote
  const [upvotes, setUpvotes] = useState(issue.upvotes_count || 0)
  const [hasUpvoted, setHasUpvoted] = useState(false) // You'd ideally check true/false based on user's past votes

  const handleUpvote = async () => {
    if (!profile) return
    
    // Toggle logic for UI
    const value = hasUpvoted ? -1 : 1
    setUpvotes(upvotes + value)
    setHasUpvoted(!hasUpvoted)

    try {
      await upvoteIssue(issue.id, profile.id, value)
    } catch (e) {
      // revert if failed
      setUpvotes(upvotes)
      setHasUpvoted(hasUpvoted)
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/dashboard/community/issue/${issue.id}`
    if (navigator.share) {
      navigator.share({
        title: issue.title,
        text: issue.description,
        url: url
      }).catch(console.error)
    } else {
      await navigator.clipboard.writeText(url)
      alert("Link copied to clipboard!")
    }
  }

  return (
    <Card className="hover:border-slate-300 transition-colors">
      <CardHeader className='flex items-center justify-between gap-3 px-4 pt-4 pb-2'>
        <div className='flex items-center gap-3'>
          <Avatar className='ring-ring ring-1'>
            <AvatarImage src={issue.author_avatar_url || ''} alt={issue.author_first_name} />
            <AvatarFallback className='text-xs'>
              {issue.author_first_name?.charAt(0)}{issue.author_last_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className='flex flex-col gap-0.5'>
            <CardTitle className='flex items-center gap-1 text-sm'>
              {issue.author_first_name} {issue.author_last_name}
            </CardTitle>
            <CardDescription className="text-xs flex items-center gap-1">
              <span>{new Date(issue.created_at).toLocaleDateString()}</span>
              <span>•</span>
              <span className="font-medium text-slate-600">{issue.area_name}</span>
            </CardDescription>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='ghost' size='icon' aria-label='Toggle menu'>
            <EllipsisIcon />
          </Button>
        </div>
      </CardHeader>
      
      <Link href={`/dashboard/community/issue/${issue.id}`}>
        <CardContent className='space-y-2 text-sm px-4 py-2 cursor-pointer'>
          <CardTitle className='text-lg font-bold'>{issue.title}</CardTitle>
          <div className="flex gap-2 mb-2">
            <Badge variant="outline" className="text-[10px]">{issue.status}</Badge>
            <Badge variant="secondary" className="text-[10px]">{issue.priority}</Badge>
          </div>

          {issue.image_urls && issue.image_urls.length > 0 && (
            <img
              src={issue.image_urls[0]}
              alt='Banner'
              className='w-full max-h-72 rounded-md object-cover mb-3'
            />
          )}
          <p className="line-clamp-3 text-slate-700">
            {issue.description}
          </p>
        </CardContent>
      </Link>

      <CardFooter className='flex items-center gap-1 px-4 pb-4 pt-2 border-t mt-2'>
        <Button variant='ghost' size='sm' onClick={handleUpvote}>
          <ArrowBigUp className={cn(hasUpvoted && 'fill-teal-500 stroke-teal-500')} />
          {upvotes}
        </Button>
        <Link href={`/dashboard/community/issue/${issue.id}`}>
          <Button variant='ghost' size='sm'>
            <MessageCircleIcon />
            {issue.comments_count || 0}
          </Button>
        </Link>
        <Button variant='ghost' size='sm' onClick={handleShare}>
          <Share2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
