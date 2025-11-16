import React from 'react'

interface ContentRendererProps {
  content: string
}

export default function ContentRenderer({ content }: ContentRendererProps) {
  const processContent = (html: string): string => {
    let processed = html

    // Parse quoted content - handles both single and nested quotes
    // Pattern: Lines starting with > are quoted, everything else is the reply
    const lines = processed.split('\n')
    const quotedLines: string[] = []
    const replyLines: string[] = []
    let inQuote = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.startsWith('>')) {
        quotedLines.push(line.substring(1).trim()) // Remove > and trim
        inQuote = true
      } else if (inQuote && line.trim() === '') {
        // Empty line after quote marks end of quote
        inQuote = false
      } else if (!inQuote) {
        replyLines.push(line)
      }
    }

    // If we found quoted content, format it
    if (quotedLines.length > 0 && replyLines.some(line => line.trim() !== '')) {
      // Extract username from first line (should be "username wrote:")
      const firstLine = quotedLines[0]
      const wroteMatch = firstLine.match(/^(.+?)\s+wrote:/)
      const username = wroteMatch ? wroteMatch[1] : 'Someone'

      // Join remaining quoted lines (skip the "wrote:" line)
      const quotedContent = quotedLines.slice(1).join('<br>').replace(/\.{3}$/, '...')

      const replyContent = replyLines.join('\n').trim()

      processed = `<div class="forum-quoted-post">
        <div class="forum-quoted-header">Posted by ${username}</div>
        <div class="forum-quoted-content">${quotedContent}</div>
      </div>
      <div class="forum-reply-content-text">${replyContent}</div>`
    }

    // YouTube embed pattern - handles both plain URLs and URLs in anchor tags
    const youtubeRegex =
      /(?:<a[^>]*>)?(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11}))(?:<\/a>)?/g
    processed = processed.replace(youtubeRegex, (match, url, videoId) => {
      return `<div class="embed-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 1rem 0;">
        <iframe
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
          src="https://www.youtube.com/embed/${videoId}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
        </iframe>
      </div>`
    })

    // Instagram embed pattern
    const instagramRegex = /https?:\/\/(?:www\.)?instagram\.com\/p\/([a-zA-Z0-9_-]+)/g
    processed = processed.replace(instagramRegex, match => {
      return `<blockquote class="instagram-media" data-instgrm-permalink="${match}" data-instgrm-version="14" style="background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1rem auto; max-width:540px; min-width:326px; padding:0; width:calc(100% - 2px);">
        <a href="${match}" target="_blank" rel="noopener noreferrer">View on Instagram</a>
      </blockquote>
      <script async src="//www.instagram.com/embed.js"></script>`
    })

    // Twitter/X embed pattern
    const twitterRegex =
      /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+)/g
    processed = processed.replace(twitterRegex, match => {
      return `<blockquote class="twitter-tweet" style="margin: 1rem auto;">
        <a href="${match}" target="_blank" rel="noopener noreferrer">View on X</a>
      </blockquote>
      <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>`
    })

    // Image URLs (direct image links)
    const imageRegex = /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|bmp)/gi
    processed = processed.replace(imageRegex, match => {
      return `<img src="${match}" alt="Embedded image" style="max-width: 100%; height: auto; margin: 1rem 0; border-radius: 8px;" />`
    })

    // Convert remaining plain URLs to clickable links (not already in <a> tags or embeds)
    const urlRegex = /(?<!["'>])(https?:\/\/[^\s<]+)(?![^<]*<\/a>)/g
    processed = processed.replace(urlRegex, match => {
      return `<a href="${match}" target="_blank" rel="noopener noreferrer" class="forum-link">${match}</a>`
    })

    return processed
  }

  const processedContent = processContent(content)

  return (
    <div
      className="forum-content-rendered"
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  )
}
