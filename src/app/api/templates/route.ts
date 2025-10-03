import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Mock rule templates data
    const mockTemplates = [
      {
        id: '1',
        name: 'Value Stock Picker',
        description: 'Find undervalued stocks with strong fundamentals',
        category: 'value',
        conditions: {
          operator: 'AND',
          conditions: [
            { field: 'pe_ratio', operator: 'less_than', value: 15, type: 'fundamental' },
            { field: 'pb_ratio', operator: 'less_than', value: 2, type: 'fundamental' },
            { field: 'debt_to_equity', operator: 'less_than', value: 0.5, type: 'fundamental' },
            { field: 'roe', operator: 'greater_than', value: 10, type: 'fundamental' }
          ]
        },
        scoring_config: {
          base_score: 100,
          condition_weights: {
            pe_ratio: 25,
            pb_ratio: 20,
            debt_to_equity: 20,
            roe: 35
          }
        },
        actions: {
          primary_action: 'recommend',
          secondary_actions: ['add_to_watchlist'],
          notifications: ['dashboard', 'email']
        },
        is_system: true,
        usage_count: 45
      },
      {
        id: '2',
        name: 'Momentum Trader',
        description: 'Identify stocks with strong momentum signals',
        category: 'momentum',
        conditions: {
          operator: 'AND',
          conditions: [
            { field: 'rsi', operator: 'greater_than', value: 70, type: 'technical' },
            { field: 'price_vs_sma20', operator: 'greater_than', value: 1.05, type: 'technical' },
            { field: 'volume_ratio', operator: 'greater_than', value: 1.5, type: 'technical' },
            { field: 'price_change_1d', operator: 'greater_than', value: 5, type: 'technical' }
          ]
        },
        scoring_config: {
          base_score: 100,
          condition_weights: {
            rsi: 30,
            price_vs_sma20: 25,
            volume_ratio: 25,
            price_change_1d: 20
          }
        },
        actions: {
          primary_action: 'alert',
          secondary_actions: ['recommend'],
          notifications: ['push', 'dashboard']
        },
        is_system: true,
        usage_count: 32
      },
      {
        id: '3',
        name: 'Dividend Investor',
        description: 'Find high-quality dividend-paying stocks',
        category: 'dividend',
        conditions: {
          operator: 'AND',
          conditions: [
            { field: 'dividend_yield', operator: 'greater_than', value: 3, type: 'fundamental' },
            { field: 'payout_ratio', operator: 'less_than', value: 60, type: 'fundamental' },
            { field: 'dividend_growth_5y', operator: 'greater_than', value: 5, type: 'fundamental' },
            { field: 'market_cap', operator: 'greater_than', value: 1000000000, type: 'market' }
          ]
        },
        scoring_config: {
          base_score: 100,
          condition_weights: {
            dividend_yield: 30,
            payout_ratio: 25,
            dividend_growth_5y: 25,
            market_cap: 20
          }
        },
        actions: {
          primary_action: 'add_to_watchlist',
          secondary_actions: ['recommend'],
          notifications: ['email', 'dashboard']
        },
        is_system: true,
        usage_count: 28
      },
      {
        id: '4',
        name: 'Growth Stock Hunter',
        description: 'Target high-growth companies with strong fundamentals',
        category: 'growth',
        conditions: {
          operator: 'AND',
          conditions: [
            { field: 'revenue_growth', operator: 'greater_than', value: 20, type: 'fundamental' },
            { field: 'eps_growth', operator: 'greater_than', value: 15, type: 'fundamental' },
            { field: 'roe', operator: 'greater_than', value: 15, type: 'fundamental' },
            { field: 'sector', operator: 'equals', value: 'Technology', type: 'market' }
          ]
        },
        scoring_config: {
          base_score: 100,
          condition_weights: {
            revenue_growth: 35,
            eps_growth: 30,
            roe: 25,
            sector: 10
          }
        },
        actions: {
          primary_action: 'recommend',
          secondary_actions: ['add_to_watchlist', 'add_to_portfolio'],
          notifications: ['dashboard', 'email', 'push']
        },
        is_system: true,
        usage_count: 19
      },
      {
        id: '5',
        name: 'Earnings Surprise',
        description: 'Catch stocks with positive earnings surprises',
        category: 'earnings',
        conditions: {
          operator: 'AND',
          conditions: [
            { field: 'earnings_surprise', operator: 'greater_than', value: 5, type: 'fundamental' },
            { field: 'earnings_date', operator: 'equals', value: 'recent', type: 'time' },
            { field: 'volume_ratio', operator: 'greater_than', value: 1.2, type: 'technical' },
            { field: 'price_change_1d', operator: 'greater_than', value: 2, type: 'technical' }
          ]
        },
        scoring_config: {
          base_score: 100,
          condition_weights: {
            earnings_surprise: 40,
            earnings_date: 20,
            volume_ratio: 20,
            price_change_1d: 20
          }
        },
        actions: {
          primary_action: 'alert',
          secondary_actions: ['recommend'],
          notifications: ['push', 'email']
        },
        is_system: true,
        usage_count: 15
      },
      {
        id: '6',
        name: 'Low Volatility',
        description: 'Find stable stocks with low volatility',
        category: 'stability',
        conditions: {
          operator: 'AND',
          conditions: [
            { field: 'volatility_30d', operator: 'less_than', value: 20, type: 'technical' },
            { field: 'beta', operator: 'less_than', value: 0.8, type: 'fundamental' },
            { field: 'dividend_yield', operator: 'greater_than', value: 2, type: 'fundamental' },
            { field: 'market_cap', operator: 'greater_than', value: 5000000000, type: 'market' }
          ]
        },
        scoring_config: {
          base_score: 100,
          condition_weights: {
            volatility_30d: 30,
            beta: 25,
            dividend_yield: 25,
            market_cap: 20
          }
        },
        actions: {
          primary_action: 'add_to_watchlist',
          secondary_actions: ['recommend'],
          notifications: ['dashboard']
        },
        is_system: true,
        usage_count: 12
      }
    ];

    let filteredTemplates = mockTemplates;

    if (category && category !== 'all') {
      filteredTemplates = filteredTemplates.filter(template => template.category === category);
    }

    return NextResponse.json({
      success: true,
      data: filteredTemplates
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
