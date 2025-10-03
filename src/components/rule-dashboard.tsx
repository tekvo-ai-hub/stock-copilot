"use client";

import { useState, useEffect } from 'react';
import { RuleBuilder } from '@/components/rule-builder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Filter, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Copy,
  BarChart3,
  Target,
  TrendingUp,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  MoreHorizontal
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

interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  conditions: {
    operator: 'AND' | 'OR';
    conditions: unknown[];
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
  is_system: boolean;
  usage_count: number;
}

export function RuleDashboard() {
  const [rules, setRules] = useState<RuleConfig[]>([]);
  const [templates, setTemplates] = useState<RuleTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('rules');
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState<RuleConfig | null>(null);

  useEffect(() => {
    fetchRules();
    fetchTemplates();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rules');
      const data = await response.json();
      if (data.success) {
        setRules(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const handleCreateRule = () => {
    setEditingRule(null);
    setShowRuleBuilder(true);
  };

  const handleEditRule = (rule: RuleConfig) => {
    setEditingRule(rule);
    setShowRuleBuilder(true);
  };

  const handleSaveRule = async (rule: RuleConfig) => {
    try {
      const url = rule.id ? `/api/rules/${rule.id}` : '/api/rules';
      const method = rule.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule)
      });

      if (response.ok) {
        await fetchRules();
        setShowRuleBuilder(false);
        setEditingRule(null);
      }
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      try {
        const response = await fetch(`/api/rules/${ruleId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          await fetchRules();
        }
      } catch (error) {
        console.error('Failed to delete rule:', error);
      }
    }
  };

  const handleExecuteRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/rules/${ruleId}/execute`, {
        method: 'POST'
      });

      if (response.ok) {
        await fetchRules();
      }
    } catch (error) {
      console.error('Failed to execute rule:', error);
    }
  };

  const handleUseTemplate = async (template: RuleTemplate) => {
    const newRule: RuleConfig = {
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      description: template.description,
      priority: 1,
      status: 'draft',
      conditions: template.conditions as {
        operator: 'AND' | 'OR';
        conditions: RuleCondition[];
      },
      scoring_config: template.scoring_config,
      actions: template.actions,
      tags: [template.category],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      execution_count: 0,
      success_count: 0,
      is_public: false
    };

    setEditingRule(newRule);
    setShowRuleBuilder(true);
  };

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rule.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rule.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || rule.priority.toString() === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-red-100 text-red-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return 'High';
      case 2: return 'Medium';
      case 3: return 'Low';
      default: return 'Unknown';
    }
  };

  if (showRuleBuilder) {
    return (
      <div className="h-screen overflow-auto">
        <RuleBuilder
          initialRule={editingRule || undefined}
          onSave={handleSaveRule}
          onTest={() => {}}
          onCancel={() => {
            setShowRuleBuilder(false);
            setEditingRule(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Rule Management</h1>
          <p className="text-muted-foreground">
            Create and manage custom rules for stock recommendations
          </p>
        </div>
        <Button onClick={handleCreateRule}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Rule
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">My Rules</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search rules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="1">High</SelectItem>
                <SelectItem value="2">Medium</SelectItem>
                <SelectItem value="3">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading rules...</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredRules.map((rule) => (
                <Card key={rule.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{rule.name}</CardTitle>
                          <Badge className={getPriorityColor(rule.priority)}>
                            {getPriorityLabel(rule.priority)}
                          </Badge>
                          <Badge className={getStatusColor(rule.status)}>
                            {rule.status}
                          </Badge>
                          {rule.is_public && (
                            <Badge variant="outline">Public</Badge>
                          )}
                        </div>
                        <CardDescription>{rule.description}</CardDescription>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Executions: {rule.execution_count}</span>
                          <span>Success Rate: {rule.execution_count > 0 ? Math.round((rule.success_count / rule.execution_count) * 100) : 0}%</span>
                          <span>Last Run: {rule.last_executed_at ? new Date(rule.last_executed_at).toLocaleDateString() : 'Never'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExecuteRule(rule.id)}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRule(rule)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {rule.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">Conditions:</div>
                      <div className="text-sm text-muted-foreground">
                        {rule.conditions.conditions.length} condition(s) with {rule.conditions.operator} logic
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge variant="outline">{template.category}</Badge>
                        {template.is_system && (
                          <Badge variant="secondary">System</Badge>
                        )}
                      </div>
                      <CardDescription>{template.description}</CardDescription>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Used: {template.usage_count} times</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Use Template
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rules.length}</div>
                <p className="text-xs text-muted-foreground">
                  {rules.filter(r => r.status === 'active').length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
                <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {rules.reduce((sum, rule) => sum + rule.execution_count, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all rules
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
                  {(() => {
                    const totalExecutions = rules.reduce((sum, rule) => sum + rule.execution_count, 0);
                    const totalSuccesses = rules.reduce((sum, rule) => sum + rule.success_count, 0);
                    return totalExecutions > 0 ? Math.round((totalSuccesses / totalExecutions) * 100) : 0;
                  })()}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Average across all rules
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
