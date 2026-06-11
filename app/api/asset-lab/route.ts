// GET /api/asset-lab
// Returns mock asset gallery data for the Asset Lab page.
// Asset Lab is Leonardo's image generation workspace.
//
// Response shape: { assets, spend, brandKit, brands, types, source }
// Each asset includes: id, title, type, brand, cost, thumbnailUrl, width, height, color

interface Asset {
  id: string
  title: string
  brand: string
  type: string
  cost: string
  thumbnailUrl: string
  width: number
  height: number
  color: string
}

interface AssetLabResponse {
  assets: Asset[]
  spend: {
    lastRender: string
    today: string
    thisMonth: string
  }
  brandKit: {
    style: string
    ratios: string
    persona: string
    colors: string[]
  }
  brands: string[]
  types: string[]
  source: 'mock'
}

export async function GET(): Promise<Response> {
  const assets: Asset[] = [
    {
      id: 'a1',
      title: 'Long-form thumb — big face, less text',
      brand: 'Vibe',
      type: 'Thumbnail',
      cost: '$1.70',
      thumbnailUrl: 'https://picsum.photos/seed/a1/640/360',
      width: 1920,
      height: 1080,
      color: '#6d5bd0',
    },
    {
      id: 'a2',
      title: 'Cinematic Site hero — Maria, dusk skyline',
      brand: 'By Design',
      type: 'Hero',
      cost: '$2.10',
      thumbnailUrl: 'https://picsum.photos/seed/a2/640/360',
      width: 2560,
      height: 1440,
      color: '#1f6f5c',
    },
    {
      id: 'a3',
      title: 'The 5-asset stack',
      brand: 'Vibe',
      type: 'Graphic',
      cost: '$1.20',
      thumbnailUrl: 'https://picsum.photos/seed/a3/640/360',
      width: 1200,
      height: 1200,
      color: '#7a3b8f',
    },
    {
      id: 'a4',
      title: 'Agents that ship code — reaction',
      brand: 'Vibe',
      type: 'Thumbnail',
      cost: '$1.40',
      thumbnailUrl: 'https://picsum.photos/seed/a4/640/360',
      width: 1920,
      height: 1080,
      color: '#b5532a',
    },
    {
      id: 'a5',
      title: 'Canela autumn drop — flat lay',
      brand: 'Canela',
      type: 'Post',
      cost: '$0.90',
      thumbnailUrl: 'https://picsum.photos/seed/a5/640/360',
      width: 1080,
      height: 1350,
      color: '#274b78',
    },
    {
      id: 'a6',
      title: 'Valhalla techno poster',
      brand: 'Valhalla',
      type: 'Cinematic',
      cost: '$1.80',
      thumbnailUrl: 'https://picsum.photos/seed/a6/640/360',
      width: 2048,
      height: 1152,
      color: '#9a7b2e',
    },
    {
      id: 'a7',
      title: 'Decision Queue reel cover',
      brand: 'Vibe',
      type: 'Post',
      cost: '$0.80',
      thumbnailUrl: 'https://picsum.photos/seed/a7/640/360',
      width: 1080,
      height: 1920,
      color: '#2e7d6b',
    },
    {
      id: 'a8',
      title: 'By Design app store hero',
      brand: 'By Design',
      type: 'Hero',
      cost: '$2.00',
      thumbnailUrl: 'https://picsum.photos/seed/a8/640/360',
      width: 2560,
      height: 1440,
      color: '#823f3f',
    },
    {
      id: 'a9',
      title: 'Vibe podcast cover — neon grid',
      brand: 'Vibe',
      type: 'Graphic',
      cost: '$1.10',
      thumbnailUrl: 'https://picsum.photos/seed/a9/640/360',
      width: 1400,
      height: 1400,
      color: '#3b82b0',
    },
    {
      id: 'a10',
      title: 'Canela lifestyle — morning routine',
      brand: 'Canela',
      type: 'Cinematic',
      cost: '$2.30',
      thumbnailUrl: 'https://picsum.photos/seed/a10/640/360',
      width: 2560,
      height: 1440,
      color: '#c47a3a',
    },
    {
      id: 'a11',
      title: 'Valhalla product showcase — dark mode',
      brand: 'Valhalla',
      type: 'Hero',
      cost: '$2.50',
      thumbnailUrl: 'https://picsum.photos/seed/a11/640/360',
      width: 2560,
      height: 1440,
      color: '#4a3d8c',
    },
    {
      id: 'a12',
      title: 'By Design IG carousel — swipe up',
      brand: 'By Design',
      type: 'Post',
      cost: '$1.00',
      thumbnailUrl: 'https://picsum.photos/seed/a12/640/360',
      width: 1080,
      height: 1920,
      color: '#5c6b3e',
    },
    {
      id: 'a13',
      title: 'Vibe short-form thumbnail pack',
      brand: 'Vibe',
      type: 'Thumbnail',
      cost: '$0.65',
      thumbnailUrl: 'https://picsum.photos/seed/a13/640/360',
      width: 1920,
      height: 1080,
      color: '#2e5c8a',
    },
    {
      id: 'a14',
      title: 'Canela seasonal banner set',
      brand: 'Canela',
      type: 'Graphic',
      cost: '$1.55',
      thumbnailUrl: 'https://picsum.photos/seed/a14/640/360',
      width: 1600,
      height: 900,
      color: '#8a3b5c',
    },
  ]

  const brands = ['All brands', 'Vibe', 'By Design', 'Valhalla', 'Canela']
  const types = ['All types', 'Thumbnail', 'Post', 'Hero', 'Cinematic', 'Graphic']

  const response: AssetLabResponse = {
    assets,
    spend: {
      lastRender: '$0.18',
      today: '$7.42',
      thisMonth: '$128.60',
    },
    brandKit: {
      style: 'Space Mood',
      ratios: '16:9 · 1:1 · 9:16',
      persona: 'Nina · brand persona',
      colors: ['#abc7ff', '#5fd0b4', '#c08bff', '#ffb693', '#15151b'],
    },
    brands,
    types,
    source: 'mock',
  }

  return Response.json(response)
}
