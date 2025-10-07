'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface StockRating {
  id: string
  symbol: string
  rating: 'BUY' | 'SELL' | 'HOLD' | 'STRONG_BUY' | 'STRONG_SELL'
  target_price: number
  current_price: number
  analyst: string
  reasoning: string
  confidence: number
  created_at: string
}

interface SimpleRatingSystemProps {
  onRatingSelected?: (rating: StockRating) => void
}

export default function SimpleRatingSystem({ onRatingSelected }: SimpleRatingSystemProps) {
  const [ratings, setRatings] = useState<StockRating[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRating, setSelectedRating] = useState<StockRating | null>(null)

  useEffect(() => {
    fetchRatings()
  }, [])

  const fetchRatings = async () => {
    try {
      setLoading(true)
      console.log('Environment variables:', {
        SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing'
      })
      
      const response = await fetch('https://cfllplzrnlveszccsejy.supabase.co/functions/v1/swift-endpoint/ratings', {
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmbGxwbHpybmx2ZXN6Y2NzZWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODY3NjgsImV4cCI6MjA3NDk2Mjc2OH0.RdpGdEey99WWjmbPUXHVT5tohXs80UwkM5iVx01DVjo`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch ratings')
      }
      
      const data = await response.json()
      setRatings(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'STRONG_BUY': return 'bg-green-100 text-green-800'
      case 'BUY': return 'bg-green-50 text-green-700'
      case 'HOLD': return 'bg-yellow-50 text-yellow-700'
      case 'SELL': return 'bg-red-50 text-red-700'
      case 'STRONG_SELL': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-50 text-gray-700'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading ratings...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 text-center py-8">
            <p>Error: {error}</p>
            <Button onClick={fetchRatings} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Stock Ratings ({ratings.length} stocks)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {ratings.map((rating) => (
              <div
                key={rating.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedRating?.id === rating.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  setSelectedRating(rating)
                  onRatingSelected?.(rating)
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="font-bold text-lg">{rating.symbol}</div>
                    <Badge className={getRatingColor(rating.rating)}>
                      {rating.rating}
                    </Badge>
                    <div className="text-sm text-gray-600">
                      by {rating.analyst}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      ${rating.current_price?.toFixed(2)} → ${rating.target_price?.toFixed(2)}
                    </div>
                    <div className={`text-sm ${getConfidenceColor(rating.confidence)}`}>
                      {(rating.confidence * 100).toFixed(0)}% confidence
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {rating.reasoning}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedRating && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Rating Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>Symbol:</strong> {selectedRating.symbol}</div>
              <div><strong>Rating:</strong> {selectedRating.rating}</div>
              <div><strong>Current Price:</strong> ${selectedRating.current_price?.toFixed(2)}</div>
              <div><strong>Target Price:</strong> ${selectedRating.target_price?.toFixed(2)}</div>
              <div><strong>Analyst:</strong> {selectedRating.analyst}</div>
              <div><strong>Confidence:</strong> {(selectedRating.confidence * 100).toFixed(0)}%</div>
              <div><strong>Reasoning:</strong> {selectedRating.reasoning}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
