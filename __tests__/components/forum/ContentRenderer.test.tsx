import React from 'react'
import { render, screen } from '@testing-library/react'
import ContentRenderer from '@/components/forum/ContentRenderer'

describe('ContentRenderer Component', () => {
  describe('Basic Rendering', () => {
    it('should render plain text content', () => {
      render(<ContentRenderer content="Hello World" />)

      const container = screen.getByText('Hello World')
      expect(container).toBeInTheDocument()
    })

    it('should render HTML content', () => {
      render(<ContentRenderer content="<strong>Bold Text</strong>" />)

      const bold = screen.getByText('Bold Text')
      expect(bold.tagName).toBe('STRONG')
    })

    it('should render with correct class name', () => {
      const { container } = render(<ContentRenderer content="Test" />)

      const rendered = container.querySelector('.forum-content-rendered')
      expect(rendered).toBeInTheDocument()
    })
  })

  describe('Quote Processing', () => {
    it('should parse quoted content with username and reply', () => {
      const content = '> johndoe wrote:\n> This is quoted content...\n\nThis is my reply'
      render(<ContentRenderer content={content} />)

      expect(screen.getByText('Posted by johndoe')).toBeInTheDocument()
      expect(screen.getByText('This is quoted content...')).toBeInTheDocument()
      expect(screen.getByText('This is my reply')).toBeInTheDocument()
    })

    it('should apply correct CSS classes to quoted content', () => {
      const content = '> user123 wrote:\n> Quoted text...\n\nReply text'
      const { container } = render(<ContentRenderer content={content} />)

      expect(container.querySelector('.forum-quoted-post')).toBeInTheDocument()
      expect(container.querySelector('.forum-quoted-header')).toBeInTheDocument()
      expect(container.querySelector('.forum-quoted-content')).toBeInTheDocument()
      expect(container.querySelector('.forum-reply-content-text')).toBeInTheDocument()
    })

    it('should handle content without quotes', () => {
      const content = 'Just a regular message without quotes'
      render(<ContentRenderer content={content} />)

      expect(screen.queryByText(/posted by/i)).not.toBeInTheDocument()
      expect(screen.getByText('Just a regular message without quotes')).toBeInTheDocument()
    })

    it('should handle multiline quoted content', () => {
      const content = '> testuser wrote:\n> First line of quote...\n\nMy actual reply here'
      render(<ContentRenderer content={content} />)

      expect(screen.getByText('Posted by testuser')).toBeInTheDocument()
      expect(screen.getByText('First line of quote...')).toBeInTheDocument()
    })
  })

  describe('YouTube Embed Processing', () => {
    it('should convert YouTube watch URL to embed', () => {
      const content = 'Check this out: https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      const { container } = render(<ContentRenderer content={content} />)

      const iframe = container.querySelector('iframe')
      expect(iframe).toBeInTheDocument()
      expect(iframe?.src).toContain('youtube.com/embed/dQw4w9WgXcQ')
    })

    it('should convert YouTube short URL to embed', () => {
      const content = 'https://youtu.be/dQw4w9WgXcQ'
      const { container } = render(<ContentRenderer content={content} />)

      const iframe = container.querySelector('iframe')
      expect(iframe).toBeInTheDocument()
      expect(iframe?.src).toContain('youtube.com/embed/dQw4w9WgXcQ')
    })

    it('should handle YouTube URL in anchor tags', () => {
      const content = '<a href="https://www.youtube.com/watch?v=test12345">Video</a>'
      const { container } = render(<ContentRenderer content={content} />)

      const iframe = container.querySelector('iframe')
      expect(iframe).toBeInTheDocument()
      expect(iframe?.src).toContain('youtube.com/embed/test12345')
    })

    it('should create responsive embed container', () => {
      const content = 'https://www.youtube.com/watch?v=test12345'
      const { container } = render(<ContentRenderer content={content} />)

      const embedContainer = container.querySelector('.embed-container')
      expect(embedContainer).toBeInTheDocument()
    })

    it('should add proper iframe attributes', () => {
      const content = 'https://www.youtube.com/watch?v=test12345'
      const { container } = render(<ContentRenderer content={content} />)

      const iframe = container.querySelector('iframe')
      expect(iframe).toHaveAttribute('allowfullscreen')
      expect(iframe).toHaveAttribute('allow')
    })

    it('should handle multiple YouTube URLs', () => {
      const content =
        'Video 1: https://www.youtube.com/watch?v=video1111 and Video 2: https://youtu.be/video2222'
      const { container } = render(<ContentRenderer content={content} />)

      const iframes = container.querySelectorAll('iframe')
      expect(iframes.length).toBe(2)
      expect(iframes[0].src).toContain('video1111')
      expect(iframes[1].src).toContain('video2222')
    })
  })

  describe('Instagram Embed Processing', () => {
    it('should convert Instagram URL to blockquote', () => {
      const content = 'Check this: https://www.instagram.com/p/ABC123/'
      const { container } = render(<ContentRenderer content={content} />)

      const blockquote = container.querySelector('.instagram-media')
      expect(blockquote).toBeInTheDocument()
      expect(blockquote).toHaveAttribute(
        'data-instgrm-permalink',
        'https://www.instagram.com/p/ABC123/'
      )
    })

    it('should add Instagram embed script', () => {
      const content = 'https://www.instagram.com/p/ABC123/'
      const { container } = render(<ContentRenderer content={content} />)

      const script = container.querySelector('script[src*="instagram.com/embed.js"]')
      expect(script).toBeInTheDocument()
    })

    it('should add View on Instagram link', () => {
      const content = 'https://www.instagram.com/p/ABC123/'
      render(<ContentRenderer content={content} />)

      const link = screen.getByText('View on Instagram')
      expect(link).toBeInTheDocument()
      expect(link.closest('a')).toHaveAttribute('href', 'https://www.instagram.com/p/ABC123/')
    })

    it('should handle Instagram URL without www', () => {
      const content = 'https://instagram.com/p/XYZ789/'
      const { container } = render(<ContentRenderer content={content} />)

      const blockquote = container.querySelector('.instagram-media')
      expect(blockquote).toBeInTheDocument()
    })
  })

  describe('Twitter/X Embed Processing', () => {
    it('should convert Twitter URL to blockquote', () => {
      const content = 'https://twitter.com/user/status/123456789'
      const { container } = render(<ContentRenderer content={content} />)

      const blockquote = container.querySelector('.twitter-tweet')
      expect(blockquote).toBeInTheDocument()
    })

    it('should convert X.com URL to blockquote', () => {
      const content = 'https://x.com/user/status/987654321'
      const { container } = render(<ContentRenderer content={content} />)

      const blockquote = container.querySelector('.twitter-tweet')
      expect(blockquote).toBeInTheDocument()
    })

    it('should add View on X link', () => {
      const content = 'https://twitter.com/user/status/123456789'
      render(<ContentRenderer content={content} />)

      const link = screen.getByText('View on X')
      expect(link).toBeInTheDocument()
    })

    it('should add Twitter widgets script', () => {
      const content = 'https://twitter.com/user/status/123456789'
      const { container } = render(<ContentRenderer content={content} />)

      const script = container.querySelector('script[src*="platform.twitter.com/widgets.js"]')
      expect(script).toBeInTheDocument()
    })

    it('should handle statuses (plural) in URL', () => {
      const content = 'https://twitter.com/user/statuses/123456789'
      const { container } = render(<ContentRenderer content={content} />)

      const blockquote = container.querySelector('.twitter-tweet')
      expect(blockquote).toBeInTheDocument()
    })
  })

  describe('Image URL Processing', () => {
    it('should convert JPG URL to img tag', () => {
      const content = 'https://example.com/image.jpg'
      const { container } = render(<ContentRenderer content={content} />)

      const img = container.querySelector('img[src="https://example.com/image.jpg"]')
      expect(img).toBeInTheDocument()
    })

    it('should convert JPEG URL to img tag', () => {
      const content = 'https://example.com/photo.jpeg'
      const { container } = render(<ContentRenderer content={content} />)

      const img = container.querySelector('img[src="https://example.com/photo.jpeg"]')
      expect(img).toBeInTheDocument()
    })

    it('should convert PNG URL to img tag', () => {
      const content = 'https://example.com/graphic.png'
      const { container } = render(<ContentRenderer content={content} />)

      const img = container.querySelector('img')
      expect(img).toBeInTheDocument()
    })

    it('should convert GIF URL to img tag', () => {
      const content = 'https://example.com/animation.gif'
      const { container } = render(<ContentRenderer content={content} />)

      const img = container.querySelector('img')
      expect(img).toBeInTheDocument()
    })

    it('should convert WebP URL to img tag', () => {
      const content = 'https://example.com/modern.webp'
      const { container } = render(<ContentRenderer content={content} />)

      const img = container.querySelector('img')
      expect(img).toBeInTheDocument()
    })

    it('should convert BMP URL to img tag', () => {
      const content = 'https://example.com/bitmap.bmp'
      const { container } = render(<ContentRenderer content={content} />)

      const img = container.querySelector('img')
      expect(img).toBeInTheDocument()
    })

    it('should add alt text to embedded images', () => {
      const content = 'https://example.com/image.jpg'
      const { container } = render(<ContentRenderer content={content} />)

      const img = container.querySelector('img')
      expect(img).toHaveAttribute('alt', 'Embedded image')
    })

    it('should add responsive styles to images', () => {
      const content = 'https://example.com/image.jpg'
      const { container } = render(<ContentRenderer content={content} />)

      const img = container.querySelector('img')
      expect(img?.style.maxWidth).toBe('100%')
      expect(img?.style.height).toBe('auto')
    })

    it('should handle multiple image URLs', () => {
      const content =
        'Image 1: https://example.com/img1.jpg and Image 2: https://example.com/img2.png'
      const { container } = render(<ContentRenderer content={content} />)

      const imgs = container.querySelectorAll('img')
      expect(imgs.length).toBe(2)
    })

    it('should be case-insensitive for image extensions', () => {
      const content = 'https://example.com/image.JPG'
      const { container } = render(<ContentRenderer content={content} />)

      const img = container.querySelector('img')
      expect(img).toBeInTheDocument()
    })
  })

  describe('Plain URL to Link Conversion', () => {
    it('should convert HTTP URL to clickable link', () => {
      const content = 'Visit http://example.com for more'
      const { container } = render(<ContentRenderer content={content} />)

      const link = container.querySelector('a.forum-link[href="http://example.com"]')
      expect(link).toBeInTheDocument()
    })

    it('should convert HTTPS URL to clickable link', () => {
      const content = 'Check https://secure-site.com'
      const { container } = render(<ContentRenderer content={content} />)

      const link = container.querySelector('a.forum-link')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', 'https://secure-site.com')
    })

    it('should open links in new tab', () => {
      const content = 'https://example.com'
      const { container } = render(<ContentRenderer content={content} />)

      const link = container.querySelector('a.forum-link')
      expect(link).toHaveAttribute('target', '_blank')
    })

    it('should add noopener noreferrer for security', () => {
      const content = 'https://example.com'
      const { container } = render(<ContentRenderer content={content} />)

      const link = container.querySelector('a.forum-link')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('should display URL as link text', () => {
      const content = 'https://example.com'
      render(<ContentRenderer content={content} />)

      const link = screen.getByText('https://example.com')
      expect(link).toBeInTheDocument()
    })

    it('should not convert URLs already in anchor tags', () => {
      const content = '<a href="https://example.com">Link</a>'
      const { container } = render(<ContentRenderer content={content} />)

      const links = container.querySelectorAll('a')
      expect(links.length).toBe(1)
    })
  })

  describe('Combined Content Processing', () => {
    it('should process quotes and URLs together', () => {
      const content = '> user wrote:\n> Check this...\n\nVisit https://example.com'
      const { container } = render(<ContentRenderer content={content} />)

      expect(container.querySelector('.forum-quoted-post')).toBeInTheDocument()
      expect(container.querySelector('a.forum-link')).toBeInTheDocument()
    })

    it('should process multiple embeds in same content', () => {
      const content = `
        YouTube: https://www.youtube.com/watch?v=test
        Image: https://example.com/img.jpg
        Twitter: https://twitter.com/user/status/123
      `
      const { container } = render(<ContentRenderer content={content} />)

      expect(container.querySelector('iframe')).toBeInTheDocument()
      expect(container.querySelector('img')).toBeInTheDocument()
      expect(container.querySelector('.twitter-tweet')).toBeInTheDocument()
    })

    it('should process all types of content in complex message', () => {
      const content = `
        > author wrote:\n> Quote...\n\n
        My reply with https://example.com/image.jpg
        And a video https://www.youtube.com/watch?v=test
        Plus a link to https://website.com
      `
      const { container } = render(<ContentRenderer content={content} />)

      expect(container.querySelector('.forum-quoted-post')).toBeInTheDocument()
      expect(container.querySelector('img')).toBeInTheDocument()
      expect(container.querySelector('iframe')).toBeInTheDocument()
      expect(container.querySelector('a.forum-link')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      const { container } = render(<ContentRenderer content="" />)

      const rendered = container.querySelector('.forum-content-rendered')
      expect(rendered).toBeInTheDocument()
      expect(rendered?.textContent).toBe('')
    })

    it('should handle content with only whitespace', () => {
      const { container } = render(<ContentRenderer content="   \n\n  " />)

      const rendered = container.querySelector('.forum-content-rendered')
      expect(rendered).toBeInTheDocument()
    })

    it('should handle malformed URLs gracefully', () => {
      const content = 'htt://broken-url and ://another-broken'
      const { container } = render(<ContentRenderer content={content} />)

      expect(container.textContent).toContain('htt://broken-url')
    })

    it('should handle special characters in content', () => {
      const content = 'Special chars: & < > " \' /'
      render(<ContentRenderer content={content} />)

      expect(screen.getByText(/special chars/i)).toBeInTheDocument()
    })

    it('should handle content with newlines', () => {
      const content = 'Line 1\nLine 2\nLine 3'
      render(<ContentRenderer content={content} />)

      const container = screen.getByText(/Line 1/i)
      expect(container).toBeInTheDocument()
    })
  })
})
