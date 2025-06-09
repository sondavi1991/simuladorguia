const pg = require('pg');

async function setupDemoData() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Conectado ao Supabase');

    // Clear existing data first
    await client.query('DELETE FROM form_steps');
    await client.query('DELETE FROM users WHERE username = $1', ['demo']);

    // Create test user
    await client.query(`
      INSERT INTO users (username, password) 
      VALUES ($1, $2)
    `, ['demo', 'demo123']);

    // Insert form steps with proper JSONB structure
    const formSteps = [
      {
        stepNumber: 1,
        title: 'Informações Pessoais',
        description: 'Vamos começar com suas informações básicas',
        fields: JSON.stringify([
          {
            id: 'name',
            type: 'text',
            label: 'Nome Completo',
            required: true,
            placeholder: 'Digite seu nome completo'
          },
          {
            id: 'email',
            type: 'email',
            label: 'E-mail',
            required: true,
            placeholder: 'seu@email.com'
          },
          {
            id: 'phone',
            type: 'tel',
            label: 'Telefone',
            required: true,
            placeholder: '(11) 99999-9999'
          },
          {
            id: 'birthDate',
            type: 'date',
            label: 'Data de Nascimento',
            required: true
          }
        ]),
        conditionalRules: JSON.stringify([]),
        navigationRules: JSON.stringify([])
      },
      {
        stepNumber: 2,
        title: 'Localização e Preferências',
        description: 'Precisamos saber onde você mora e suas preferências',
        fields: JSON.stringify([
          {
            id: 'zipCode',
            type: 'text',
            label: 'CEP',
            required: true,
            placeholder: '00000-000'
          },
          {
            id: 'planType',
            type: 'radio',
            label: 'Tipo de Plano Desejado',
            required: true,
            options: ['Individual', 'Familiar', 'Empresarial']
          },
          {
            id: 'priceRange',
            type: 'select',
            label: 'Faixa de Preço Mensal',
            required: true,
            options: ['Até R$ 200', 'R$ 200 - R$ 400', 'R$ 400 - R$ 600', 'Acima de R$ 600']
          }
        ]),
        conditionalRules: JSON.stringify([]),
        navigationRules: JSON.stringify([
          {
            id: 'rule1',
            stepId: 2,
            condition: {
              field: 'planType',
              operator: 'equals',
              value: 'Familiar'
            },
            target: {
              type: 'step',
              stepNumber: 3
            },
            priority: 1
          }
        ])
      },
      {
        stepNumber: 3,
        title: 'Dependentes',
        description: 'Informe os dependentes que serão incluídos no plano',
        fields: JSON.stringify([
          {
            id: 'dependentsCount',
            type: 'select',
            label: 'Número de Dependentes',
            required: true,
            options: ['1', '2', '3', '4', '5 ou mais']
          },
          {
            id: 'dependentAges',
            type: 'checkbox',
            label: 'Faixa Etária dos Dependentes',
            required: true,
            options: ['0-18 anos', '19-35 anos', '36-50 anos', '51-65 anos', 'Acima de 65 anos']
          }
        ]),
        conditionalRules: JSON.stringify([]),
        navigationRules: JSON.stringify([])
      },
      {
        stepNumber: 4,
        title: 'Serviços e Cobertura',
        description: 'Selecione os serviços que considera importantes',
        fields: JSON.stringify([
          {
            id: 'services',
            type: 'checkbox',
            label: 'Serviços Desejados',
            required: true,
            options: [
              'Consultas médicas',
              'Exames laboratoriais',
              'Internação hospitalar',
              'Cirurgias',
              'Odontologia',
              'Fisioterapia',
              'Medicina preventiva',
              'Telemedicina'
            ]
          },
          {
            id: 'urgency',
            type: 'radio',
            label: 'Quando você precisa do plano?',
            required: true,
            options: ['Imediatamente', 'Em até 30 dias', 'Em até 60 dias', 'Apenas pesquisando']
          }
        ]),
        conditionalRules: JSON.stringify([]),
        navigationRules: JSON.stringify([])
      }
    ];

    for (const step of formSteps) {
      await client.query(`
        INSERT INTO form_steps (step_number, title, description, fields, conditional_rules, navigation_rules, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      `, [
        step.stepNumber,
        step.title,
        step.description,
        step.fields,
        step.conditionalRules,
        step.navigationRules
      ]);
    }

    console.log('✅ Dados de demonstração inseridos com sucesso!');
    console.log('');
    console.log('🔑 CREDENCIAIS DE TESTE:');
    console.log('   Usuário: demo');
    console.log('   Senha: demo123');
    console.log('');
    console.log('📝 Formulário com 4 etapas criado:');
    console.log('   1. Informações Pessoais');
    console.log('   2. Localização e Preferências'); 
    console.log('   3. Dependentes (condicional)');
    console.log('   4. Serviços e Cobertura');
    
    await client.end();
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

setupDemoData();