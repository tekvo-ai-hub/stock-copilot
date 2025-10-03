import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RuleCondition {
  field: string;
  operator: string;
  value: number | string;
  type: 'technical' | 'fundamental' | 'market' | 'time';
}

interface RuleConfig {
  id?: string;
  user_id: string;
  name: string;
  description?: string;
  priority: number;
  status: 'active' | 'draft' | 'archived';
  conditions: {
    operator: 'AND' | 'OR';
    conditions: RuleCondition[];
  };
  scoring_config?: {
    base_score: number;
    condition_weights: Record<string, number>;
  };
  actions?: {
    primary_action: string;
    secondary_actions: string[];
    notifications: string[];
  };
  notification_config?: Record<string, any>;
  is_public?: boolean;
  tags?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { method } = req
    const url = new URL(req.url)
    const path = url.pathname

    // Route handling
    if (method === 'GET' && path.includes('/rules')) {
      return await handleGetRules(supabaseClient, url)
    } else if (method === 'POST' && path.includes('/rules')) {
      return await handleCreateRule(supabaseClient, req)
    } else if (method === 'PUT' && path.includes('/rules/')) {
      return await handleUpdateRule(supabaseClient, req, path)
    } else if (method === 'DELETE' && path.includes('/rules/')) {
      return await handleDeleteRule(supabaseClient, path)
    } else if (method === 'GET' && path.includes('/templates')) {
      return await handleGetTemplates(supabaseClient, url)
    } else if (method === 'POST' && path.includes('/execute/')) {
      return await handleExecuteRule(supabaseClient, req, path)
    } else {
      return new Response(
        JSON.stringify({ error: 'Not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleGetRules(supabaseClient: any, url: URL) {
  const userId = url.searchParams.get('user_id') || 'default-user'
  const status = url.searchParams.get('status')
  const priority = url.searchParams.get('priority')
  
  let query = supabaseClient
    .from('rule_config')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }
  if (priority) {
    query = query.eq('priority', parseInt(priority))
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch rules: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ success: true, data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleCreateRule(supabaseClient: any, req: Request) {
  const ruleData: RuleConfig = await req.json()
  
  // Validate required fields
  if (!ruleData.name || !ruleData.conditions) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: name, conditions' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Set default values
  const ruleConfig: RuleConfig = {
    user_id: ruleData.user_id || 'default-user',
    name: ruleData.name,
    description: ruleData.description || '',
    priority: ruleData.priority || 1,
    status: ruleData.status || 'draft',
    conditions: ruleData.conditions,
    scoring_config: ruleData.scoring_config || {
      base_score: 100,
      condition_weights: {}
    },
    actions: ruleData.actions || {
      primary_action: 'recommend',
      secondary_actions: [],
      notifications: ['dashboard']
    },
    notification_config: ruleData.notification_config || {},
    is_public: ruleData.is_public || false,
    tags: ruleData.tags || []
  }

  const { data, error } = await supabaseClient
    .from('rule_config')
    .insert([ruleConfig])
    .select()

  if (error) {
    throw new Error(`Failed to create rule: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ success: true, data: data[0] }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleUpdateRule(supabaseClient: any, req: Request, path: string) {
  const ruleId = path.split('/rules/')[1]
  const ruleData: Partial<RuleConfig> = await req.json()

  const { data, error } = await supabaseClient
    .from('rule_config')
    .update({
      ...ruleData,
      updated_at: new Date().toISOString()
    })
    .eq('id', ruleId)
    .select()

  if (error) {
    throw new Error(`Failed to update rule: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Rule not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ success: true, data: data[0] }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleDeleteRule(supabaseClient: any, path: string) {
  const ruleId = path.split('/rules/')[1]

  const { error } = await supabaseClient
    .from('rule_config')
    .delete()
    .eq('id', ruleId)

  if (error) {
    throw new Error(`Failed to delete rule: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ success: true, message: 'Rule deleted successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleGetTemplates(supabaseClient: any, url: URL) {
  const category = url.searchParams.get('category')
  
  let query = supabaseClient
    .from('rule_templates')
    .select('*')
    .order('usage_count', { ascending: false })

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch templates: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ success: true, data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleExecuteRule(supabaseClient: any, req: Request, path: string) {
  const ruleId = path.split('/execute/')[1]
  
  // Get the rule
  const { data: rule, error: ruleError } = await supabaseClient
    .from('rule_config')
    .select('*')
    .eq('id', ruleId)
    .single()

  if (ruleError || !rule) {
    return new Response(
      JSON.stringify({ error: 'Rule not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // For now, return a mock execution result
  // In a real implementation, this would evaluate the rule against stock data
  const mockResults = {
    rule_id: ruleId,
    executed_at: new Date().toISOString(),
    total_stocks_evaluated: 1000,
    matching_stocks: 25,
    results: [
      {
        symbol: 'AAPL',
        score: 85.5,
        matched_conditions: ['pe_ratio', 'roe', 'debt_to_equity'],
        current_price: 175.50,
        price_change: 2.5
      },
      {
        symbol: 'MSFT',
        score: 82.3,
        matched_conditions: ['pe_ratio', 'roe'],
        current_price: 340.25,
        price_change: 1.8
      }
    ]
  }

  // Update rule execution stats
  await supabaseClient
    .from('rule_config')
    .update({
      last_executed_at: new Date().toISOString(),
      execution_count: rule.execution_count + 1,
      success_count: rule.success_count + 1
    })
    .eq('id', ruleId)

  return new Response(
    JSON.stringify({ success: true, data: mockResults }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
