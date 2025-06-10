import nodemailer from 'nodemailer';
import type { SmtpSettings, FormSubmission } from '@shared/schema';
import { storage } from './storage';

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  static async initializeTransporter(): Promise<void> {
    try {
      const smtpSettingsList = await storage.getSmtpSettings();
      const smtpSettings = smtpSettingsList.find(s => s.isActive);
      
      if (!smtpSettings || !smtpSettings.host) {
        console.log('No active SMTP settings found');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: smtpSettings.host,
        port: smtpSettings.port,
        secure: smtpSettings.port === 465, // true for 465, false for other ports
        auth: {
          user: smtpSettings.username,
          pass: smtpSettings.password,
        },
        tls: {
          rejectUnauthorized: false // Allow self-signed certificates
        }
      });

      console.log('SMTP transporter initialized successfully');
    } catch (error) {
      console.error('Error initializing SMTP transporter:', error);
    }
  }

  static async testConnection(smtpSettings: SmtpSettings): Promise<{ success: boolean; message: string }> {
    try {
      const testTransporter = nodemailer.createTransport({
        host: smtpSettings.host,
        port: smtpSettings.port,
        secure: smtpSettings.port === 465,
        auth: {
          user: smtpSettings.username,
          pass: smtpSettings.password,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      await testTransporter.verify();
      return { success: true, message: 'Conexão SMTP estabelecida com sucesso!' };
    } catch (error: any) {
      console.error('SMTP test error:', error);
      return { 
        success: false, 
        message: `Erro na conexão SMTP: ${error.message || 'Erro desconhecido'}` 
      };
    }
  }

  static async sendFormSubmissionEmail(submission: FormSubmission): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
        if (!this.transporter) {
          return { success: false, message: 'SMTP não configurado' };
        }
      }

      const smtpSettingsList = await storage.getSmtpSettings();
      const smtpSettings = smtpSettingsList.find(s => s.isActive);
      
      if (!smtpSettings?.recipientEmail) {
        return { success: false, message: 'Email destinatário não configurado' };
      }

      const htmlTemplate = this.generateEmailTemplate(submission);
      const textTemplate = this.generateTextTemplate(submission);

      const mailOptions = {
        from: `"Simulador de Planos de Saúde" <${smtpSettings.username}>`,
        to: smtpSettings.recipientEmail,
        subject: `Nova Simulação Concluída - ${submission.formData.name || 'Cliente'}`,
        text: textTemplate,
        html: htmlTemplate,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      
      return { success: true, message: 'Email enviado com sucesso!' };
    } catch (error: any) {
      console.error('Email sending error:', error);
      return { 
        success: false, 
        message: `Erro ao enviar email: ${error.message || 'Erro desconhecido'}` 
      };
    }
  }

  private static generateEmailTemplate(submission: FormSubmission): string {
    const formData = submission.formData;
    const submittedAt = new Date(submission.submittedAt || new Date()).toLocaleString('pt-BR');

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nova Simulação de Plano de Saúde</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8f9fa;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .content {
            padding: 30px 20px;
        }
        
        .alert {
            background-color: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 15px;
            margin-bottom: 25px;
            border-radius: 4px;
        }
        
        .alert-title {
            font-weight: 600;
            color: #1976d2;
            margin-bottom: 5px;
        }
        
        .section {
            margin-bottom: 25px;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #ecf0f1;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .info-item {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        
        .info-label {
            font-weight: 600;
            color: #495057;
            font-size: 14px;
            margin-bottom: 5px;
        }
        
        .info-value {
            color: #2c3e50;
            font-size: 16px;
        }
        
        .services-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
        }
        
        .service-tag {
            background-color: #e8f5e8;
            color: #2e7d32;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
        }
        
        .dependents-section {
            background-color: #fafafa;
            padding: 20px;
            border-radius: 8px;
            margin-top: 15px;
        }
        
        .dependent-item {
            background-color: white;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 10px;
            border: 1px solid #e0e0e0;
        }
        
        .dependent-item:last-child {
            margin-bottom: 0;
        }
        
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        
        .footer p {
            color: #6c757d;
            font-size: 14px;
        }
        
        .timestamp {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 10px;
            border-radius: 6px;
            font-size: 14px;
            text-align: center;
            margin-bottom: 20px;
        }
        
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 8px;
            }
            
            .header {
                padding: 20px 15px;
            }
            
            .header h1 {
                font-size: 20px;
            }
            
            .content {
                padding: 20px 15px;
            }
            
            .info-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Nova Simulação Recebida</h1>
            <p>Um cliente completou uma simulação de plano de saúde</p>
        </div>
        
        <div class="content">
            <div class="timestamp">
                <strong>⏰ Recebido em:</strong> ${submittedAt}
            </div>
            
            <div class="alert">
                <div class="alert-title">🎯 Ação Necessária</div>
                <p>Um novo lead foi gerado! Entre em contato com o cliente o mais rápido possível para aumentar as chances de conversão.</p>
            </div>
            
            <div class="section">
                <h2 class="section-title">👤 Informações do Cliente</h2>
                <div class="info-grid">
                    ${formData.name ? `
                    <div class="info-item">
                        <div class="info-label">Nome Completo</div>
                        <div class="info-value">${formData.name}</div>
                    </div>
                    ` : ''}
                    
                    ${formData.email ? `
                    <div class="info-item">
                        <div class="info-label">📧 Email</div>
                        <div class="info-value">${formData.email}</div>
                    </div>
                    ` : ''}
                    
                    ${formData.phone ? `
                    <div class="info-item">
                        <div class="info-label">📱 Telefone</div>
                        <div class="info-value">${formData.phone}</div>
                    </div>
                    ` : ''}
                    
                    ${formData.age ? `
                    <div class="info-item">
                        <div class="info-label">🎂 Idade</div>
                        <div class="info-value">${formData.age} anos</div>
                    </div>
                    ` : ''}
                    
                    ${formData.city ? `
                    <div class="info-item">
                        <div class="info-label">🏙️ Cidade</div>
                        <div class="info-value">${formData.city}</div>
                    </div>
                    ` : ''}
                    
                    ${formData.priceRange ? `
                    <div class="info-item">
                        <div class="info-label">💰 Faixa de Preço</div>
                        <div class="info-value">${this.formatPriceRange(formData.priceRange)}</div>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            ${formData.services && formData.services.length > 0 ? `
            <div class="section">
                <h2 class="section-title">🏥 Serviços de Interesse</h2>
                <div class="services-list">
                    ${formData.services.map((service: string) => `
                        <span class="service-tag">${this.formatServiceName(service)}</span>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            ${formData.dependents && formData.dependents.length > 0 ? `
            <div class="section">
                <h2 class="section-title">👨‍👩‍👧‍👦 Dependentes</h2>
                <div class="dependents-section">
                    ${formData.dependents.map((dependent: any, index: number) => `
                        <div class="dependent-item">
                            <div class="info-grid">
                                <div class="info-item">
                                    <div class="info-label">Nome</div>
                                    <div class="info-value">${dependent.name || `Dependente ${index + 1}`}</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Data de Nascimento</div>
                                    <div class="info-value">${dependent.birthDate || 'Não informado'}</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Parentesco</div>
                                    <div class="info-value">${dependent.relationship || 'Não informado'}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            <div class="section">
                <h2 class="section-title">📊 Detalhes Técnicos</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">🌐 IP do Cliente</div>
                        <div class="info-value">${submission.ipAddress || 'Não disponível'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">💻 Navegador</div>
                        <div class="info-value">${submission.userAgent ? this.extractBrowserInfo(submission.userAgent) : 'Não disponível'}</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>📧 Este email foi gerado automaticamente pelo Simulador de Planos de Saúde</p>
            <p>💡 Para melhor conversão, entre em contato com o cliente em até 15 minutos</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private static generateTextTemplate(submission: FormSubmission): string {
    const formData = submission.formData;
    const submittedAt = new Date(submission.submittedAt || new Date()).toLocaleString('pt-BR');

    let text = `NOVA SIMULAÇÃO DE PLANO DE SAÚDE\n`;
    text += `=======================================\n\n`;
    text += `Recebido em: ${submittedAt}\n\n`;
    
    text += `INFORMAÇÕES DO CLIENTE:\n`;
    text += `------------------------\n`;
    if (formData.name) text += `Nome: ${formData.name}\n`;
    if (formData.email) text += `Email: ${formData.email}\n`;
    if (formData.phone) text += `Telefone: ${formData.phone}\n`;
    if (formData.age) text += `Idade: ${formData.age} anos\n`;
    if (formData.city) text += `Cidade: ${formData.city}\n`;
    if (formData.priceRange) text += `Faixa de Preço: ${this.formatPriceRange(formData.priceRange)}\n`;
    
    if (formData.services && formData.services.length > 0) {
      text += `\nSERVIÇOS DE INTERESSE:\n`;
      text += `----------------------\n`;
      formData.services.forEach((service: string) => {
        text += `- ${this.formatServiceName(service)}\n`;
      });
    }
    
    if (formData.dependents && formData.dependents.length > 0) {
      text += `\nDEPENDENTES:\n`;
      text += `------------\n`;
      formData.dependents.forEach((dependent: any, index: number) => {
        text += `${index + 1}. ${dependent.name || `Dependente ${index + 1}`}\n`;
        text += `   Data de Nascimento: ${dependent.birthDate || 'Não informado'}\n`;
        text += `   Parentesco: ${dependent.relationship || 'Não informado'}\n`;
      });
    }
    
    text += `\nDETALHES TÉCNICOS:\n`;
    text += `------------------\n`;
    text += `IP: ${submission.ipAddress || 'Não disponível'}\n`;
    text += `Navegador: ${submission.userAgent ? this.extractBrowserInfo(submission.userAgent) : 'Não disponível'}\n`;
    
    text += `\n=======================================\n`;
    text += `Email gerado automaticamente pelo Simulador de Planos de Saúde\n`;
    text += `Para melhor conversão, entre em contato em até 15 minutos.`;

    return text;
  }

  private static formatPriceRange(priceRange: string): string {
    const ranges: { [key: string]: string } = {
      'basico': '💚 Básico (até R$ 200)',
      'intermediario': '💛 Intermediário (R$ 200 - R$ 500)',
      'premium': '💜 Premium (acima de R$ 500)',
      'familiar': '👨‍👩‍👧‍👦 Familiar',
      'individual': '👤 Individual'
    };
    return ranges[priceRange] || priceRange;
  }

  private static formatServiceName(service: string): string {
    const services: { [key: string]: string } = {
      'medico': '👨‍⚕️ Consultas Médicas',
      'exames': '🔬 Exames Laboratoriais',
      'emergencia': '🚑 Pronto Socorro',
      'internacao': '🏥 Internação Hospitalar',
      'cirurgia': '⚕️ Cirurgias',
      'odontologico': '🦷 Odontológico',
      'psicologico': '🧠 Psicológico',
      'fisioterapia': '🏃‍♂️ Fisioterapia',
      'maternidade': '🤱 Maternidade',
      'pediatria': '👶 Pediatria'
    };
    return services[service] || service;
  }

  private static extractBrowserInfo(userAgent: string): string {
    if (userAgent.includes('Chrome')) return '🌐 Google Chrome';
    if (userAgent.includes('Firefox')) return '🦊 Mozilla Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return '🧭 Safari';
    if (userAgent.includes('Edge')) return '📘 Microsoft Edge';
    if (userAgent.includes('Opera')) return '🎭 Opera';
    return '🌐 Navegador não identificado';
  }
}