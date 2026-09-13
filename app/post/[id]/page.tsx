import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import PostDetailClient from '@/components/post/PostDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

function extractMediaUrls(rawMediaUrl: string | null): { videoUrl: string | null; imageUrl: string | null } {
  if (!rawMediaUrl) return { videoUrl: null, imageUrl: null };

  let url = rawMediaUrl;
  try {
    const parsed = JSON.parse(rawMediaUrl);
    if (Array.isArray(parsed) && parsed.length > 0) {
      url = parsed[0];
    } else if (typeof parsed === 'string') {
      url = parsed;
    }
  } catch {
    // raw string
  }

  const isVideo = url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov') || url.includes('/video');
  return {
    videoUrl: isVideo ? url : null,
    imageUrl: !isVideo ? url : null,
  };
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://r-mix.vercel.app';

  const { data: post } = await supabaseAdmin
    .from('posts')
    .select('id, content, media_url, type, created_at, updated_at, audience, thumbnail_url')
    .eq('id', id)
    .single();

  if (!post || (post.audience && post.audience !== 'public')) {
    return {
      title: 'Post Not Found | R.mix',
      robots: { index: false, follow: false },
    };
  }

  const { videoUrl, imageUrl } = extractMediaUrls(post.media_url);
  const cleanTitle = post.content
    ? `${post.content.slice(0, 60)}${post.content.length > 60 ? '...' : ''} | R.mix`
    : post.type === 'reel'
    ? 'Watch Viral Reel on R.mix'
    : post.type === 'video'
    ? 'Watch Video on R.mix'
    : 'View Post on R.mix';

  const description = post.content
    ? post.content.slice(0, 160)
    : 'Discover viral reels, videos, and creator content on R.mix - next-generation social platform.';

  const canonicalUrl = `${baseUrl}/post/${id}`;
  const previewImage = imageUrl || (post.thumbnail_url ? post.thumbnail_url : `${baseUrl}/icon.png`);

  return {
    title: cleanTitle,
    description: description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: cleanTitle,
      description: description,
      url: canonicalUrl,
      siteName: 'R.mix',
      type: post.type === 'video' || post.type === 'reel' ? 'video.other' : 'article',
      images: [
        {
          url: previewImage,
          width: 1200,
          height: 630,
          alt: cleanTitle,
        },
      ],
      ...(videoUrl ? {
        videos: [
          {
            url: videoUrl,
            width: 1080,
            height: 1920,
            type: 'video/mp4',
          },
        ],
      } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: cleanTitle,
      description: description,
      images: [previewImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function PostPage({ params }: Props) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://r-mix.vercel.app';

  const { data: post, error } = await supabaseAdmin
    .from('posts')
    .select('*, profiles:user_id(id, username, full_name, avatar_url), post_views(id)')
    .eq('id', id)
    .single();

  if (error || !post || (post.audience && post.audience !== 'public')) {
    notFound();
  }

  const { videoUrl, imageUrl } = extractMediaUrls(post.media_url);
  const author = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
  const canonicalUrl = `${baseUrl}/post/${id}`;
  const title = post.content || (post.type === 'reel' ? 'Viral Reel on R.mix' : 'Video on R.mix');

  // JSON-LD Structured Data
  const jsonLd = post.type === 'video' || post.type === 'reel' || videoUrl ? {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: title.slice(0, 100),
    description: post.content || 'Watch interactive video on R.mix',
    thumbnailUrl: [imageUrl || post.thumbnail_url || `${baseUrl}/icon.png`],
    uploadDate: post.created_at,
    contentUrl: videoUrl || '',
    embedUrl: canonicalUrl,
    publisher: {
      '@type': 'Organization',
      name: 'R.mix',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/icon.png`,
      },
    },
    author: {
      '@type': 'Person',
      name: author?.full_name || author?.username || 'R.mix Creator',
    },
  } : {
    '@context': 'https://schema.org',
    '@type': 'SocialMediaPosting',
    headline: title.slice(0, 100),
    articleBody: post.content || '',
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    image: imageUrl ? [imageUrl] : undefined,
    author: {
      '@type': 'Person',
      name: author?.full_name || author?.username || 'R.mix Creator',
    },
    publisher: {
      '@type': 'Organization',
      name: 'R.mix',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/icon.png`,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PostDetailClient
        post={post}
        author={author}
        videoUrl={videoUrl}
        imageUrl={imageUrl}
        siteUrl={baseUrl}
      />
    </>
  );
}
