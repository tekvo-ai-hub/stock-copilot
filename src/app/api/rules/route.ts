import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || 'default-user';
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    // For now, return mock data since we don't have Supabase set up yet
    const mockRules = [
      {
        id: '1',
        name: 'High Growth Tech Stocks',
        description: 'Find technology stocks with strong growth potential',
        priority: 1,
        status: 'active',
        conditions: {
          operator: 'AND',
          conditions: [
            { field: 'sector', operator: 'equals', value: 'Technology', type: 'market' },
            { field: 'revenue_growth', operator: 'greater_than', value: 15, type: 'fundamental' },
            { field: 'pe_ratio', operator: 'less_than', value: 30, type: 'fundamental' }
          ]
        },
        scoring_config: {
          base_score: 100,
          condition_weights: {
            sector: 20,
            revenue_growth: 40,
            pe_ratio: 40
          }
        },
        actions: {
          primary_action: 'recommend',
          secondary_actions: ['add_to_watchlist'],
          notifications: ['dashboard', 'email']
        },
        tags: ['growth', 'technology'],
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        last_executed_at: '2024-01-20T14:30:00Z',
        execution_count: 15,
        success_count: 12,
        is_public: false
      },
      {
        id: '2',
        name: 'Value Dividend Stocks',
        description: 'Identify undervalued stocks with consistent dividends',
        priority: 2,
        status: 'active',
        conditions: {
          operator: 'AND',
          conditions: [
            { field: 'pe_ratio', operator: 'less_than', value: 15, type: 'fundamental' },
            { field: 'dividend_yield', operator: 'greater_than', value: 3, type: 'fundamental' },
            { field: 'payout_ratio', operator: 'less_than', value: 60, type: 'fundamental' }
          ]
        },
        scoring_config: {
          base_score: 100,
          condition_weights: {
            pe_ratio: 30,
            dividend_yield: 40,
            payout_ratio: 30
          }
        },
        actions: {
          primary_action: 'add_to_watchlist',
          secondary_actions: ['recommend'],
          notifications: ['email']
        },
        tags: ['value', 'dividend'],
        created_at: '2024-01-10T09:00:00Z',
        updated_at: '2024-01-10T09:00:00Z',
        last_executed_at: '2024-01-19T16:45:00Z',
        execution_count: 8,
        success_count: 6,
        is_public: true
      },
      {
        id: '3',
        name: 'Momentum Breakout',
        description: 'Detect stocks breaking out with strong momentum',
        priority: 1,
        status: 'draft',
        conditions: {
          operator: 'AND',
          conditions: [
            { field: 'rsi', operator: 'greater_than', value: 70, type: 'technical' },
            { field: 'price_vs_sma20', operator: 'greater_than', value: 1.05, type: 'technical' },
            { field: 'volume_ratio', operator: 'greater_than', value: 1.5, type: 'technical' }
          ]
        },
        scoring_config: {
          base_score: 100,
          condition_weights: {
            rsi: 30,
            price_vs_sma20: 35,
            volume_ratio: 35
          }
        },
        actions: {
          primary_action: 'alert',
          secondary_actions: ['recommend'],
          notifications: ['push', 'dashboard']
        },
        tags: ['momentum', 'technical'],
        created_at: '2024-01-18T11:30:00Z',
        updated_at: '2024-01-18T11:30:00Z',
        execution_count: 0,
        success_count: 0,
        is_public: false
      }
    ];

    let filteredRules = mockRules;

    if (status && status !== 'all') {
      filteredRules = filteredRules.filter(rule => rule.status === status);
    }

    if (priority && priority !== 'all') {
      filteredRules = filteredRules.filter(rule => rule.priority.toString() === priority);
    }

    return NextResponse.json({
      success: true,
      data: filteredRules
    });
  } catch (error) {
    console.error('Error fetching rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ruleData = await request.json();

    // Validate required fields
    if (!ruleData.name || !ruleData.conditions) {
      return NextResponse.json(
        { error: 'Missing required fields: name, conditions' },
        { status: 400 }
      );
    }

    // Create new rule with generated ID
    const newRule = {
      id: Date.now().toString(),
      ...ruleData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      execution_count: 0,
      success_count: 0
    };

    // In a real implementation, this would save to Supabase
    console.log('Creating new rule:', newRule);

    return NextResponse.json({
      success: true,
      data: newRule
    });
  } catch (error) {
    console.error('Error creating rule:', error);
    return NextResponse.json(
      { error: 'Failed to create rule' },
      { status: 500 }
    );
  }
}
