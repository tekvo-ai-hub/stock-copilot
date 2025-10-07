"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Search, 
  Filter,
  Download,
  BarChart3,
  Activity,
  Target,
  Users,
  Newspaper
} from "lucide-react";

interface ScoringData {
  symbol: string;
  score: number;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  momentum_score: number;
  volume_score: number;
  technical_score: number;
  news_score: number;
  analyst_score: number;
  sector: string;
  last_updated: string;
}

export function ScoringMatrix() {
  const [scoringData, setScoringData] = useState<ScoringData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [sortBy, setSortBy] = useState("score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch scoring matrix data
  const fetchScoringMatrix = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching scoring matrix...');
      const response = await fetch('https://cfllplzrnlveszccsejy.supabase.co/functions/v1/stock-scoring/matrix', {
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmbGxwbHpybmx2ZXN6Y2NzZWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODY3NjgsImV4cCI6MjA3NDk2Mjc2OH0.RdpGdEey99WWjmbPUXHVT5tohXs80UwkM5iVx01DVjo`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch scoring matrix: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Scoring matrix data:', data);
      setScoringData(data.data || []);
    } catch (error) {
      setError('Failed to fetch scoring matrix');
      console.error('Error fetching scoring matrix:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchScoringMatrix();
  }, []);

  // Filter and sort data
  const filteredData = scoringData
    .filter(stock => {
      const matchesSearch = stock.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSector = sectorFilter === "all" || stock.sector === sectorFilter;
      return matchesSearch && matchesSector;
    })
    .sort((a, b) => {
      let aValue: number, bValue: number;
      
      switch (sortBy) {
        case "score":
          aValue = a.score;
          bValue = b.score;
          break;
        case "price":
          aValue = a.price;
          bValue = b.price;
          break;
        case "change":
          aValue = a.change_percent;
          bValue = b.change_percent;
          break;
        case "volume":
          aValue = a.volume;
          bValue = b.volume;
          break;
        default:
          aValue = a.score;
          bValue = b.score;
      }
      
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    });

  // Get unique sectors
  const sectors = Array.from(new Set(scoringData.map(stock => stock.sector)));

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  // Get change color
  const getChangeColor = (change: number) => {
    return change >= 0 ? "text-green-600" : "text-red-600";
  };

  // Get change icon
  const getChangeIcon = (change: number) => {
    return change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Stock Scoring Matrix</h2>
          <p className="text-muted-foreground">
            Real-time scoring analysis for 100+ stocks based on multiple factors
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchScoringMatrix} disabled={loading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search stocks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                {sectors.map(sector => (
                  <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Score</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="change">Change %</SelectItem>
                <SelectItem value="volume">Volume</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total Stocks</p>
                <p className="text-2xl font-bold">{scoringData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">High Scores (80+)</p>
                <p className="text-2xl font-bold text-green-600">
                  {scoringData.filter(s => s.score >= 80).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Avg Score</p>
                <p className="text-2xl font-bold">
                  {scoringData.length > 0 ? Math.round(scoringData.reduce((sum, s) => sum + s.score, 0) / scoringData.length) : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Top Performer</p>
                <p className="text-2xl font-bold">
                  {scoringData.length > 0 ? scoringData[0].symbol : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scoring Matrix Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Scoring Matrix</CardTitle>
          <CardDescription>
            Comprehensive scoring analysis based on momentum, volume, technical indicators, news sentiment, and analyst recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              <span>Loading scoring matrix...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-600">
              <span>{error}</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Momentum</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Technical</TableHead>
                    <TableHead>News</TableHead>
                    <TableHead>Analyst</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((stock, index) => (
                    <TableRow key={stock.symbol}>
                      <TableCell className="font-medium">#{index + 1}</TableCell>
                      <TableCell className="font-bold">{stock.symbol}</TableCell>
                      <TableCell>
                        <Badge className={getScoreColor(stock.score)}>
                          {stock.score}
                        </Badge>
                      </TableCell>
                      <TableCell>${stock.price.toFixed(2)}</TableCell>
                      <TableCell className={getChangeColor(stock.change)}>
                        <div className="flex items-center gap-1">
                          {getChangeIcon(stock.change)}
                          {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.change_percent.toFixed(2)}%)
                        </div>
                      </TableCell>
                      <TableCell>{stock.volume.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{stock.sector}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${stock.momentum_score}%` }}
                            />
                          </div>
                          <span className="text-sm">{stock.momentum_score}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${stock.volume_score}%` }}
                            />
                          </div>
                          <span className="text-sm">{stock.volume_score}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full" 
                              style={{ width: `${stock.technical_score}%` }}
                            />
                          </div>
                          <span className="text-sm">{stock.technical_score}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-orange-600 h-2 rounded-full" 
                              style={{ width: `${stock.news_score}%` }}
                            />
                          </div>
                          <span className="text-sm">{stock.news_score}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-indigo-600 h-2 rounded-full" 
                              style={{ width: `${stock.analyst_score}%` }}
                            />
                          </div>
                          <span className="text-sm">{stock.analyst_score}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Scoring Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Score Components</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• <strong>Momentum (25%)</strong> - Price performance and volume trends</li>
                <li>• <strong>Volume (20%)</strong> - Trading volume analysis</li>
                <li>• <strong>Technical (20%)</strong> - Technical indicators and patterns</li>
                <li>• <strong>News (20%)</strong> - News sentiment and impact</li>
                <li>• <strong>Analyst (15%)</strong> - Professional recommendations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Score Ranges</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• <span className="text-green-600 font-semibold">80-100</span> - Excellent</li>
                <li>• <span className="text-yellow-600 font-semibold">60-79</span> - Good</li>
                <li>• <span className="text-red-600 font-semibold">0-59</span> - Poor</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
