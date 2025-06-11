import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Copy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { PlanRecommendationRule, PlanCondition, PlanConditionGroup, FormField, FormStep } from "@shared/schema";

interface PlanRecommendationRulesProps {
  rules: PlanRecommendationRule[];
  onRulesChange: (rules: PlanRecommendationRule[]) => void;
}

const OPERATORS = [
  { value: 'equals', label: 'Igual a' },
  { value: 'not_equals', label: 'Diferente de' },
  { value: 'contains', label: 'Contém' },
  { value: 'not_contains', label: 'Não contém' },
  { value: 'greater_than', label: 'Maior que' },
  { value: 'less_than', label: 'Menor que' },
  { value: 'greater_equal', label: 'Maior ou igual a' },
  { value: 'less_equal', label: 'Menor ou igual a' },
  { value: 'in_list', label: 'Está na lista' },
  { value: 'not_in_list', label: 'Não está na lista' },
  { value: 'is_empty', label: 'Está vazio' },
  { value: 'is_not_empty', label: 'Não está vazio' }
];

export function PlanRecommendationRules({ rules, onRulesChange }: PlanRecommendationRulesProps) {
  const [availableFields, setAvailableFields] = useState<{ id: string; label: string; type: string; options?: string[] }[]>([]);

  // Fetch form steps to get available fields
  const { data: formSteps } = useQuery<FormStep[]>({
    queryKey: ['/api/form-steps'],
  });

  useEffect(() => {
    if (formSteps) {
      const fields: { id: string; label: string; type: string; options?: string[] }[] = [];
      
      formSteps.forEach(step => {
        if (step.fields) {
          step.fields.forEach(field => {
            if (field.type !== 'heading' && field.type !== 'paragraph' && field.type !== 'image') {
              fields.push({
                id: field.id,
                label: `${step.title} - ${field.label}`,
                type: field.type,
                options: field.options
              });
            }
          });
        }
      });
      
      setAvailableFields(fields);
    }
  }, [formSteps]);

  const generateId = () => `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addRule = () => {
    const newRule: PlanRecommendationRule = {
      id: generateId(),
      name: 'Nova Regra',
      description: '',
      isActive: true,
      groups: [],
      groupOperator: 'AND',
      priority: 1
    };
    onRulesChange([...rules, newRule]);
  };

  const updateRule = (ruleId: string, updates: Partial<PlanRecommendationRule>) => {
    const updatedRules = rules.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    );
    onRulesChange(updatedRules);
  };

  const deleteRule = (ruleId: string) => {
    onRulesChange(rules.filter(rule => rule.id !== ruleId));
  };

  const addGroup = (ruleId: string) => {
    const newGroup: PlanConditionGroup = {
      id: generateId(),
      operator: 'AND',
      conditions: []
    };
    
    updateRule(ruleId, {
      groups: [...(rules.find(r => r.id === ruleId)?.groups || []), newGroup]
    });
  };

  const updateGroup = (ruleId: string, groupId: string, updates: Partial<PlanConditionGroup>) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    const updatedGroups = rule.groups.map(group =>
      group.id === groupId ? { ...group, ...updates } : group
    );
    updateRule(ruleId, { groups: updatedGroups });
  };

  const deleteGroup = (ruleId: string, groupId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    const updatedGroups = rule.groups.filter(group => group.id !== groupId);
    updateRule(ruleId, { groups: updatedGroups });
  };

  const addCondition = (ruleId: string, groupId: string) => {
    const newCondition: PlanCondition = {
      id: generateId(),
      fieldId: '',
      fieldLabel: '',
      operator: 'equals',
      value: '',
      valueType: 'text'
    };

    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    const updatedGroups = rule.groups.map(group =>
      group.id === groupId 
        ? { ...group, conditions: [...group.conditions, newCondition] }
        : group
    );
    updateRule(ruleId, { groups: updatedGroups });
  };

  const updateCondition = (ruleId: string, groupId: string, conditionId: string, updates: Partial<PlanCondition>) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    const updatedGroups = rule.groups.map(group =>
      group.id === groupId
        ? {
            ...group,
            conditions: group.conditions.map(condition =>
              condition.id === conditionId ? { ...condition, ...updates } : condition
            )
          }
        : group
    );
    updateRule(ruleId, { groups: updatedGroups });
  };

  const deleteCondition = (ruleId: string, groupId: string, conditionId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    const updatedGroups = rule.groups.map(group =>
      group.id === groupId
        ? { ...group, conditions: group.conditions.filter(c => c.id !== conditionId) }
        : group
    );
    updateRule(ruleId, { groups: updatedGroups });
  };

  const renderConditionValue = (rule: PlanRecommendationRule, group: PlanConditionGroup, condition: PlanCondition) => {
    const field = availableFields.find(f => f.id === condition.fieldId);
    
    if (condition.operator === 'is_empty' || condition.operator === 'is_not_empty') {
      return null; // No value needed for these operators
    }

    if (condition.operator === 'in_list' || condition.operator === 'not_in_list') {
      return (
        <Textarea
          placeholder="Digite os valores separados por vírgula"
          value={Array.isArray(condition.value) ? condition.value.join(', ') : ''}
          onChange={(e) => {
            const values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
            updateCondition(rule.id, group.id, condition.id, { value: values });
          }}
        />
      );
    }

    if (field?.type === 'select' || field?.type === 'radio') {
      return (
        <Select
          value={condition.value as string}
          onValueChange={(value) => updateCondition(rule.id, group.id, condition.id, { value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um valor" />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map(option => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        type={field?.type === 'number' ? 'number' : field?.type === 'date' ? 'date' : 'text'}
        placeholder="Digite o valor"
        value={condition.value as string}
        onChange={(e) => updateCondition(rule.id, group.id, condition.id, { value: e.target.value })}
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Regras de Recomendação</h3>
        <Button onClick={addRule} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nova Regra
        </Button>
      </div>

      {rules.map((rule) => (
        <Card key={rule.id} className="relative">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome da Regra</Label>
                    <Input
                      value={rule.name}
                      onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                      placeholder="Nome da regra"
                    />
                  </div>
                  <div>
                    <Label>Prioridade</Label>
                    <Input
                      type="number"
                      min="1"
                      value={rule.priority}
                      onChange={(e) => updateRule(rule.id, { priority: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={rule.description || ''}
                    onChange={(e) => updateRule(rule.id, { description: e.target.value })}
                    placeholder="Descrição da regra (opcional)"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={(checked) => updateRule(rule.id, { isActive: checked })}
                    />
                    <Label>Ativa</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label>Operador entre grupos:</Label>
                    <Select
                      value={rule.groupOperator}
                      onValueChange={(value: 'AND' | 'OR') => updateRule(rule.id, { groupOperator: value })}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">E</SelectItem>
                        <SelectItem value="OR">OU</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteRule(rule.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Grupos de Condições</h4>
              <Button onClick={() => addGroup(rule.id)} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Novo Grupo
              </Button>
            </div>

            {rule.groups.map((group, groupIndex) => (
              <Card key={group.id} className="bg-slate-50 dark:bg-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Badge className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary hover:bg-secondary/80 text-[#ededed]">Grupo {groupIndex + 1}</Badge>
                      <Select
                        value={group.operator}
                        onValueChange={(value: 'AND' | 'OR') => updateGroup(rule.id, group.id, { operator: value })}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AND">E</SelectItem>
                          <SelectItem value="OR">OU</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button onClick={() => addCondition(rule.id, group.id)} size="sm" variant="outline">
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => deleteGroup(rule.id, group.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {group.conditions.map((condition, conditionIndex) => (
                    <div key={condition.id} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        {conditionIndex === 0 && <Label className="text-xs">Campo</Label>}
                        <Select
                          value={condition.fieldId}
                          onValueChange={(fieldId) => {
                            const field = availableFields.find(f => f.id === fieldId);
                            updateCondition(rule.id, group.id, condition.id, {
                              fieldId,
                              fieldLabel: field?.label || '',
                              valueType: field?.type === 'number' ? 'number' : field?.type === 'date' ? 'date' : 'text'
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o campo" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableFields.map(field => (
                              <SelectItem key={field.id} value={field.id}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-2">
                        {conditionIndex === 0 && <Label className="text-xs">Operador</Label>}
                        <Select
                          value={condition.operator}
                          onValueChange={(operator) => updateCondition(rule.id, group.id, condition.id, { operator: operator as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {OPERATORS.map(op => (
                              <SelectItem key={op.value} value={op.value}>
                                {op.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-5">
                        {conditionIndex === 0 && <Label className="text-xs">Valor</Label>}
                        {renderConditionValue(rule, group, condition)}
                      </div>

                      <div className="col-span-1">
                        <Button
                          onClick={() => deleteCondition(rule.id, group.id, condition.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {group.conditions.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      Nenhuma condição adicionada. Clique em "+" para adicionar uma condição.
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {rule.groups.length === 0 && (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-gray-300 rounded-lg">
                Nenhum grupo de condições criado. Clique em "Novo Grupo" para começar.
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {rules.length === 0 && (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-gray-300 rounded-lg">
          <h4 className="text-lg font-medium mb-2">Nenhuma regra de recomendação</h4>
          <p className="text-sm mb-4">
            Crie regras condicionais para recomendar este plano baseado nas respostas dos clientes no formulário.
          </p>
          <Button onClick={addRule}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeira Regra
          </Button>
        </div>
      )}
    </div>
  );
}