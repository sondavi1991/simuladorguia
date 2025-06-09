import React, { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Trash2, 
  Edit,
  GripVertical,
  Type,
  List,
  CheckSquare,
  Calendar,
  Phone,
  Mail,
  Image,
  AlignLeft,
  Heading1,
  Heading2
} from "lucide-react";
import ConditionalNavigation from "./conditional-navigation";
import type { FormField, FormStep, StepNavigation } from "@shared/schema";

interface FormBuilderProps {
  step?: FormStep;
  onSave?: (step: Partial<FormStep>) => void;
}

type ComponentType = {
  id: string;
  name: string;
  icon: any;
  type: FormField['type'];
  defaultProps: Partial<FormField>;
};

const COMPONENTS: ComponentType[] = [
  {
    id: 'heading1',
    name: 'Título H1',
    icon: Heading1,
    type: 'heading',
    defaultProps: { label: '', content: 'Título Principal', headingLevel: 'h1' }
  },
  {
    id: 'heading2',
    name: 'Título H2',
    icon: Heading2,
    type: 'heading',
    defaultProps: { label: '', content: 'Subtítulo', headingLevel: 'h2' }
  },
  {
    id: 'paragraph',
    name: 'Parágrafo',
    icon: AlignLeft,
    type: 'paragraph',
    defaultProps: { label: '', content: 'Texto explicativo do formulário' }
  },
  {
    id: 'text',
    name: 'Campo de Texto',
    icon: Type,
    type: 'text',
    defaultProps: { label: 'Nome', required: false, placeholder: 'Digite seu nome' }
  },
  {
    id: 'email',
    name: 'E-mail',
    icon: Mail,
    type: 'email',
    defaultProps: { label: 'E-mail', required: true, placeholder: 'Digite seu e-mail' }
  },
  {
    id: 'tel',
    name: 'Telefone',
    icon: Phone,
    type: 'tel',
    defaultProps: { label: 'Telefone', required: false, placeholder: '(11) 99999-9999' }
  },
  {
    id: 'radio',
    name: 'Escolha Única',
    icon: List,
    type: 'radio',
    defaultProps: { label: 'Selecione uma opção', required: true, options: ['Opção 1', 'Opção 2', 'Opção 3'] }
  },
  {
    id: 'checkbox',
    name: 'Múltipla Escolha',
    icon: CheckSquare,
    type: 'checkbox',
    defaultProps: { label: 'Selecione as opções', required: false, options: ['Item 1', 'Item 2', 'Item 3'] }
  },
  {
    id: 'select',
    name: 'Lista Suspensa',
    icon: List,
    type: 'select',
    defaultProps: { label: 'Selecione', required: true, options: ['Selecione...', 'Opção A', 'Opção B'] }
  },
  {
    id: 'date',
    name: 'Data',
    icon: Calendar,
    type: 'date',
    defaultProps: { label: 'Data de Nascimento', required: false }
  },
  {
    id: 'image',
    name: 'Imagem',
    icon: Image,
    type: 'image',
    defaultProps: { label: '', content: 'Descrição da imagem', imageUrl: '' }
  }
];

export default function FormBuilder({ step, onSave }: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>(step?.fields || []);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [stepTitle, setStepTitle] = useState(step?.title || '');
  const [stepDescription, setStepDescription] = useState(step?.description || '');
  const [stepNumber, setStepNumber] = useState(step?.stepNumber || 1);
  const [navigationRules, setNavigationRules] = useState<StepNavigation[]>(step?.navigationRules || []);
  const [draggedItem, setDraggedItem] = useState<ComponentType | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const saveStepMutation = useMutation({
    mutationFn: async (stepData: Partial<FormStep>) => {
      const url = step?.id ? `/api/form-steps/${step.id}` : "/api/form-steps";
      const method = step?.id ? "PUT" : "POST";
      const response = await apiRequest(method, url, stepData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Passo do formulário salvo com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/form-steps"] });
      if (onSave) onSave({ title: stepTitle, stepNumber, fields, navigationRules });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao salvar o passo do formulário.",
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    const stepData = {
      title: stepTitle,
      description: stepDescription,
      stepNumber,
      fields,
      navigationRules,
    };
    saveStepMutation.mutate(stepData);
  };

  const generateId = () => `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleDragStart = (component: ComponentType) => {
    setDraggedItem(component);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedItem) {
      const newField: FormField = {
        ...draggedItem.defaultProps,
        id: generateId(),
        type: draggedItem.type,
        label: draggedItem.defaultProps.label || draggedItem.name,
        required: draggedItem.defaultProps.required || false
      };
      setFields([...fields, newField]);
      setDraggedItem(null);
    }
  };

  const handleFieldEdit = (field: FormField) => {
    setEditingField(field);
  };

  const handleFieldUpdate = (updatedField: FormField) => {
    setFields(fields.map(f => f.id === updatedField.id ? updatedField : f));
    setEditingField(null);
  };

  const handleFieldDelete = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId));
    if (editingField?.id === fieldId) {
      setEditingField(null);
    }
  };

  const handleFieldMove = (fieldId: string, direction: 'up' | 'down') => {
    const index = fields.findIndex(f => f.id === fieldId);
    if (index === -1) return;

    const newFields = [...fields];
    if (direction === 'up' && index > 0) {
      [newFields[index], newFields[index - 1]] = [newFields[index - 1], newFields[index]];
    } else if (direction === 'down' && index < fields.length - 1) {
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
    }
    setFields(newFields);
  };

  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'heading':
        const HeadingTag = field.headingLevel || 'h2';
        return (
          <div className="space-y-2">
            <HeadingTag className="text-lg font-semibold">{field.content}</HeadingTag>
          </div>
        );
      case 'paragraph':
        return (
          <div className="space-y-2">
            <p className="text-gray-700">{field.content}</p>
          </div>
        );
      case 'image':
        return (
          <div className="space-y-2">
            {field.imageUrl ? (
              <img src={field.imageUrl} alt={field.content} className="max-w-full h-auto rounded" />
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Image className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">{field.content}</p>
              </div>
            )}
          </div>
        );
      case 'radio':
        return (
          <div className="space-y-2">
            <Label>{field.label}{field.required && ' *'}</Label>
            <div className="space-y-2">
              {field.options?.map((option, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <input type="radio" name={field.id} disabled />
                  <span>{option}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 'checkbox':
        return (
          <div className="space-y-2">
            <Label>{field.label}{field.required && ' *'}</Label>
            <div className="space-y-2">
              {field.options?.map((option, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <input type="checkbox" disabled />
                  <span>{option}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 'select':
        return (
          <div className="space-y-2">
            <Label>{field.label}{field.required && ' *'}</Label>
            <select className="w-full p-2 border rounded" disabled>
              {field.options?.map((option, idx) => (
                <option key={idx}>{option}</option>
              ))}
            </select>
          </div>
        );
      case 'date':
        return (
          <div className="space-y-2">
            <Label>{field.label}{field.required && ' *'}</Label>
            <Input type="date" disabled />
          </div>
        );
      default:
        return (
          <div className="space-y-2">
            <Label>{field.label}{field.required && ' *'}</Label>
            <Input placeholder={field.placeholder || 'Campo de exemplo'} disabled />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração do Passo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stepTitle">Título do Passo</Label>
              <Input
                id="stepTitle"
                value={stepTitle}
                onChange={(e) => setStepTitle(e.target.value)}
                placeholder="Digite o título do passo"
              />
            </div>
            <div>
              <Label htmlFor="stepNumber">Número do Passo</Label>
              <Input
                id="stepNumber"
                type="number"
                value={stepNumber}
                onChange={(e) => setStepNumber(parseInt(e.target.value) || 1)}
                min="1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="stepDescription">Descrição (Opcional)</Label>
            <Textarea
              id="stepDescription"
              value={stepDescription}
              onChange={(e) => setStepDescription(e.target.value)}
              placeholder="Descrição do passo para ajudar na organização"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="form" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="form">Campos do Formulário</TabsTrigger>
          <TabsTrigger value="navigation">Navegação Condicional</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="form" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Component Library */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Componentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {COMPONENTS.map((component) => {
                      const IconComponent = component.icon;
                      return (
                        <div
                          key={component.id}
                          className="bg-white border border-gray-200 rounded-lg p-3 cursor-move hover:shadow-sm transition-shadow flex items-center space-x-3"
                          draggable
                          onDragStart={() => handleDragStart(component)}
                        >
                          <IconComponent className="w-5 h-5 text-gray-500" />
                          <span className="text-sm font-medium">{component.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Form Builder Canvas */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Visualização do Formulário</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    ref={dropZoneRef}
                    className="min-h-96 border-2 border-dashed border-gray-300 rounded-lg p-6"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    {fields.length === 0 ? (
                      <div className="text-center text-gray-500 py-12">
                        <GripVertical className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p>Arraste componentes aqui para construir seu formulário</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {fields.map((field, index) => (
                          <div key={field.id} className="relative group border rounded-lg p-4 bg-gray-50">
                            <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleFieldMove(field.id, 'up')}
                                disabled={index === 0}
                                className="p-1 h-6 w-6"
                              >
                                ↑
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleFieldMove(field.id, 'down')}
                                disabled={index === fields.length - 1}
                                className="p-1 h-6 w-6"
                              >
                                ↓
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleFieldEdit(field)}
                                className="p-1 h-6 w-6"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleFieldDelete(field.id)}
                                className="p-1 h-6 w-6 text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                            {renderField(field)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Field Properties Panel */}
            <div className="lg:col-span-1">
              {editingField ? (
                <FieldPropertiesPanel
                  field={editingField}
                  onUpdate={handleFieldUpdate}
                  onCancel={() => setEditingField(null)}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Propriedades</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      Selecione um campo para editar suas propriedades
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="navigation" className="space-y-6 mt-6">
          <ConditionalNavigation
            stepNumber={stepNumber}
            fields={fields}
            navigationRules={navigationRules}
            onNavigationRulesChange={setNavigationRules}
            availableSteps={[1, 2, 3, 4, 5]} // This should come from existing steps in the system
          />
        </TabsContent>

        <TabsContent value="preview" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview do Formulário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">{stepTitle}</h2>
                {stepDescription && (
                  <p className="text-gray-600">{stepDescription}</p>
                )}
                {fields.map((field) => (
                  <div key={field.id}>
                    {renderField(field)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline">Visualizar</Button>
        <Button 
          onClick={handleSave}
          disabled={saveStepMutation.isPending}
          className="bg-gups-teal hover:bg-gups-teal/90"
        >
          {saveStepMutation.isPending ? 'Salvando...' : 'Salvar Passo'}
        </Button>
      </div>
    </div>
  );
}

// Field Properties Panel Component
interface FieldPropertiesPanelProps {
  field: FormField;
  onUpdate: (field: FormField) => void;
  onCancel: () => void;
}

function FieldPropertiesPanel({ field, onUpdate, onCancel }: FieldPropertiesPanelProps) {
  const [localField, setLocalField] = useState({ ...field });

  const handleChange = (key: string, value: any) => {
    setLocalField({ ...localField, [key]: value });
  };

  const handleOptionsChange = (optionsStr: string) => {
    const options = optionsStr.split('\n').filter(opt => opt.trim() !== '');
    setLocalField({ ...localField, options });
  };

  const handleSave = () => {
    onUpdate(localField);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Propriedades do Campo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Label */}
        {field.type !== 'heading' && field.type !== 'paragraph' && field.type !== 'image' && (
          <div>
            <Label htmlFor="fieldLabel">Rótulo</Label>
            <Input
              id="fieldLabel"
              value={localField.label}
              onChange={(e) => handleChange('label', e.target.value)}
            />
          </div>
        )}

        {/* Content for heading, paragraph, and image */}
        {(field.type === 'heading' || field.type === 'paragraph' || field.type === 'image') && (
          <div>
            <Label htmlFor="fieldContent">
              {field.type === 'heading' ? 'Texto do Título' : 
               field.type === 'paragraph' ? 'Texto do Parágrafo' : 'Descrição da Imagem'}
            </Label>
            <Textarea
              id="fieldContent"
              value={localField.content || ''}
              onChange={(e) => handleChange('content', e.target.value)}
            />
          </div>
        )}

        {/* Image URL */}
        {field.type === 'image' && (
          <div>
            <Label htmlFor="imageUrl">URL da Imagem</Label>
            <Input
              id="imageUrl"
              value={localField.imageUrl || ''}
              onChange={(e) => handleChange('imageUrl', e.target.value)}
              placeholder="https://exemplo.com/imagem.jpg"
            />
          </div>
        )}

        {/* Heading Level */}
        {field.type === 'heading' && (
          <div>
            <Label htmlFor="headingLevel">Nível do Título</Label>
            <Select
              value={localField.headingLevel || 'h2'}
              onValueChange={(value) => handleChange('headingLevel', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="h1">H1 - Principal</SelectItem>
                <SelectItem value="h2">H2 - Secundário</SelectItem>
                <SelectItem value="h3">H3 - Terciário</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Placeholder */}
        {(field.type === 'text' || field.type === 'email' || field.type === 'tel') && (
          <div>
            <Label htmlFor="placeholder">Texto de Exemplo</Label>
            <Input
              id="placeholder"
              value={localField.placeholder || ''}
              onChange={(e) => handleChange('placeholder', e.target.value)}
            />
          </div>
        )}

        {/* Options for radio, checkbox, select */}
        {(field.type === 'radio' || field.type === 'checkbox' || field.type === 'select') && (
          <div>
            <Label htmlFor="options">Opções (uma por linha)</Label>
            <Textarea
              id="options"
              value={localField.options?.join('\n') || ''}
              onChange={(e) => handleOptionsChange(e.target.value)}
              rows={4}
            />
          </div>
        )}

        {/* Required toggle */}
        {field.type !== 'heading' && field.type !== 'paragraph' && field.type !== 'image' && (
          <div className="flex items-center space-x-2">
            <Switch
              checked={localField.required}
              onCheckedChange={(checked) => handleChange('required', checked)}
            />
            <Label>Campo obrigatório</Label>
          </div>
        )}

        <div className="flex space-x-2 pt-4">
          <Button onClick={handleSave} className="bg-gups-teal hover:bg-gups-teal/90">
            Salvar
          </Button>
          <Button onClick={onCancel} variant="outline">
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}