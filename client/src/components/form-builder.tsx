import React, { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { FormField, FormStep } from "@shared/schema";

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
    id: 'text-input',
    name: 'Campo de Texto',
    icon: Type,
    type: 'text',
    defaultProps: { label: 'Campo de Texto', required: false, placeholder: 'Digite aqui...' }
  },
  {
    id: 'radio-group',
    name: 'Múltipla Escolha',
    icon: List,
    type: 'radio',
    defaultProps: { label: 'Escolha uma opção', required: false, options: ['Opção 1', 'Opção 2'] }
  },
  {
    id: 'checkbox-group',
    name: 'Caixas de Seleção',
    icon: CheckSquare,
    type: 'checkbox',
    defaultProps: { label: 'Selecione as opções', required: false, options: ['Opção 1', 'Opção 2'] }
  },
  {
    id: 'date-input',
    name: 'Data',
    icon: Calendar,
    type: 'date',
    defaultProps: { label: 'Data', required: false }
  },
  {
    id: 'phone-input',
    name: 'Telefone',
    icon: Phone,
    type: 'tel',
    defaultProps: { label: 'Telefone', required: false, placeholder: '(11) 99999-9999' }
  },
  {
    id: 'email-input',
    name: 'Email',
    icon: Mail,
    type: 'email',
    defaultProps: { label: 'Email', required: false, placeholder: 'email@exemplo.com' }
  },
  {
    id: 'heading1',
    name: 'Título H1',
    icon: Heading1,
    type: 'heading',
    defaultProps: { label: '', content: 'Título Principal', headingLevel: 'h1' as const }
  },
  {
    id: 'heading2',
    name: 'Título H2',
    icon: Heading2,
    type: 'heading',
    defaultProps: { label: '', content: 'Subtítulo', headingLevel: 'h2' as const }
  },
  {
    id: 'paragraph',
    name: 'Parágrafo',
    icon: AlignLeft,
    type: 'paragraph',
    defaultProps: { label: '', content: 'Este é um parágrafo de texto explicativo.' }
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
  const [stepNumber, setStepNumber] = useState(step?.stepNumber || 1);
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
      if (onSave) onSave({ title: stepTitle, stepNumber, fields });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao salvar passo do formulário.",
        variant: "destructive",
      });
    }
  });

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
        id: generateId(),
        type: draggedItem.type,
        label: draggedItem.defaultProps.label || 'Campo',
        required: draggedItem.defaultProps.required || false,
        options: draggedItem.defaultProps.options,
        placeholder: draggedItem.defaultProps.placeholder,
        content: draggedItem.defaultProps.content,
        imageUrl: draggedItem.defaultProps.imageUrl,
        headingLevel: draggedItem.defaultProps.headingLevel,
        style: draggedItem.defaultProps.style
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
  };

  const handleFieldMove = (fieldId: string, direction: 'up' | 'down') => {
    const currentIndex = fields.findIndex(f => f.id === fieldId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;

    const newFields = [...fields];
    [newFields[currentIndex], newFields[newIndex]] = [newFields[newIndex], newFields[currentIndex]];
    setFields(newFields);
  };

  const handleSave = () => {
    saveStepMutation.mutate({
      title: stepTitle,
      stepNumber,
      fields,
      conditionalRules: step?.conditionalRules || [],
      isActive: true
    });
  };

  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'heading':
        const HeadingTag = field.headingLevel || 'h2';
        return (
          <div className="py-2">
            {React.createElement(HeadingTag, { 
              className: `font-bold ${field.headingLevel === 'h1' ? 'text-2xl' : 'text-xl'} text-gray-900` 
            }, field.content || 'Título')}
          </div>
        );
      case 'paragraph':
        return (
          <div className="py-2">
            <p className="text-gray-700">{field.content || 'Parágrafo de texto.'}</p>
          </div>
        );
      case 'image':
        return (
          <div className="py-2">
            {field.imageUrl ? (
              <img src={field.imageUrl} alt={field.content || 'Imagem'} className="max-w-full h-auto rounded" />
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center">
                <Image className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">{field.content || 'Imagem não carregada'}</p>
              </div>
            )}
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
        </CardContent>
      </Card>

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
                <SelectItem value="h1">H1 - Título Principal</SelectItem>
                <SelectItem value="h2">H2 - Subtítulo</SelectItem>
                <SelectItem value="h3">H3 - Título Menor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Placeholder */}
        {(field.type === 'text' || field.type === 'email' || field.type === 'tel') && (
          <div>
            <Label htmlFor="fieldPlaceholder">Placeholder</Label>
            <Input
              id="fieldPlaceholder"
              value={localField.placeholder || ''}
              onChange={(e) => handleChange('placeholder', e.target.value)}
            />
          </div>
        )}

        {/* Options for radio and checkbox */}
        {(field.type === 'radio' || field.type === 'checkbox' || field.type === 'select') && (
          <div>
            <Label htmlFor="fieldOptions">Opções (uma por linha)</Label>
            <Textarea
              id="fieldOptions"
              value={localField.options?.join('\n') || ''}
              onChange={(e) => handleOptionsChange(e.target.value)}
              rows={4}
            />
          </div>
        )}

        {/* Required */}
        {field.type !== 'heading' && field.type !== 'paragraph' && field.type !== 'image' && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="fieldRequired"
              checked={localField.required}
              onChange={(e) => handleChange('required', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="fieldRequired">Campo obrigatório</Label>
          </div>
        )}

        <div className="flex space-x-2 pt-4">
          <Button onClick={handleSave} size="sm" className="bg-gups-teal hover:bg-gups-teal/90">
            Salvar
          </Button>
          <Button onClick={onCancel} size="sm" variant="outline">
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}