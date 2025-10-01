"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Target, AlertCircle } from "lucide-react";

interface Prediction {
  symbol: string;
  currentPrice: number;
  predictedPrice: number;
  confidence: number;
  timeframe: string;
  trend: "bullish" | "bearish";
}

interface PredictionCardProps {
  prediction: Prediction;
}

export function PredictionCard({ prediction }: PredictionCardProps) {
  const priceChange = prediction.predictedPrice - prediction.currentPrice;
  const priceChangePercent = (priceChange / prediction.currentPrice) * 100;
  const isPositive = priceChange > 0;

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{prediction.symbol}</CardTitle>
            <CardDescription>
              AI Prediction • {prediction.timeframe}
            </CardDescription>
          </div>
          <Badge
            variant={prediction.trend === "bullish" ? "default" : "destructive"}
            className="flex items-center gap-1"
          >
            {prediction.trend === "bullish" ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {prediction.trend === "bullish" ? "Bullish" : "Bearish"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Price Information */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Price</span>
            <span className="font-medium">${prediction.currentPrice}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Predicted Price</span>
            <span className="font-medium">${prediction.predictedPrice}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Expected Change</span>
            <span className={`font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
              {isPositive ? "+" : ""}${priceChange.toFixed(2)} ({isPositive ? "+" : ""}{priceChangePercent.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Confidence Level */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Confidence</span>
            <span className="text-sm font-medium">{prediction.confidence}%</span>
          </div>
          <Progress 
            value={prediction.confidence} 
            className="h-2"
          />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {prediction.confidence > 80 ? (
              <>
                <Target className="h-3 w-3 text-green-500" />
                High confidence prediction
              </>
            ) : prediction.confidence > 60 ? (
              <>
                <AlertCircle className="h-3 w-3 text-yellow-500" />
                Moderate confidence
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 text-red-500" />
                Low confidence
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            View Details
          </Button>
          <Button size="sm" className="flex-1">
            Track
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
