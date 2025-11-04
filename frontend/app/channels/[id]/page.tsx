import ChannelDetailClient from './client'

// For static export with dynamic routes
// Note: Returning at least one param is required due to Next.js 14 bug with empty arrays
// See: https://github.com/vercel/next.js/issues/71862
export async function generateStaticParams() {
  // Return a placeholder param to satisfy Next.js build requirements
  // Actual channel data will be loaded client-side
  return [{ id: '1' }]
}

// Allow dynamic params beyond those returned by generateStaticParams
export const dynamicParams = true

export default function ChannelDetailPage() {
  return <ChannelDetailClient />
}
