import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Trash2, 
  Edit,
  ArrowRight,
  GitBranch,
  Flag
} from "lucide-react";
import type { StepNavigation, FormField } from "@shared/schema";

interface ConditionalNavigationProps {
  stepNumber: number;
  fields: FormField[];
  navigationRules: StepNavigation[];
  onNavigationRulesChange: (rules: StepNavigation[]) => void;
  availableSteps: number[];
}

export default function ConditionalNavigation({
  stepNumber,
  fields,
  navigationRules,
  onNavigationRulesChange,
  availableSteps
}: ConditionalNavigationProps) {
  const [editingRule, setEditingRule] = useState<StepNavigation | null>(null);
  const [isAddingRule, setIsAddingRule] = useState(false);

  const generateId = () => `nav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const getFieldOptions = () => {
    return fields.filter(field => 
      field.type === 'radio' || 
      field.type === 'checkbox' || 
      field.type === 'select' ||
      field.type === 'text' ||
      field.type === 'email' ||
      field.type === 'tel' ||
      field.type === 'number' ||
      field.type === 'date'
    );
  };

  const getOperatorOptions = (fieldType?: string) => {
    const baseOperators = [
      { value: 'equals', label: 'É igual a' },
      { value: 'not_equals', label: 'É diferente de' },
      { value: 'contains', label: 'Contém' }
    ];

    if (fieldType === 'radio' || fieldType === 'checkbox') {
      return [
        { value: 'selected', label: 'Está selecionado' },
        { value: 'not_selected', label: 'Não está selecionado' },
        ...baseOperators
      ];
    }

    return [
      ...baseOperators,
      { value: 'greater_than', label: 'É maior que' },
      { value: 'less_than', label: 'É menor que' }
    ];
  };

  const handleAddRule = () => {
    const newRule: StepNavigation = {
      id: generateId(),
      stepId: stepNumber,
      condition: {
        field: '',
        operator: 'equals',
        value: ''
      },
      target: {
        type: 'step',
        stepNumber: undefined
      },
      priority: navigationRules.length + 1
    };
    setEditingRule(newRule);
    setIsAddingRule(true);
  };

  const handleSaveRule = (rule: StepNavigation) => {
    if (isAddingRule) {
      onNavigationRulesChange([...navigationRules, rule]);
      setIsAddingRule(false);
    } else {
      onNavigationRulesChange(
        navigationRules.map(r => r.id === rule.id ? rule : r)
      );
    }
    setEditingRule(null);
  };

  const handleDeleteRule = (ruleId: string) => {
    onNavigationRulesChange(navigationRules.filter(r => r.id !== ruleId));
  };

  const handleCancelEdit = () => {
    setEditingRule(null);
    setIsAddingRule(false);
  };

  const getFieldByName = (fieldName: string) => {
    return fields.find(f => f.label === fieldName);
  };

  const renderRuleCard = (rule: StepNavigation) => {
    const field = getFieldByName(rule.condition.field);
    
    return (
      <Card key={rule.id} className="border-l-4 border-l-gups-teal">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <GitBranch className="w-4 h-4 text-gups-teal" />
              <Badge variant="outline" className="text-xs">
                Prioridade {rule.priority}
              </Badge>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingRule(rule)}
                className="p-1 h-6 w-6"
              >
                <Edit className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteRule(rule.id)}
                className="p-1 h-6 w-6 text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <div className="text-sm space-y-2">
            <div className="flex items-center space-x-2 text-gray-700">
              <span className="font-medium">Se</span>
              <Badge className="bg-[#2b428f] text-white hover:bg-[#2b428f]/90">{rule.condition.field}</Badge>
              <span>{getOperatorLabel(rule.condition.operator)}</span>
              <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                {Array.isArray(rule.condition.value) 
                  ? rule.condition.value.join(', ') 
                  : rule.condition.value}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2 text-gray-700">
              <ArrowRight className="w-4 h-4 text-gups-teal" />
              <span className="font-medium">Então</span>
              {rule.target.type === 'step' && (
                <>
                  <span>ir para o passo</span>
                  <Badge className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent hover:bg-secondary/80 text-[#dbdbdb] bg-[#2b428f]">
                    {rule.target.stepNumber}
                  </Badge>
                </>
              )}
              {rule.target.type === 'end' && (
                <>
                  <Flag className="w-4 h-4 text-red-500" />
                  <span>finalizar formulário</span>
                </>
              )}
              {rule.target.type === 'external_url' && (
                <>
                  <span>redirecionar para</span>
                  <Badge className="bg-gray-100 text-gray-800 border-gray-300">{rule.target.url}</Badge>
                </>
              )}
            </div>
            
            {rule.target.message && (
              <div className="text-xs text-gray-500 italic">
                Mensagem: "{rule.target.message}"
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const getOperatorLabel = (operator: string) => {
    const operators = getOperatorOptions();
    return operators.find(op => op.value === operator)?.label || operator;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Navegação Condicional - Passo {stepNumber}</CardTitle>
            <Button 
              onClick={handleAddRule}
              size="sm"
              className="bg-gups-teal hover:bg-gups-teal/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Condição
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {navigationRules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <GitBranch className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Nenhuma regra de navegação configurada</p>
              <p className="text-sm mt-2">
                Adicione condições para controlar o fluxo do formulário
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {navigationRules
                .sort((a, b) => b.priority - a.priority)
                .map(renderRuleCard)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rule Editor Modal/Panel */}
      {editingRule && (
        <RuleEditor
          rule={editingRule}
          fields={getFieldOptions()}
          availableSteps={availableSteps}
          onSave={handleSaveRule}
          onCancel={handleCancelEdit}
        />
      )}
    </div>
  );
}

// Rule Editor Component
interface RuleEditorProps {
  rule: StepNavigation;
  fields: FormField[];
  availableSteps: number[];
  onSave: (rule: StepNavigation) => void;
  onCancel: () => void;
}

function RuleEditor({ rule, fields, availableSteps, onSave, onCancel }: RuleEditorProps) {
  const [localRule, setLocalRule] = useState({ ...rule });

  const selectedField = fields.find(f => f.label === localRule.condition.field);

  const handleConditionChange = (key: string, value: any) => {
    setLocalRule({
      ...localRule,
      condition: { ...localRule.condition, [key]: value }
    });
  };

  const handleTargetChange = (key: string, value: any) => {
    setLocalRule({
      ...localRule,
      target: { ...localRule.target, [key]: value }
    });
  };

  const handleSave = () => {
    onSave(localRule);
  };

  const getOperatorOptions = () => {
    const baseOperators = [
      { value: 'equals', label: 'É igual a' },
      { value: 'not_equals', label: 'É diferente de' },
      { value: 'contains', label: 'Contém' }
    ];

    if (selectedField?.type === 'radio' || selectedField?.type === 'checkbox') {
      return [
        { value: 'selected', label: 'Está selecionado' },
        { value: 'not_selected', label: 'Não está selecionado' },
        ...baseOperators
      ];
    }

    return [
      ...baseOperators,
      { value: 'greater_than', label: 'É maior que' },
      { value: 'less_than', label: 'É menor que' }
    ];
  };

  return (
    <Card className="border-2 border-gups-teal">
      <CardHeader>
        <CardTitle className="text-lg">
          {rule.id.includes('nav_') ? 'Nova Regra de Navegação' : 'Editar Regra de Navegação'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Condition Section */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Condição</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="conditionField">Campo</Label>
              <Select
                value={localRule.condition.field}
                onValueChange={(value) => handleConditionChange('field', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um campo" />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((field) => (
                    <SelectItem key={field.id} value={field.label}>
                      {field.label} ({field.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="conditionOperator">Operador</Label>
              <Select
                value={localRule.condition.operator}
                onValueChange={(value) => handleConditionChange('operator', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getOperatorOptions().map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="conditionValue">Valor</Label>
              {selectedField?.options ? (
                <Select
                  value={Array.isArray(localRule.condition.value) 
                    ? localRule.condition.value[0] 
                    : localRule.condition.value.toString()}
                  onValueChange={(value) => handleConditionChange('value', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma opção" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedField.options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={Array.isArray(localRule.condition.value) 
                    ? localRule.condition.value.join(', ') 
                    : localRule.condition.value.toString()}
                  onChange={(e) => handleConditionChange('value', e.target.value)}
                  placeholder="Digite o valor"
                />
              )}
            </div>
          </div>
        </div>

        {/* Target Section */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Destino</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="targetType">Tipo de Destino</Label>
              <Select
                value={localRule.target.type}
                onValueChange={(value) => handleTargetChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="step">Ir para Passo</SelectItem>
                  <SelectItem value="end">Finalizar Formulário</SelectItem>
                  <SelectItem value="external_url">URL Externa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {localRule.target.type === 'step' && (
              <div>
                <Label htmlFor="targetStep">Passo de Destino</Label>
                <Select
                  value={localRule.target.stepNumber?.toString() || ''}
                  onValueChange={(value) => handleTargetChange('stepNumber', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um passo" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSteps.map((stepNum) => (
                      <SelectItem key={stepNum} value={stepNum.toString()}>
                        Passo {stepNum}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {localRule.target.type === 'external_url' && (
              <div>
                <Label htmlFor="targetUrl">URL de Destino</Label>
                <Input
                  value={localRule.target.url || ''}
                  onChange={(e) => handleTargetChange('url', e.target.value)}
                  placeholder="https://exemplo.com"
                />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="targetMessage">Mensagem (Opcional)</Label>
            <Textarea
              value={localRule.target.message || ''}
              onChange={(e) => handleTargetChange('message', e.target.value)}
              placeholder="Mensagem a ser exibida ao usuário"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="priority">Prioridade</Label>
            <Input
              type="number"
              value={localRule.priority}
              onChange={(e) => setLocalRule({ ...localRule, priority: parseInt(e.target.value) || 0 })}
              min="1"
              max="100"
            />
          </div>
        </div>

        <div className="flex space-x-2 pt-4">
          <Button onClick={handleSave} className="bg-gups-teal hover:bg-gups-teal/90">
            Salvar Regra
          </Button>
          <Button onClick={onCancel} variant="outline">
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}