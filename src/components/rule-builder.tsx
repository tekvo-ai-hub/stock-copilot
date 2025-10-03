"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Trash2, 
  Save, 
  Play, 
  Settings, 
  Target,
  TrendingUp,
  DollarSign,
  BarChart3,
  Clock,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';

interface RuleCondition {
  id: string;
  field: string;
  operator: string;
  value: number | string;
  type: 'technical' | 'fundamental' | 'market' | 'time';
}

interface RuleConfig {
  id: string;
  name: string;
  description: string;
  priority: number;
  status: 'active' | 'draft' | 'archived';
  conditions: {
    operator: 'AND' | 'OR';
    conditions: RuleCondition[];
  };
  scoring_config: {
    base_score: number;
    condition_weights: Record<string, number>;
  };
  actions: {
    primary_action: string;
    secondary_actions: string[];
    notifications: string[];
  };
  tags: string[];
  created_at: string;
  updated_at: string;
  last_executed_at?: string;
  execution_count: number;
  success_count: number;
  is_public: boolean;
}

const FIELD_OPTIONS = {
  technical: [
    { value: 'rsi', label: 'RSI', icon: BarChart3 },
    { value: 'macd', label: 'MACD', icon: TrendingUp },
    { value: 'sma_20', label: 'SMA (20)', icon: BarChart3 },
    { value: 'ema_50', label: 'EMA (50)', icon: BarChart3 },
    { value: 'bollinger_upper', label: 'Bollinger Upper', icon: BarChart3 },
    { value: 'volume_ratio', label: 'Volume Ratio', icon: BarChart3 },
    { value: 'price_change_1d', label: 'Price Change (1D)', icon: TrendingUp },
    { value: 'price_vs_sma20', label: 'Price vs SMA(20)', icon: BarChart3 }
  ],
  fundamental: [
    { value: 'pe_ratio', label: 'P/E Ratio', icon: DollarSign },
    { value: 'pb_ratio', label: 'P/B Ratio', icon: DollarSign },
    { value: 'ps_ratio', label: 'P/S Ratio', icon: DollarSign },
    { value: 'peg_ratio', label: 'PEG Ratio', icon: DollarSign },
    { value: 'debt_to_equity', label: 'Debt-to-Equity', icon: DollarSign },
    { value: 'roe', label: 'ROE', icon: Target },
    { value: 'roa', label: 'ROA', icon: Target },
    { value: 'revenue_growth', label: 'Revenue Growth', icon: TrendingUp },
    { value: 'eps_growth', label: 'EPS Growth', icon: TrendingUp },
    { value: 'dividend_yield', label: 'Dividend Yield', icon: DollarSign }
  ],
  market: [
    { value: 'market_cap', label: 'Market Cap', icon: DollarSign },
    { value: 'sector', label: 'Sector', icon: BarChart3 },
    { value: 'industry', label: 'Industry', icon: BarChart3 },
    { value: 'exchange', label: 'Exchange', icon: BarChart3 },
    { value: 'country', label: 'Country', icon: BarChart3 }
  ],
  time: [
    { value: 'earnings_date', label: 'Earnings Date', icon: Clock },
    { value: 'dividend_date', label: 'Dividend Date', icon: Clock },
    { value: 'ex_dividend_date', label: 'Ex-Dividend Date', icon: Clock }
  ]
};

const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'greater_than_or_equal', label: 'Greater Than or Equal' },
  { value: 'less_than_or_equal', label: 'Less Than or Equal' },
  { value: 'between', label: 'Between' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Not Contains' }
];

const ACTION_OPTIONS = [
  { value: 'recommend', label: 'Recommend', icon: CheckCircle },
  { value: 'alert', label: 'Alert', icon: AlertCircle },
  { value: 'add_to_watchlist', label: 'Add to Watchlist', icon: Plus },
  { value: 'add_to_portfolio', label: 'Add to Portfolio', icon: Plus },
  { value: 'sell_signal', label: 'Sell Signal', icon: X }
];

const NOTIFICATION_OPTIONS = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'email', label: 'Email' },
  { value: 'push', label: 'Push Notification' },
  { value: 'sms', label: 'SMS' }
];

export function RuleBuilder({ 
  initialRule, 
  onSave, 
  onTest, 
  onCancel 
}: {
  initialRule?: RuleConfig;
  onSave: (rule: RuleConfig) => void;
  onTest: (rule: RuleConfig) => void;
  onCancel: () => void;
}) {
  const [rule, setRule] = useState<RuleConfig>(initialRule || {
    id: Date.now().toString(),
    name: '',
    description: '',
    priority: 1,
    status: 'draft',
    conditions: {
      operator: 'AND',
      conditions: []
    },
    scoring_config: {
      base_score: 100,
      condition_weights: {}
    },
    actions: {
      primary_action: 'recommend',
      secondary_actions: [],
      notifications: ['dashboard']
    },
    tags: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    execution_count: 0,
    success_count: 0,
    is_public: false
  });

  const [newTag, setNewTag] = useState('');
  const [activeTab, setActiveTab] = useState('conditions');

  const addCondition = (type: 'technical' | 'fundamental' | 'market' | 'time') => {
    const newCondition: RuleCondition = {
      id: Date.now().toString(),
      field: '',
      operator: 'greater_than',
      value: 0,
      type
    };

    setRule(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        conditions: [...prev.conditions.conditions, newCondition]
      }
    }));
  };

  const updateCondition = (id: string, updates: Partial<RuleCondition>) => {
    setRule(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        conditions: prev.conditions.conditions.map(condition =>
          condition.id === id ? { ...condition, ...updates } : condition
        )
      }
    }));
  };

  const removeCondition = (id: string) => {
    setRule(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        conditions: prev.conditions.conditions.filter(condition => condition.id !== id)
      }
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !rule.tags.includes(newTag.trim())) {
      setRule(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setRule(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const getFieldOptions = (type: string) => {
    return FIELD_OPTIONS[type as keyof typeof FIELD_OPTIONS] || [];
  };

  const getFieldIcon = (field: string) => {
    const allFields = Object.values(FIELD_OPTIONS).flat();
    const fieldOption = allFields.find(f => f.value === field);
    return fieldOption?.icon || BarChart3;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Rule Builder</h1>
          <p className="text-muted-foreground">
            Create custom rules for stock recommendations and alerts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => onTest(rule)}>
            <Play className="w-4 h-4 mr-2" />
            Test Rule
          </Button>
          <Button onClick={() => onSave(rule)}>
            <Save className="w-4 h-4 mr-2" />
            Save Rule
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="conditions">Conditions</TabsTrigger>
          <TabsTrigger value="scoring">Scoring</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rule Information</CardTitle>
              <CardDescription>
                Define the basic information for your rule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Rule Name</Label>
                  <Input
                    id="name"
                    value={rule.name}
                    onChange={(e) => setRule(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., High Growth Tech Stocks"
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={rule.priority.toString()}
                    onValueChange={(value) => setRule(prev => ({ ...prev, priority: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">High</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="3">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={rule.description}
                  onChange={(e) => setRule(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this rule does..."
                />
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button onClick={addTag} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {rule.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conditions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rule Conditions</CardTitle>
              <CardDescription>
                Define the conditions that stocks must meet to trigger this rule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Label>Logic Operator:</Label>
                <Select
                  value={rule.conditions.operator}
                  onValueChange={(value: 'AND' | 'OR') => 
                    setRule(prev => ({
                      ...prev,
                      conditions: { ...prev.conditions, operator: value }
                    }))
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">AND</SelectItem>
                    <SelectItem value="OR">OR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {rule.conditions.conditions.map((condition, index) => (
                  <Card key={condition.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-medium">
                        {index === 0 ? 'IF' : rule.conditions.operator}
                      </div>
                      
                      <div className="flex-1 grid grid-cols-4 gap-2">
                        <Select
                          value={condition.type}
                          onValueChange={(value) => updateCondition(condition.id, { type: value as 'technical' | 'fundamental' | 'market' | 'time' })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technical">Technical</SelectItem>
                            <SelectItem value="fundamental">Fundamental</SelectItem>
                            <SelectItem value="market">Market</SelectItem>
                            <SelectItem value="time">Time</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select
                          value={condition.field}
                          onValueChange={(value) => updateCondition(condition.id, { field: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            {getFieldOptions(condition.type).map((field) => {
                              const Icon = field.icon;
                              return (
                                <SelectItem key={field.value} value={field.value}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="w-4 h-4" />
                                    {field.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>

                        <Select
                          value={condition.operator}
                          onValueChange={(value) => updateCondition(condition.id, { operator: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {OPERATOR_OPTIONS.map((op) => (
                              <SelectItem key={op.value} value={op.value}>
                                {op.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Input
                          value={condition.value}
                          onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                          placeholder="Value"
                          type={typeof condition.value === 'number' ? 'number' : 'text'}
                        />
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeCondition(condition.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => addCondition('technical')}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Add Technical Condition
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addCondition('fundamental')}
                  className="flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Add Fundamental Condition
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addCondition('market')}
                  className="flex items-center gap-2"
                >
                  <Target className="w-4 h-4" />
                  Add Market Condition
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addCondition('time')}
                  className="flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Add Time Condition
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scoring Configuration</CardTitle>
              <CardDescription>
                Define how stocks are scored when they match this rule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="base_score">Base Score</Label>
                <Input
                  id="base_score"
                  type="number"
                  value={rule.scoring_config.base_score}
                  onChange={(e) => setRule(prev => ({
                    ...prev,
                    scoring_config: {
                      ...prev.scoring_config,
                      base_score: parseInt(e.target.value) || 100
                    }
                  }))}
                />
              </div>

              <div>
                <Label>Condition Weights</Label>
                <div className="space-y-2 mt-2">
                  {rule.conditions.conditions.map((condition) => (
                    <div key={condition.id} className="flex items-center gap-4">
                      <div className="flex items-center gap-2 flex-1">
                        {(() => {
                          const Icon = getFieldIcon(condition.field);
                          return <Icon className="w-4 h-4" />;
                        })()}
                        <span className="text-sm">
                          {getFieldOptions(condition.type).find(f => f.value === condition.field)?.label || condition.field}
                        </span>
                      </div>
                      <div className="w-32">
                        <Input
                          type="number"
                          value={rule.scoring_config.condition_weights[condition.field] || 0}
                          onChange={(e) => setRule(prev => ({
                            ...prev,
                            scoring_config: {
                              ...prev.scoring_config,
                              condition_weights: {
                                ...prev.scoring_config.condition_weights,
                                [condition.field]: parseInt(e.target.value) || 0
                              }
                            }
                          }))}
                          placeholder="Weight"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions & Notifications</CardTitle>
              <CardDescription>
                Define what happens when a stock matches this rule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Primary Action</Label>
                <Select
                  value={rule.actions.primary_action}
                  onValueChange={(value) => setRule(prev => ({
                    ...prev,
                    actions: { ...prev.actions, primary_action: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_OPTIONS.map((action) => {
                      const Icon = action.icon;
                      return (
                        <SelectItem key={action.value} value={action.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {action.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Secondary Actions</Label>
                <div className="space-y-2 mt-2">
                  {ACTION_OPTIONS.map((action) => {
                    const Icon = action.icon;
                    const isSelected = rule.actions.secondary_actions.includes(action.value);
                    return (
                      <div
                        key={action.value}
                        className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${
                          isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                        }`}
                        onClick={() => {
                          const newSecondaryActions = isSelected
                            ? rule.actions.secondary_actions.filter(a => a !== action.value)
                            : [...rule.actions.secondary_actions, action.value];
                          setRule(prev => ({
                            ...prev,
                            actions: { ...prev.actions, secondary_actions: newSecondaryActions }
                          }));
                        }}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{action.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label>Notifications</Label>
                <div className="space-y-2 mt-2">
                  {NOTIFICATION_OPTIONS.map((notification) => {
                    const isSelected = rule.actions.notifications.includes(notification.value);
                    return (
                      <div
                        key={notification.value}
                        className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${
                          isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                        }`}
                        onClick={() => {
                          const newNotifications = isSelected
                            ? rule.actions.notifications.filter(n => n !== notification.value)
                            : [...rule.actions.notifications, notification.value];
                          setRule(prev => ({
                            ...prev,
                            actions: { ...prev.actions, notifications: newNotifications }
                          }));
                        }}
                      >
                        <span className="text-sm">{notification.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
