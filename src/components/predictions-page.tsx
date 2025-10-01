"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  TrendingUp,
  TrendingDown,
  Plus,
  Filter,
  Calendar,
  BarChart3,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { PredictionCard } from "@/components/prediction-card";

// Mock data for predictions
const activePredictions = [
  {
    symbol: "AAPL",
    currentPrice: 175.43,
    predictedPrice: 182.50,
    confidence: 87,
    timeframe: "1 Week",
    trend: "bullish" as const,
    createdAt: "2024-01-15",
    expiresAt: "2024-01-22",
  },
  {
    symbol: "TSLA",
    currentPrice: 248.12,
    predictedPrice: 235.80,
    confidence: 72,
    timeframe: "2 Weeks",
    trend: "bearish" as const,
    createdAt: "2024-01-14",
    expiresAt: "2024-01-28",
  },
  {
    symbol: "NVDA",
    currentPrice: 875.28,
    predictedPrice: 920.15,
    confidence: 91,
    timeframe: "1 Month",
    trend: "bullish" as const,
    createdAt: "2024-01-13",
    expiresAt: "2024-02-13",
  },
  {
    symbol: "GOOGL",
    currentPrice: 142.56,
    predictedPrice: 148.90,
    confidence: 78,
    timeframe: "2 Weeks",
    trend: "bullish" as const,
    createdAt: "2024-01-12",
    expiresAt: "2024-01-26",
  },
];

const completedPredictions = [
  {
    symbol: "MSFT",
    currentPrice: 378.85,
    predictedPrice: 385.20,
    actualPrice: 382.10,
    confidence: 85,
    timeframe: "1 Week",
    trend: "bullish" as const,
    accuracy: 92,
    status: "completed" as const,
    createdAt: "2024-01-08",
    completedAt: "2024-01-15",
  },
  {
    symbol: "AMZN",
    currentPrice: 155.78,
    predictedPrice: 160.50,
    actualPrice: 158.20,
    confidence: 73,
    timeframe: "2 Weeks",
    trend: "bullish" as const,
    accuracy: 88,
    status: "completed" as const,
    createdAt: "2024-01-01",
    completedAt: "2024-01-15",
  },
];

export function PredictionsPage() {
  const [newPrediction, setNewPrediction] = useState({
    symbol: "",
    timeframe: "",
    model: "",
  });

  const handleCreatePrediction = () => {
    // In a real app, this would make an API call
    console.log("Creating prediction:", newPrediction);
    // Reset form
    setNewPrediction({ symbol: "", timeframe: "", model: "" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Predictions</h1>
          <p className="text-muted-foreground">
            Generate and track AI-powered stock predictions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Prediction
          </Button>
        </div>
      </div>

      {/* Create New Prediction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Create New Prediction
          </CardTitle>
          <CardDescription>
            Generate AI predictions for any stock symbol
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Stock Symbol</Label>
              <Input
                id="symbol"
                placeholder="e.g., AAPL, MSFT, GOOGL"
                value={newPrediction.symbol}
                onChange={(e) => setNewPrediction({ ...newPrediction, symbol: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeframe">Timeframe</Label>
              <Select
                value={newPrediction.timeframe}
                onValueChange={(value) => setNewPrediction({ ...newPrediction, timeframe: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">1 Day</SelectItem>
                  <SelectItem value="1w">1 Week</SelectItem>
                  <SelectItem value="2w">2 Weeks</SelectItem>
                  <SelectItem value="1m">1 Month</SelectItem>
                  <SelectItem value="3m">3 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">AI Model</Label>
              <Select
                value={newPrediction.model}
                onValueChange={(value) => setNewPrediction({ ...newPrediction, model: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lstm">LSTM Neural Network</SelectItem>
                  <SelectItem value="transformer">Transformer Model</SelectItem>
                  <SelectItem value="ensemble">Ensemble Model</SelectItem>
                  <SelectItem value="hybrid">Hybrid Model</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                onClick={handleCreatePrediction}
                className="w-full"
                disabled={!newPrediction.symbol || !newPrediction.timeframe || !newPrediction.model}
              >
                Generate Prediction
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Predictions Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Predictions</TabsTrigger>
          <TabsTrigger value="completed">Completed Predictions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activePredictions.map((prediction) => (
              <PredictionCard key={prediction.symbol} prediction={prediction} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedPredictions.map((prediction) => (
              <Card key={prediction.symbol} className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{prediction.symbol}</CardTitle>
                      <CardDescription>
                        Completed • {prediction.timeframe}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={prediction.accuracy > 80 ? "default" : "secondary"}
                      className="flex items-center gap-1"
                    >
                      <CheckCircle className="h-3 w-3" />
                      {prediction.accuracy}% Accurate
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Price Information */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Predicted Price</span>
                      <span className="font-medium">${prediction.predictedPrice}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Actual Price</span>
                      <span className="font-medium">${prediction.actualPrice}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Accuracy</span>
                      <span className={`font-medium ${prediction.accuracy > 80 ? "text-green-600" : "text-yellow-600"}`}>
                        {prediction.accuracy}%
                      </span>
                    </div>
                  </div>

                  {/* Accuracy Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Prediction Accuracy</span>
                    </div>
                    <Progress value={prediction.accuracy} className="h-2" />
                  </div>

                  {/* Dates */}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>Created: {prediction.createdAt}</p>
                    <p>Completed: {prediction.completedAt}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activePredictions.length + completedPredictions.length}</div>
                <p className="text-xs text-muted-foreground">
                  {activePredictions.length} active, {completedPredictions.length} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Accuracy</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(completedPredictions.reduce((acc, p) => acc + p.accuracy, 0) / completedPredictions.length)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on {completedPredictions.length} completed predictions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Confidence</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {activePredictions.filter(p => p.confidence > 80).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Predictions with &gt;80% confidence
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round((completedPredictions.filter(p => p.accuracy > 80).length / completedPredictions.length) * 100)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Predictions with &gt;80% accuracy
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Prediction Performance</CardTitle>
              <CardDescription>
                Historical accuracy and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  <p>Performance analytics charts coming soon...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
