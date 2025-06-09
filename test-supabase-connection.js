import { neon } from '@neondatabase/serverless';

async function testSupabaseConnection() {
  const originalUrl = process.env.DATABASE_URL;
  
  if (!originalUrl) {
    console.log('DATABASE_URL não encontrada');
    return;
  }

  const parsed = new URL(originalUrl);
  console.log('URL original:', originalUrl.substring(0, 50) + '...');
  
  // Diferentes formatos de hostname que o Supabase pode usar
  const hostVariations = [
    parsed.hostname, // db.xxx.supabase.co
    parsed.hostname.replace('db.', 'aws-0-sa-east-1.pooler.'), // aws-0-sa-east-1.pooler.xxx.supabase.co
    parsed.hostname.replace('db.', 'pooler.'), // pooler.xxx.supabase.co
  ];

  for (let i = 0; i < hostVariations.length; i++) {
    const testHost = hostVariations[i];
    const testUrl = originalUrl.replace(parsed.hostname, testHost);
    
    console.log(`\nTentativa ${i + 1}: ${testHost}`);
    
    try {
      const sql = neon(testUrl);
      const result = await sql`SELECT 1 as test, version()`;
      console.log('✓ Conexão bem-sucedida!');
      console.log('Database version:', result[0].version.split(' ')[0]);
      console.log('URL correta:', testUrl.substring(0, 50) + '...');
      
      // Teste adicional: verificar se conseguimos criar tabelas
      try {
        await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 1`;
        console.log('✓ Permissões de leitura OK');
      } catch (permError) {
        console.log('⚠ Possível problema de permissões:', permError.message);
      }
      
      return testUrl;
    } catch (error) {
      console.log('✗ Falha:', error.message.substring(0, 100));
    }
  }
  
  console.log('\nNenhuma variação funcionou. Possíveis problemas:');
  console.log('1. URL de conexão incorreta');
  console.log('2. Projeto Supabase não ativo');
  console.log('3. Firewall/rede bloqueando conexão');
  console.log('4. Credenciais incorretas');
}

testSupabaseConnection().catch(console.error);