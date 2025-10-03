"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Star,
  Plus,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";

// Mock data for demonstration
const stocks = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 175.43,
    change: 2.34,
    changePercent: 1.35,
    volume: "45.2M",
    marketCap: "2.8T",
    sector: "Technology",
    trend: "up" as const,
    isWatched: false,
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    price: 378.85,
    change: -1.23,
    changePercent: -0.32,
    volume: "28.7M",
    marketCap: "2.8T",
    sector: "Technology",
    trend: "down" as const,
    isWatched: true,
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    price: 142.56,
    change: 3.21,
    changePercent: 2.31,
    volume: "32.1M",
    marketCap: "1.8T",
    sector: "Technology",
    trend: "up" as const,
    isWatched: false,
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    price: 155.78,
    change: 0.89,
    changePercent: 0.57,
    volume: "38.9M",
    marketCap: "1.6T",
    sector: "Consumer Discretionary",
    trend: "up" as const,
    isWatched: true,
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    price: 248.12,
    change: -5.67,
    changePercent: -2.23,
    volume: "52.1M",
    marketCap: "789B",
    sector: "Automotive",
    trend: "down" as const,
    isWatched: false,
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    price: 875.28,
    change: 12.45,
    changePercent: 1.44,
    volume: "41.3M",
    marketCap: "2.1T",
    sector: "Technology",
    trend: "up" as const,
    isWatched: true,
  },
  {
    symbol: "META",
    name: "Meta Platforms Inc.",
    price: 312.45,
    change: 4.23,
    changePercent: 1.37,
    volume: "18.7M",
    marketCap: "789B",
    sector: "Technology",
    trend: "up" as const,
    isWatched: false,
  },
  {
    symbol: "JPM",
    name: "JPMorgan Chase & Co.",
    price: 156.78,
    change: -2.34,
    changePercent: -1.47,
    volume: "12.4M",
    marketCap: "456B",
    sector: "Financial Services",
    trend: "down" as const,
    isWatched: false,
  },
];

const sectors = ["All", "Technology", "Healthcare", "Financial Services", "Consumer Discretionary", "Automotive", "Energy"];

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  marketCap: string;
  sector: string;
  trend: "up" | "down";
  isWatched: boolean;
}

export function StockSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("All");
  const [sortBy, setSortBy] = useState<"symbol" | "price" | "change" | "marketCap">("symbol");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search stocks using Finnhub API
  const searchStocks = async (query: string) => {
    if (!query.trim()) {
      setStocks([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}&limit=20`);
      if (!response.ok) {
        throw new Error('Failed to search stocks');
      }
      
      const responseData = await response.json();
      
      if (!responseData.success) {
        throw new Error(responseData.error || 'Failed to search stocks');
      }
      
      // Transform backend data to our format
      const transformedStocks: StockData[] = responseData.data.results.map((stock: unknown) => ({
        symbol: (stock as { symbol: string }).symbol,
        name: (stock as { name?: string; description?: string }).name || (stock as { name?: string; description?: string }).description || (stock as { symbol: string }).symbol,
        price: (stock as { price?: number }).price || 0,
        change: (stock as { change?: number }).change || 0,
        changePercent: (stock as { changePercent?: number }).changePercent || 0,
        volume: (stock as { volume?: number }).volume ? `${((stock as { volume?: number }).volume! / 1000000).toFixed(1)}M` : 'N/A',
        marketCap: (stock as { marketCap?: number }).marketCap ? `${((stock as { marketCap?: number }).marketCap! / 1000000000).toFixed(1)}B` : 'N/A',
        sector: (stock as { sector?: string }).sector || 'Unknown',
        trend: ((stock as { change?: number }).change || 0) >= 0 ? 'up' as const : 'down' as const,
        isWatched: false,
      }));

      setStocks(transformedStocks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data or search when query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchStocks(searchQuery);
      } else {
        setStocks([]);
      }
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const filteredStocks = useMemo(() => {
    const filtered = stocks.filter(stock => {
      const matchesSearch = stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           stock.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSector = selectedSector === "All" || stock.sector === selectedSector;
      return matchesSearch && matchesSector;
    });

    // Sort stocks
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case "symbol":
          aValue = a.symbol;
          bValue = b.symbol;
          break;
        case "price":
          aValue = a.price;
          bValue = b.price;
          break;
        case "change":
          aValue = a.changePercent;
          bValue = b.changePercent;
          break;
        case "marketCap":
          aValue = parseFloat(a.marketCap.replace(/[TBM]/g, (match) => {
            switch (match) {
              case 'T': return '000';
              case 'B': return '000000';
              case 'M': return '000000000';
              default: return '';
            }
          }));
          bValue = parseFloat(b.marketCap.replace(/[TBM]/g, (match) => {
            switch (match) {
              case 'T': return '000';
              case 'B': return '000000';
              case 'M': return '000000000';
              default: return '';
            }
          }));
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [stocks, searchQuery, selectedSector, sortBy, sortOrder]);

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Search</h1>
          <p className="text-muted-foreground">
            Search and analyze stocks from major exchanges
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add to Watchlist
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>
            Find stocks by symbol, name, or sector
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by symbol or company name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {loading && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 animate-spin" />
                )}
              </div>
              {error && (
                <p className="text-sm text-red-500 mt-2">{error}</p>
              )}
            </div>
            <div className="flex gap-2">
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                {sectors.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Search Results</CardTitle>
              <CardDescription>
                {searchQuery ? `${filteredStocks.length} stocks found` : 'Enter a search term to find stocks'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
                className="px-3 py-1 border border-input bg-background rounded-md text-sm"
              >
                <option value="symbol-asc">Symbol A-Z</option>
                <option value="symbol-desc">Symbol Z-A</option>
                <option value="price-desc">Price High-Low</option>
                <option value="price-asc">Price Low-High</option>
                <option value="change-desc">Change High-Low</option>
                <option value="change-asc">Change Low-High</option>
                <option value="marketCap-desc">Market Cap High-Low</option>
                <option value="marketCap-asc">Market Cap Low-High</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!searchQuery ? (
            <div className="text-center py-12">
              <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">Search for Stocks</h3>
              <p className="text-sm text-muted-foreground">
                Enter a stock symbol or company name to get started
              </p>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <Loader2 className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">Searching...</h3>
              <p className="text-sm text-muted-foreground">
                Finding stocks matching &quot;{searchQuery}&quot;
              </p>
            </div>
          ) : filteredStocks.length === 0 ? (
            <div className="text-center py-12">
              <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No stocks found</h3>
              <p className="text-sm text-muted-foreground">
                Try searching for a different symbol or company name
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("symbol")}
                  >
                    Symbol
                  </TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("price")}
                  >
                    Price
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("change")}
                  >
                    Change
                  </TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("marketCap")}
                  >
                    Market Cap
                  </TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStocks.map((stock) => (
                <TableRow key={stock.symbol}>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-8 w-8"
                    >
                      <Star 
                        className={`h-4 w-4 ${stock.isWatched ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
                      />
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{stock.symbol}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{stock.name}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">${stock.price}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {stock.trend === "up" ? (
                        <ArrowUpRight className="h-3 w-3 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-500" />
                      )}
                      <span className={stock.trend === "up" ? "text-green-600" : "text-red-600"}>
                        {stock.change > 0 ? "+" : ""}{stock.change} ({stock.changePercent > 0 ? "+" : ""}{stock.changePercent}%)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{stock.volume}</TableCell>
                  <TableCell>{stock.marketCap}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{stock.sector}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        Predict
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
