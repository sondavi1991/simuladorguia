<?php
/**
 * Admin page for Bulbo Raiz plugin
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class Bulbo_Raiz_Admin {
    
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'init_settings'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            __('Configurações Bulbo Raiz', 'bulbo-raiz'),
            __('Bulbo Raiz', 'bulbo-raiz'),
            'manage_options',
            'bulbo-raiz-settings',
            array($this, 'admin_page')
        );
    }
    
    /**
     * Initialize settings
     */
    public function init_settings() {
        register_setting('bulbo_raiz_settings', 'bulbo_raiz_options');
        
        // API Settings Section
        add_settings_section(
            'bulbo_raiz_api_section',
            __('Configurações da API', 'bulbo-raiz'),
            array($this, 'api_section_callback'),
            'bulbo_raiz_settings'
        );
        
        add_settings_field(
            'api_url',
            __('URL da API Laravel', 'bulbo-raiz'),
            array($this, 'api_url_callback'),
            'bulbo_raiz_settings',
            'bulbo_raiz_api_section'
        );
        
        add_settings_field(
            'api_token',
            __('Token de Autenticação', 'bulbo-raiz'),
            array($this, 'api_token_callback'),
            'bulbo_raiz_settings',
            'bulbo_raiz_api_section'
        );
        
        add_settings_field(
            'api_email',
            __('Email para Autenticação', 'bulbo-raiz'),
            array($this, 'api_email_callback'),
            'bulbo_raiz_settings',
            'bulbo_raiz_api_section'
        );
        
        add_settings_field(
            'api_password',
            __('Senha para Autenticação', 'bulbo-raiz'),
            array($this, 'api_password_callback'),
            'bulbo_raiz_settings',
            'bulbo_raiz_api_section'
        );
        
        add_settings_field(
            'token_expires_at',
            __('Token Expira em', 'bulbo-raiz'),
            array($this, 'token_expires_callback'),
            'bulbo_raiz_settings',
            'bulbo_raiz_api_section'
        );
        

        
        // Form Settings Section
        add_settings_section(
            'bulbo_raiz_form_section',
            __('Configurações do Formulário', 'bulbo-raiz'),
            array($this, 'form_section_callback'),
            'bulbo_raiz_settings'
        );
        
        add_settings_field(
            'default_title',
            __('Título Padrão', 'bulbo-raiz'),
            array($this, 'default_title_callback'),
            'bulbo_raiz_settings',
            'bulbo_raiz_form_section'
        );
        
        add_settings_field(
            'default_subtitle',
            __('Subtítulo Padrão', 'bulbo-raiz'),
            array($this, 'default_subtitle_callback'),
            'bulbo_raiz_settings',
            'bulbo_raiz_form_section'
        );
        
        add_settings_field(
            'default_button_text',
            __('Texto do Botão', 'bulbo-raiz'),
            array($this, 'default_button_text_callback'),
            'bulbo_raiz_settings',
            'bulbo_raiz_form_section'
        );
        
        add_settings_field(
            'default_whatsapp',
            __('WhatsApp Padrão', 'bulbo-raiz'),
            array($this, 'default_whatsapp_callback'),
            'bulbo_raiz_settings',
            'bulbo_raiz_form_section'
        );
        
        add_settings_field(
            'theme',
            __('Tema', 'bulbo-raiz'),
            array($this, 'theme_callback'),
            'bulbo_raiz_settings',
            'bulbo_raiz_form_section'
        );
        
        // Advanced Settings Section
        add_settings_section(
            'bulbo_raiz_advanced_section',
            __('Configurações Avançadas', 'bulbo-raiz'),
            array($this, 'advanced_section_callback'),
            'bulbo_raiz_settings'
        );
        
        add_settings_field(
            'enable_debug',
            __('Modo Debug', 'bulbo-raiz'),
            array($this, 'enable_debug_callback'),
            'bulbo_raiz_settings',
            'bulbo_raiz_advanced_section'
        );
        
        add_settings_field(
            'cache_duration',
            __('Duração do Cache (minutos)', 'bulbo-raiz'),
            array($this, 'cache_duration_callback'),
            'bulbo_raiz_settings',
            'bulbo_raiz_advanced_section'
        );
        
        // Geography Sync Section
        add_settings_section(
            'bulbo_raiz_sync_section',
            __('Sincronização de Dados Geográficos', 'bulbo-raiz'),
            array($this, 'sync_section_callback'),
            'bulbo_raiz_settings'
        );
        
        add_settings_field(
            'sync_status',
            __('Status da Sincronização', 'bulbo-raiz'),
            array($this, 'sync_status_callback'),
            'bulbo_raiz_settings',
            'bulbo_raiz_sync_section'
        );
        
        add_settings_field(
            'sync_actions',
            __('Ações de Sincronização', 'bulbo-raiz'),
            array($this, 'sync_actions_callback'),
            'bulbo_raiz_settings',
            'bulbo_raiz_sync_section'
        );
    }
    
    /**
     * Enqueue admin scripts
     */
    public function enqueue_admin_scripts($hook) {
        if ($hook !== 'settings_page_bulbo-raiz-settings') {
            return;
        }
        
        wp_enqueue_style('bulbo-raiz-admin', BULBO_RAIZ_URL . 'assets/css/admin.css', array(), BULBO_RAIZ_VERSION);
        wp_enqueue_script('bulbo-raiz-admin', BULBO_RAIZ_URL . 'assets/js/admin.js', array('jquery'), BULBO_RAIZ_VERSION, true);
        
        wp_localize_script('bulbo-raiz-admin', 'bulbo_raiz_admin', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('bulbo_raiz_admin_nonce'),
            'strings' => array(
                'testing' => __('Testando conexão...', 'bulbo-raiz'),
                'success' => __('Conexão bem-sucedida!', 'bulbo-raiz'),
                'error' => __('Erro na conexão:', 'bulbo-raiz')
            )
        ));
    }
    
    /**
     * Admin page HTML
     */
    public function admin_page() {
        ?>
        <div class="wrap bulbo-raiz-admin">
            <h1><?php _e('Configurações do Bulbo Raiz', 'bulbo-raiz'); ?></h1>
            
            <div class="bulbo-raiz-header">
                <div class="bulbo-raiz-logo">
                    <span class="bulbo-raiz-icon">🌱</span>
                    <h2><?php _e('Sistema de Distribuidores', 'bulbo-raiz'); ?></h2>
                </div>
                
                <div class="bulbo-raiz-actions">
                    <button type="button" id="test-connection" class="button button-secondary">
                        <span class="dashicons dashicons-admin-plugins"></span>
                        <?php _e('Testar Conexão', 'bulbo-raiz'); ?>
                    </button>
                    
                    <button type="button" id="clear-cache" class="button button-secondary">
                        <span class="dashicons dashicons-update"></span>
                        <?php _e('Limpar Cache', 'bulbo-raiz'); ?>
                    </button>
                </div>
            </div>
            
            <div class="bulbo-raiz-content">
                <div class="bulbo-raiz-main">
                    <form method="post" action="options.php">
                        <?php
                        settings_fields('bulbo_raiz_settings');
                        do_settings_sections('bulbo_raiz_settings');
                        submit_button(__('Salvar Configurações', 'bulbo-raiz'));
                        ?>
                    </form>
                </div>
                
                <div class="bulbo-raiz-sidebar">
                    <div class="bulbo-raiz-widget">
                        <h3><?php _e('Como Usar', 'bulbo-raiz'); ?></h3>
                        <div class="bulbo-raiz-widget-content">
                            <p><?php _e('Use o shortcode abaixo para exibir o formulário:', 'bulbo-raiz'); ?></p>
                            <code>[bulbo_raiz_form]</code>
                            
                            <h4><?php _e('Parâmetros Disponíveis:', 'bulbo-raiz'); ?></h4>
                            <ul>
                                <li><code>title</code> - Título do formulário</li>
                                <li><code>subtitle</code> - Subtítulo</li>
                                <li><code>button_text</code> - Texto do botão</li>
                                <li><code>theme</code> - Tema (light/dark)</li>
                                <li><code>show_title</code> - Mostrar título (true/false)</li>
                            </ul>
                            
                            <h4><?php _e('Exemplo:', 'bulbo-raiz'); ?></h4>
                            <code>[bulbo_raiz_form title="Encontre seu Distribuidor" button_text="Buscar Agora"]</code>
                        </div>
                    </div>
                    
                    <div class="bulbo-raiz-widget">
                        <h3><?php _e('Status da Conexão', 'bulbo-raiz'); ?></h3>
                        <div class="bulbo-raiz-widget-content">
                            <div id="connection-status" class="bulbo-raiz-status">
                                <span class="bulbo-raiz-status-icon">⏳</span>
                                <span class="bulbo-raiz-status-text"><?php _e('Não testado', 'bulbo-raiz'); ?></span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bulbo-raiz-widget">
                        <h3><?php _e('Estatísticas', 'bulbo-raiz'); ?></h3>
                        <div class="bulbo-raiz-widget-content">
                            <?php
                            $stats = $this->get_plugin_stats();
                            ?>
                            <div class="bulbo-raiz-stats">
                                <div class="bulbo-raiz-stat">
                                    <span class="bulbo-raiz-stat-number"><?php echo esc_html($stats['forms_rendered']); ?></span>
                                    <span class="bulbo-raiz-stat-label"><?php _e('Formulários Exibidos', 'bulbo-raiz'); ?></span>
                                </div>
                                
                                <div class="bulbo-raiz-stat">
                                    <span class="bulbo-raiz-stat-number"><?php echo esc_html($stats['leads_sent']); ?></span>
                                    <span class="bulbo-raiz-stat-label"><?php _e('Leads Enviados', 'bulbo-raiz'); ?></span>
                                </div>
                                
                                <div class="bulbo-raiz-stat">
                                    <span class="bulbo-raiz-stat-number"><?php echo esc_html($stats['success_rate']); ?>%</span>
                                    <span class="bulbo-raiz-stat-label"><?php _e('Taxa de Sucesso', 'bulbo-raiz'); ?></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }
    
    /**
     * Section callbacks
     */
    public function api_section_callback() {
        echo '<p>' . __('Configure a conexão com a API do sistema Bulbo Raiz Laravel para acessar rotas protegidas.', 'bulbo-raiz') . '</p>';
        echo '<div class="notice notice-info inline"><p>';
        echo '<strong>' . __('Como configurar:', 'bulbo-raiz') . '</strong><br>';
        echo '1. ' . __('Defina a URL da API Laravel', 'bulbo-raiz') . '<br>';
        echo '2. ' . __('Insira suas credenciais de login', 'bulbo-raiz') . '<br>';
        echo '3. ' . __('Clique em "Gerar Token" para autenticação automática', 'bulbo-raiz') . '<br>';
        echo '4. ' . __('Teste a conexão para verificar se tudo está funcionando', 'bulbo-raiz');
        echo '</p></div>';
    }
    
    public function form_section_callback() {
        echo '<p>' . __('Personalize a aparência e comportamento do formulário.', 'bulbo-raiz') . '</p>';
    }
    
    public function advanced_section_callback() {
        echo '<p>' . __('Configurações avançadas para desenvolvedores.', 'bulbo-raiz') . '</p>';
    }
    
    /**
     * Field callbacks
     */
    public function api_url_callback() {
        $options = get_option('bulbo_raiz_options');
        $value = isset($options['api_url']) ? $options['api_url'] : 'http://localhost:8000/api';
        ?>
        <input type="url" name="bulbo_raiz_options[api_url]" value="<?php echo esc_attr($value); ?>" class="regular-text" required>
        <p class="description"><?php _e('URL base da API Laravel (ex: http://localhost:8000/api)', 'bulbo-raiz'); ?></p>
        <?php
    }
    
    public function api_token_callback() {
        $options = get_option('bulbo_raiz_options');
        $value = isset($options['api_token']) ? $options['api_token'] : '';
        $token_expires = isset($options['token_expires_at']) ? $options['token_expires_at'] : '';
        $is_expired = $token_expires && strtotime($token_expires) < time();
        ?>
        <div class="bulbo-raiz-token-field">
            <input type="text" name="bulbo_raiz_options[api_token]" value="<?php echo esc_attr($value); ?>" class="large-text" readonly>
            <button type="button" id="generate-token" class="button button-secondary" style="margin-left: 10px;">
                <span class="dashicons dashicons-admin-network"></span>
                <?php _e('Gerar Token', 'bulbo-raiz'); ?>
            </button>
            <button type="button" id="refresh-token" class="button button-secondary" style="margin-left: 5px;" <?php echo !$value ? 'disabled' : ''; ?>>
                <span class="dashicons dashicons-update"></span>
                <?php _e('Renovar', 'bulbo-raiz'); ?>
            </button>
        </div>
        
        <?php if ($value): ?>
            <div class="token-status" style="margin-top: 10px;">
                <?php if ($is_expired): ?>
                    <span class="status-indicator expired">🔴</span>
                    <span class="status-text"><?php _e('Token expirado - Clique em "Renovar" para obter um novo token', 'bulbo-raiz'); ?></span>
                <?php else: ?>
                    <span class="status-indicator valid">🟢</span>
                    <span class="status-text"><?php _e('Token ativo', 'bulbo-raiz'); ?></span>
                    <?php if ($token_expires): ?>
                        <span class="expiry-info"><?php printf(__('Expira em: %s', 'bulbo-raiz'), date('d/m/Y H:i', strtotime($token_expires))); ?></span>
                    <?php endif; ?>
                <?php endif; ?>
            </div>
        <?php endif; ?>
        
        <p class="description">
            <?php _e('Token de autenticação da API Laravel (será gerado automaticamente usando as credenciais acima)', 'bulbo-raiz'); ?>
        </p>
        <?php
    }
    
    public function api_email_callback() {
        $options = get_option('bulbo_raiz_options');
        $value = isset($options['api_email']) ? $options['api_email'] : '';
        ?>
        <input type="email" name="bulbo_raiz_options[api_email]" value="<?php echo esc_attr($value); ?>" class="regular-text">
        <p class="description"><?php _e('Email para autenticação da API', 'bulbo-raiz'); ?></p>
        <?php
    }
    
    public function api_password_callback() {
        $options = get_option('bulbo_raiz_options');
        $value = isset($options['api_password']) ? $options['api_password'] : '';
        ?>
        <input type="password" name="bulbo_raiz_options[api_password]" value="<?php echo esc_attr($value); ?>" class="regular-text">
        <p class="description"><?php _e('Senha para autenticação da API', 'bulbo-raiz'); ?></p>
        <?php
    }
    
    public function token_expires_callback() {
        $options = get_option('bulbo_raiz_options');
        $value = isset($options['token_expires_at']) ? $options['token_expires_at'] : '';
        ?>
        <input type="datetime-local" name="bulbo_raiz_options[token_expires_at]" value="<?php echo esc_attr($value); ?>" class="regular-text">
        <p class="description"><?php _e('Data e hora em que o token expira', 'bulbo-raiz'); ?></p>
        <?php
    }
    
    public function default_title_callback() {
        $options = get_option('bulbo_raiz_options');
        $value = isset($options['default_title']) ? $options['default_title'] : __('Encontre seu Distribuidor', 'bulbo-raiz');
        ?>
        <input type="text" name="bulbo_raiz_options[default_title]" value="<?php echo esc_attr($value); ?>" class="regular-text">
        <?php
    }
    
    public function default_subtitle_callback() {
        $options = get_option('bulbo_raiz_options');
        $value = isset($options['default_subtitle']) ? $options['default_subtitle'] : __('Preencha seus dados e encontre o distribuidor mais próximo', 'bulbo-raiz');
        ?>
        <textarea name="bulbo_raiz_options[default_subtitle]" rows="2" class="large-text"><?php echo esc_textarea($value); ?></textarea>
        <?php
    }
    
    public function default_button_text_callback() {
        $options = get_option('bulbo_raiz_options');
        $value = isset($options['default_button_text']) ? $options['default_button_text'] : __('Encontrar Distribuidor', 'bulbo-raiz');
        ?>
        <input type="text" name="bulbo_raiz_options[default_button_text]" value="<?php echo esc_attr($value); ?>" class="regular-text">
        <?php
    }
    
    public function default_whatsapp_callback() {
        $options = get_option('bulbo_raiz_options');
        $value = isset($options['default_whatsapp']) ? $options['default_whatsapp'] : '';
        ?>
        <input type="text" name="bulbo_raiz_options[default_whatsapp]" value="<?php echo esc_attr($value); ?>" class="regular-text">
        <p class="description"><?php _e('WhatsApp Padrão', 'bulbo-raiz'); ?></p>
        <?php
    }
    
    public function theme_callback() {
        $options = get_option('bulbo_raiz_options');
        $value = isset($options['theme']) ? $options['theme'] : 'light';
        ?>
        <select name="bulbo_raiz_options[theme]">
            <option value="light" <?php selected($value, 'light'); ?>><?php _e('Claro', 'bulbo-raiz'); ?></option>
            <option value="dark" <?php selected($value, 'dark'); ?>><?php _e('Escuro', 'bulbo-raiz'); ?></option>
        </select>
        <?php
    }
    
    public function enable_debug_callback() {
        $options = get_option('bulbo_raiz_options');
        $value = isset($options['enable_debug']) ? $options['enable_debug'] : false;
        ?>
        <label>
            <input type="checkbox" name="bulbo_raiz_options[enable_debug]" value="1" <?php checked($value, 1); ?>>
            <?php _e('Ativar logs de debug no console do navegador', 'bulbo-raiz'); ?>
        </label>
        <?php
    }
    
    public function cache_duration_callback() {
        $options = get_option('bulbo_raiz_options');
        $value = isset($options['cache_duration']) ? $options['cache_duration'] : 60;
        ?>
        <input type="number" name="bulbo_raiz_options[cache_duration]" value="<?php echo esc_attr($value); ?>" min="0" max="1440" class="small-text">
        <p class="description"><?php _e('Tempo em minutos para cache de estados e cidades (0 = sem cache)', 'bulbo-raiz'); ?></p>
        <?php
    }
    
    public function wp_api_key_callback() {
        $options = get_option('bulbo_raiz_options');
        $value = isset($options['wp_api_key']) ? $options['wp_api_key'] : '';
        ?>
        <input type="text" name="bulbo_raiz_options[wp_api_key]" value="<?php echo esc_attr($value); ?>" class="regular-text">
        <p class="description"><?php _e('Chave API para autenticação com rotas protegidas (configure WORDPRESS_API_KEY no Laravel)', 'bulbo-raiz'); ?></p>
        <?php
    }
    
    
    
    public function sync_section_callback() {
        echo '<p>' . __('Sistema de cache local para melhorar a performance do formulário. Os dados geográficos são armazenados localmente no WordPress e sincronizados com o Laravel quando necessário.', 'bulbo-raiz') . '</p>';
        echo '<div class="notice notice-info inline"><p>';
        echo '<strong>' . __('Como funciona:', 'bulbo-raiz') . '</strong><br>';
        echo '1. ' . __('Os dados de estados, cidades e bairros são baixados da API do Laravel', 'bulbo-raiz') . '<br>';
        echo '2. ' . __('Ficam armazenados localmente no banco do WordPress', 'bulbo-raiz') . '<br>';
        echo '3. ' . __('O formulário carrega instantaneamente sem fazer requisições externas', 'bulbo-raiz') . '<br>';
        echo '4. ' . __('Sincronize periodicamente para manter os dados atualizados', 'bulbo-raiz');
        echo '</p></div>';
    }
    
    public function sync_status_callback() {
        ?>
        <div id="sync-status-container">
            <div class="bulbo-raiz-sync-status" id="sync-status-display">
                <span class="sync-loading">⏳</span> 
                <span><?php _e('Carregando status...', 'bulbo-raiz'); ?></span>
            </div>
            
            <div class="bulbo-raiz-sync-details" id="sync-details" style="display:none;">
                <table class="widefat">
                    <thead>
                        <tr>
                            <th><?php _e('Tipo', 'bulbo-raiz'); ?></th>
                            <th><?php _e('Quantidade', 'bulbo-raiz'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><?php _e('Estados', 'bulbo-raiz'); ?></td>
                            <td id="states-count">-</td>
                        </tr>
                        <tr>
                            <td><?php _e('Cidades', 'bulbo-raiz'); ?></td>
                            <td id="cities-count">-</td>
                        </tr>
                        <tr>
                            <td><?php _e('Bairros', 'bulbo-raiz'); ?></td>
                            <td id="neighborhoods-count">-</td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="sync-last-update">
                    <strong><?php _e('Última sincronização:', 'bulbo-raiz'); ?></strong>
                    <span id="last-sync-date">-</span>
                </div>
            </div>
        </div>
        
        <style>
        .bulbo-raiz-sync-status {
            padding: 10px;
            margin: 10px 0;
            border-left: 4px solid #0073aa;
            background: #f7f7f7;
        }
        .bulbo-raiz-sync-status.success {
            border-left-color: #46b450;
        }
        .bulbo-raiz-sync-status.warning {
            border-left-color: #ffb900;
        }
        .bulbo-raiz-sync-status.error {
            border-left-color: #dc3232;
        }
        .bulbo-raiz-sync-details {
            margin-top: 15px;
        }
        .sync-last-update {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
        }
        .sync-loading {
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        </style>
        <?php
    }
    
    public function sync_actions_callback() {
        ?>
        <div class="bulbo-raiz-sync-actions">
            <!-- Ações de Gerenciamento de Dados -->
            <h4><?php _e('Gerenciamento de Dados', 'bulbo-raiz'); ?></h4>
            <p>
                <button type="button" id="btn-clean-tables" class="button button-secondary" style="color: #d63638;">
                    <span class="dashicons dashicons-trash"></span>
                    <?php _e('Limpar Tabelas', 'bulbo-raiz'); ?>
                </button>
                
                <button type="button" id="btn-regenerate-tables" class="button button-secondary">
                    <span class="dashicons dashicons-admin-generic"></span>
                    <?php _e('Regenerar Tabelas', 'bulbo-raiz'); ?>
                </button>
            </p>
            
            <!-- Ações de Sincronização -->
            <h4><?php _e('Sincronização de Dados', 'bulbo-raiz'); ?></h4>
            <p>
                <button type="button" id="btn-smart-sync" class="button button-primary">
                    <span class="dashicons dashicons-update"></span>
                    <?php _e('Sincronização Inteligente', 'bulbo-raiz'); ?>
                </button>
                
                <button type="button" id="btn-force-smart-sync" class="button button-secondary">
                    <span class="dashicons dashicons-admin-tools"></span>
                    <?php _e('Forçar Sincronização', 'bulbo-raiz'); ?>
                </button>
            </p>
            
            <!-- Sincronização Específica -->
            <h4><?php _e('Sincronização Específica', 'bulbo-raiz'); ?></h4>
            <p>
                <button type="button" id="btn-sync-sp-neighborhoods" class="button button-secondary" style="background: #46b450; border-color: #46b450; color: white;">
                    <span class="dashicons dashicons-location-alt"></span>
                    <?php _e('Sincronizar Bairros de São Paulo', 'bulbo-raiz'); ?>
                </button>
            </p>
            <p style="font-size: 12px; color: #666; margin-top: 5px;">
                <?php _e('Esta opção sincroniza apenas os bairros da cidade de São Paulo, sendo muito mais rápida que a sincronização completa.', 'bulbo-raiz'); ?>
            </p>
            
            <!-- Controles de Monitoramento -->
            <h4><?php _e('Monitoramento e Controle', 'bulbo-raiz'); ?></h4>
            <p>
                <button type="button" id="btn-refresh-queue-status" class="button button-secondary">
                    <span class="dashicons dashicons-visibility"></span>
                    <?php _e('Atualizar Status', 'bulbo-raiz'); ?>
                </button>
                
                <button type="button" id="btn-pause-sync" class="button button-secondary" style="display:none;">
                    <span class="dashicons dashicons-controls-pause"></span>
                    <?php _e('Pausar', 'bulbo-raiz'); ?>
                </button>
                
                <button type="button" id="btn-resume-sync" class="button button-secondary" style="display:none;">
                    <span class="dashicons dashicons-controls-play"></span>
                    <?php _e('Retomar', 'bulbo-raiz'); ?>
                </button>
                

            </p>
            
            <!-- Status da Fila em Tempo Real -->
            <div id="sync-queue-status" style="display:none;">
                <h4><?php _e('Status da Fila de Sincronização', 'bulbo-raiz'); ?></h4>
                <div class="sync-queue-stats">
                    <div class="queue-stat">
                        <strong><?php _e('Pendentes:', 'bulbo-raiz'); ?></strong>
                        <span id="queue-pending">0</span>
                    </div>
                    <div class="queue-stat">
                        <strong><?php _e('Processando:', 'bulbo-raiz'); ?></strong>
                        <span id="queue-processing">0</span>
                    </div>
                    <div class="queue-stat">
                        <strong><?php _e('Concluídos:', 'bulbo-raiz'); ?></strong>
                        <span id="queue-completed">0</span>
                    </div>
                    <div class="queue-stat">
                        <strong><?php _e('Falharam:', 'bulbo-raiz'); ?></strong>
                        <span id="queue-failed">0</span>
                    </div>
                </div>
                
                <div id="sync-session-id" style="margin-top: 10px; font-size: 11px; color: #666;">
                    <strong><?php _e('Sessão:', 'bulbo-raiz'); ?></strong> <span id="session-id-value">-</span>
                </div>
            </div>
            
            <!-- Log de Monitoramento em Tempo Real -->
            <div id="sync-monitoring-log" style="display:none;">
                <h4><?php _e('Log de Sincronização (Últimas 20 ações)', 'bulbo-raiz'); ?></h4>
                <div id="monitoring-log-content" style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; background: #f9f9f9;">
                    <!-- Log entries will be populated here -->
                </div>
            </div>
            
            <!-- Progresso Simples -->
            <div id="sync-progress" style="display:none;">
                <div class="sync-progress-bar">
                    <div class="sync-progress-fill" style="width: 0%;"></div>
                </div>
                <div class="sync-progress-text">
                    <span id="sync-progress-message"><?php _e('Iniciando...', 'bulbo-raiz'); ?></span>
                </div>
            </div>
            
            <!-- Resultado de Ações -->
            <div id="sync-result" style="display:none;">
                <div class="notice">
                    <p id="sync-result-message"></p>
                </div>
            </div>
        </div>
        
        <style>
        .bulbo-raiz-sync-actions .button {
            margin-right: 10px;
            margin-bottom: 5px;
        }
        .bulbo-raiz-sync-actions h4 {
            margin-top: 20px;
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }
        .bulbo-raiz-sync-actions h4:first-of-type {
            margin-top: 10px;
        }
        .sync-progress-bar {
            width: 100%;
            height: 20px;
            background-color: #f0f0f0;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        .sync-progress-fill {
            height: 100%;
            background: linear-gradient(45deg, #0073aa, #00a0d2);
            transition: width 0.3s ease;
        }
        .sync-progress-text {
            text-align: center;
            font-weight: bold;
        }
        .sync-queue-stats {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            margin: 10px 0;
            padding: 10px;
            background: #f0f0f0;
            border-radius: 5px;
        }
        .queue-stat {
            min-width: 100px;
        }
        .monitoring-log-entry {
            margin-bottom: 8px;
            padding: 5px;
            border-left: 3px solid #ccc;
        }
        .monitoring-log-entry.status-completed {
            border-left-color: #46b450;
            background: #f0fff0;
        }
        .monitoring-log-entry.status-failed {
            border-left-color: #dc3232;
            background: #fff0f0;
        }
        .monitoring-log-entry.status-started {
            border-left-color: #0073aa;
            background: #f0f8ff;
        }
        .log-time {
            font-size: 10px;
            color: #666;
        }
        .log-message {
            font-size: 12px;
            margin-top: 2px;
        }
        .log-performance {
            font-size: 10px;
            color: #999;
            margin-top: 2px;
        }
        </style>
        
        <script>
        jQuery(document).ready(function($) {
            let monitoringInterval;
            
            // Carregar status inicial
            loadSyncStatus();
            
            // Auto-refresh de status com intervalo reduzido (30 segundos) se sincronização estiver ativa
            function startMonitoring() {
                if (monitoringInterval) clearInterval(monitoringInterval);
                monitoringInterval = setInterval(function() {
                    // Só faz requisição se a página estiver visível e houver sync ativo
                    if (!document.hidden) {
                        loadQueueStatus();
                    }
                }, 30000); // Reduzido de 5 para 30 segundos
            }
            
            function stopMonitoring() {
                if (monitoringInterval) {
                    clearInterval(monitoringInterval);
                    monitoringInterval = null;
                }
            }
            
            // Event handlers
            $('#btn-refresh-queue-status').on('click', function() {
                loadQueueStatus();
            });
            
            $('#btn-clean-tables').on('click', function() {
                if (confirm('<?php _e('⚠️ ATENÇÃO: Isso irá limpar TODOS os dados das tabelas (estados, cidades, bairros). Tem certeza?', 'bulbo-raiz'); ?>')) {
                    cleanTables();
                }
            });
            
            $('#btn-regenerate-tables').on('click', function() {
                if (confirm('<?php _e('⚠️ Isso irá recriar todas as tabelas do zero. Continuar?', 'bulbo-raiz'); ?>')) {
                    regenerateTables();
                }
            });
            
            $('#btn-smart-sync').on('click', function() {
                startSmartSync(false);
            });
            
            $('#btn-force-smart-sync').on('click', function() {
                if (confirm('<?php _e('Forçar sincronização irá substituir todos os dados existentes. Continuar?', 'bulbo-raiz'); ?>')) {
                    startSmartSync(true);
                }
            });
            
            $('#btn-pause-sync').on('click', function() {
                pauseSync();
            });
            
            $('#btn-resume-sync').on('click', function() {
                resumeSync();
            });
            
            $('#btn-diagnose').on('click', function() {
                runDiagnose();
            });
            
            $('#btn-test-sp').on('click', function() {
                testSPButton();
            });
            
            $('#btn-clear-cron').on('click', function() {
                clearCronJobs();
            });
            
            function loadSyncStatus() {
                $('#sync-status-display')
                    .removeClass('success warning error')
                    .html('<span class="sync-loading">⏳</span> <?php _e('Carregando status...', 'bulbo-raiz'); ?>');
                
                $.post(ajaxurl, {
                    action: 'bulbo_raiz_get_sync_status',
                    nonce: bulbo_raiz_admin.nonce
                }, function(response) {
                    if (response.success) {
                        const data = response.data;
                        const counts = data.counts;
                        
                        // Atualizar contadores
                        $('#states-count').text(counts.states.toLocaleString());
                        $('#cities-count').text(counts.cities.toLocaleString());
                        $('#neighborhoods-count').text(counts.neighborhoods.toLocaleString());
                        
                        // Atualizar data da última sincronização
                        const lastSync = data.last_sync || 'Nunca';
                        $('#last-sync-date').text(lastSync);
                        
                        // Atualizar status visual
                        const statusEl = $('#sync-status-display');
                        if (data.needs_sync) {
                            statusEl.addClass('warning')
                                .html('⚠️ <?php _e('Sincronização necessária', 'bulbo-raiz'); ?>');
                        } else {
                            statusEl.addClass('success')
                                .html('✅ <?php _e('Dados sincronizados', 'bulbo-raiz'); ?>');
                        }
                        
                        $('#sync-details').show();
                        
                        // Carregar status da fila
                        loadQueueStatus();
                    } else {
                        $('#sync-status-display')
                            .addClass('error')
                            .html('❌ <?php _e('Erro ao carregar status', 'bulbo-raiz'); ?>');
                    }
                }).fail(function() {
                    $('#sync-status-display')
                        .addClass('error')
                        .html('❌ <?php _e('Erro de conexão', 'bulbo-raiz'); ?>');
                });
            }
            
            function loadQueueStatus() {
                $.post(ajaxurl, {
                    action: 'bulbo_raiz_get_sync_queue_status',
                    nonce: bulbo_raiz_admin.nonce
                }, function(response) {
                    if (response.success) {
                        const data = response.data;
                        updateQueueStatus(data);
                    }
                });
            }
            
            function updateQueueStatus(data) {
                // Atualizar estatísticas da fila
                let pending = 0, processing = 0, completed = 0, failed = 0;
                
                data.queue_stats.forEach(function(stat) {
                    switch(stat.status) {
                        case 'pending': pending += parseInt(stat.count); break;
                        case 'processing': processing += parseInt(stat.count); break;
                        case 'completed': completed += parseInt(stat.count); break;
                        case 'failed': failed += parseInt(stat.count); break;
                    }
                });
                
                $('#queue-pending').text(pending);
                $('#queue-processing').text(processing);
                $('#queue-completed').text(completed);
                $('#queue-failed').text(failed);
                
                // Mostrar/ocultar controles
                const isActive = data.is_active;
                const isPaused = data.is_paused;
                
                if (isActive || completed > 0 || failed > 0) {
                    $('#sync-queue-status').show();
                    $('#sync-monitoring-log').show();
                    
                    if (isActive) {
                        if (isPaused) {
                            $('#btn-pause-sync').hide();
                            $('#btn-resume-sync').show();
                        } else {
                            $('#btn-pause-sync').show();
                            $('#btn-resume-sync').hide();
                        }
                        startMonitoring();
                    } else {
                        $('#btn-pause-sync').hide();
                        $('#btn-resume-sync').hide();
                        stopMonitoring();
                    }
                } else {
                    $('#sync-queue-status').hide();
                    $('#sync-monitoring-log').hide();
                    $('#btn-pause-sync').hide();
                    $('#btn-resume-sync').hide();
                    stopMonitoring();
                }
                
                // Atualizar session ID
                $('#session-id-value').text(data.session_id || '-');
                
                // Atualizar log de monitoramento
                updateMonitoringLog(data.recent_monitors);
            }
            
            function updateMonitoringLog(monitors) {
                const logContent = $('#monitoring-log-content');
                let html = '';
                
                if (monitors && monitors.length > 0) {
                    monitors.forEach(function(monitor) {
                        const time = new Date(monitor.created_at).toLocaleTimeString();
                        const statusClass = 'status-' + monitor.status;
                        
                        html += '<div class="monitoring-log-entry ' + statusClass + '">';
                        html += '<div class="log-time">' + time + ' - ' + monitor.entity_type + '</div>';
                        html += '<div class="log-message">' + monitor.message + '</div>';
                        
                        if (monitor.execution_time_ms || monitor.memory_usage_mb) {
                            html += '<div class="log-performance">';
                            if (monitor.execution_time_ms) {
                                html += 'Tempo: ' + monitor.execution_time_ms + 'ms ';
                            }
                            if (monitor.memory_usage_mb) {
                                html += 'Memória: ' + monitor.memory_usage_mb + 'MB';
                            }
                            html += '</div>';
                        }
                        
                        html += '</div>';
                    });
                } else {
                    html = '<p style="color: #666; font-style: italic;"><?php _e('Nenhuma atividade recente.', 'bulbo-raiz'); ?></p>';
                }
                
                logContent.html(html);
            }
            
            function cleanTables() {
                showProgress('<?php _e('Limpando tabelas...', 'bulbo-raiz'); ?>');
                
                $.post(ajaxurl, {
                    action: 'bulbo_raiz_clean_tables',
                    nonce: bulbo_raiz_admin.nonce
                }, function(response) {
                    hideProgress();
                    
                    if (response.success) {
                        showResult(response.data.message, 'success');
                        setTimeout(function() {
                            loadSyncStatus();
                        }, 1000);
                    } else {
                        showResult('<?php _e('Erro ao limpar tabelas:', 'bulbo-raiz'); ?> ' + response.data.message, 'error');
                    }
                }).fail(function() {
                    hideProgress();
                    showResult('<?php _e('Erro de conexão ao limpar tabelas.', 'bulbo-raiz'); ?>', 'error');
                });
            }
            
            function regenerateTables() {
                showProgress('<?php _e('Regenerando tabelas...', 'bulbo-raiz'); ?>');
                
                $.post(ajaxurl, {
                    action: 'bulbo_raiz_regenerate_tables',
                    nonce: bulbo_raiz_admin.nonce
                }, function(response) {
                    hideProgress();
                    
                    if (response.success) {
                        showResult(response.data.message, 'success');
                        setTimeout(function() {
                            loadSyncStatus();
                        }, 1000);
                    } else {
                        showResult('<?php _e('Erro ao regenerar tabelas:', 'bulbo-raiz'); ?> ' + response.data.message, 'error');
                    }
                }).fail(function() {
                    hideProgress();
                    showResult('<?php _e('Erro de conexão ao regenerar tabelas.', 'bulbo-raiz'); ?>', 'error');
                });
            }
            
            function runDiagnose() {
                const $btn = $('#btn-diagnose');
                const originalText = $btn.html();
                
                $btn.prop('disabled', true).html('<span class="dashicons dashicons-update spin"></span> <?php _e('Diagnosticando...', 'bulbo-raiz'); ?>');
                
                showProgress('<?php _e('Executando diagnóstico completo do sistema...', 'bulbo-raiz'); ?>');
                
                $.post(ajaxurl, {
                    action: 'bulbo_raiz_diagnose_and_fix',
                    nonce: bulbo_raiz_admin.nonce
                }, function(response) {
                    $btn.prop('disabled', false).html(originalText);
                    hideProgress();
                    
                    if (response.success) {
                        const report = response.data.report;
                        let html = '<div class="notice notice-success"><h3>🔧 Relatório de Diagnóstico</h3>';
                        
                        // Tabelas existentes
                        if (report.existing_tables && report.existing_tables.length > 0) {
                            html += '<h4>✅ Tabelas Encontradas:</h4><ul>';
                            report.existing_tables.forEach(function(table) {
                                html += '<li>' + table + '</li>';
                            });
                            html += '</ul>';
                        }
                        
                        // Tabelas corrigidas
                        if (report.fixed_tables && report.fixed_tables.length > 0) {
                            html += '<h4>🔧 Tabelas Corrigidas:</h4><ul>';
                            report.fixed_tables.forEach(function(table) {
                                html += '<li style="color: green;">' + table + ' - Criada com sucesso!</li>';
                            });
                            html += '</ul>';
                        }
                        
                        // Tabelas ainda em falta
                        if (report.still_missing && report.still_missing.length > 0) {
                            html += '<h4>❌ Tabelas Ainda em Falta:</h4><ul>';
                            report.still_missing.forEach(function(table) {
                                html += '<li style="color: red;">' + table + '</li>';
                            });
                            html += '</ul>';
                        }
                        
                        // Handlers AJAX
                        if (report.ajax_handlers && report.ajax_handlers.length > 0) {
                            html += '<h4>🔗 Handlers AJAX:</h4><ul>';
                            report.ajax_handlers.forEach(function(handler) {
                                html += '<li>' + handler + '</li>';
                            });
                            html += '</ul>';
                        }
                        
                        // Configuração da API
                        html += '<h4>🌐 Configuração da API:</h4>';
                        html += '<p>URL: ' + report.api_url + '</p>';
                        html += '<p>Configurada: ' + (report.api_configured ? '✅ Sim' : '❌ Não') + '</p>';
                        
                        // Cron jobs
                        if (report.cron_jobs && report.cron_jobs.length > 0) {
                            html += '<h4>⏰ Cron Jobs:</h4><ul>';
                            report.cron_jobs.forEach(function(job) {
                                html += '<li>' + job + '</li>';
                            });
                            html += '</ul>';
                        }
                        
                        html += '</div>';
                        
                        $('#sync-result').html(html).show();
                        
                        // Atualizar status se houve correções
                        if (report.fixed_tables && report.fixed_tables.length > 0) {
                            setTimeout(function() {
                                loadSyncStatus();
                            }, 2000);
                        }
                        
                    } else {
                        showResult('<?php _e('Erro no diagnóstico:', 'bulbo-raiz'); ?> ' + response.data.message, 'error');
                    }
                }).fail(function(xhr, status, error) {
                    $btn.prop('disabled', false).html(originalText);
                    hideProgress();
                    showResult('<?php _e('Erro de conexão durante diagnóstico:', 'bulbo-raiz'); ?> ' + error, 'error');
                });
            }
            
            function testSPButton() {
                console.log('🧪 TEST SP BUTTON: Starting test...');
                const $btn = $('#btn-test-sp');
                const originalText = $btn.html();
                
                $btn.prop('disabled', true).html('<span class="dashicons dashicons-update spin"></span> <?php _e('Testando...', 'bulbo-raiz'); ?>');
                
                console.log('🧪 TEST SP BUTTON: Sending AJAX request');
                console.log('🧪 TEST SP BUTTON: AJAX URL:', bulbo_raiz_admin.ajax_url);
                console.log('🧪 TEST SP BUTTON: Nonce:', bulbo_raiz_admin.nonce);
                
                $.post(bulbo_raiz_admin.ajax_url, {
                    action: 'bulbo_raiz_test_sp_button',
                    nonce: bulbo_raiz_admin.nonce
                }, function(response) {
                    console.log('🧪 TEST SP BUTTON: Response received:', response);
                    $btn.prop('disabled', false).html(originalText);
                    
                    if (response.success) {
                        console.log('🧪 TEST SP BUTTON: SUCCESS!');
                        showResult('✅ TESTE SUCESSO: ' + response.data.message, 'success');
                    } else {
                        console.log('🧪 TEST SP BUTTON: Failed:', response.data.message);
                        showResult('❌ TESTE FALHOU: ' + response.data.message, 'error');
                    }
                }).fail(function(xhr, status, error) {
                    console.log('🧪 TEST SP BUTTON: AJAX FAILED:', {xhr: xhr, status: status, error: error});
                    $btn.prop('disabled', false).html(originalText);
                    showResult('❌ ERRO DE CONEXÃO NO TESTE: ' + error, 'error');
                });
            }
            
            function clearCronJobs() {
                console.log('🚫 CLEAR CRON: Starting...');
                const $btn = $('#btn-clear-cron');
                const originalText = $btn.html();
                
                if (!confirm('🚫 Isso irá parar todas as requisições automáticas (cron jobs) do plugin. Deseja continuar?\n\nIsso pode ajudar a reduzir o número de requisições ao admin-ajax.php.')) {
                    return;
                }
                
                $btn.prop('disabled', true).html('<span class="dashicons dashicons-update spin"></span> <?php _e('Parando...', 'bulbo-raiz'); ?>');
                
                console.log('🚫 CLEAR CRON: Sending AJAX request');
                
                $.post(bulbo_raiz_admin.ajax_url, {
                    action: 'bulbo_raiz_clear_cron_jobs',
                    nonce: bulbo_raiz_admin.nonce
                }, function(response) {
                    console.log('🚫 CLEAR CRON: Response received:', response);
                    $btn.prop('disabled', false).html(originalText);
                    
                    if (response.success) {
                        console.log('🚫 CLEAR CRON: SUCCESS!');
                        let message = '✅ ' + response.data.message;
                        if (response.data.next_runs) {
                            message += '<br><br><strong>Status dos Cron Jobs:</strong><br>';
                            message += 'Process Queue: ' + response.data.next_runs.process_sync_queue + '<br>';
                            message += 'Cleanup Queue: ' + response.data.next_runs.cleanup_sync_queue;
                        }
                        showResult(message, 'success');
                        
                        // Parar monitoramento local também
                        stopMonitoring();
                    } else {
                        console.log('🚫 CLEAR CRON: Failed:', response.data.message);
                        showResult('❌ ERRO: ' + response.data.message, 'error');
                    }
                }).fail(function(xhr, status, error) {
                    console.log('🚫 CLEAR CRON: AJAX FAILED:', {xhr: xhr, status: status, error: error});
                    $btn.prop('disabled', false).html(originalText);
                    showResult('❌ ERRO DE CONEXÃO: ' + error, 'error');
                });
            }
            
            function startSmartSync(force) {
                showProgress('<?php _e('Iniciando sincronização inteligente...', 'bulbo-raiz'); ?>');
                
                $.post(ajaxurl, {
                    action: 'bulbo_raiz_smart_sync',
                    nonce: bulbo_raiz_admin.nonce,
                    force: force ? 'true' : 'false'
                }, function(response) {
                    hideProgress();
                    
                    if (response.success) {
                        const data = response.data;
                        
                        if (data.needs_sync === false) {
                            showResult(data.message, 'success');
                        } else {
                            showResult('<?php _e('Sincronização iniciada! Monitore o progresso abaixo.', 'bulbo-raiz'); ?>', 'success');
                            // Iniciar monitoramento automático
                            setTimeout(function() {
                                loadQueueStatus();
                                startMonitoring();
                            }, 1000);
                        }
                    } else {
                        showResult('<?php _e('Erro ao iniciar sincronização:', 'bulbo-raiz'); ?> ' + response.data.message, 'error');
                    }
                }).fail(function() {
                    hideProgress();
                    showResult('<?php _e('Erro de conexão ao iniciar sincronização.', 'bulbo-raiz'); ?>', 'error');
                });
            }
            
            function pauseSync() {
                $.post(ajaxurl, {
                    action: 'bulbo_raiz_pause_sync',
                    nonce: bulbo_raiz_admin.nonce
                }, function(response) {
                    if (response.success) {
                        showResult(response.data.message, 'success');
                        loadQueueStatus();
                    } else {
                        showResult('<?php _e('Erro ao pausar:', 'bulbo-raiz'); ?> ' + response.data.message, 'error');
                    }
                });
            }
            
            function resumeSync() {
                $.post(ajaxurl, {
                    action: 'bulbo_raiz_resume_sync',
                    nonce: bulbo_raiz_admin.nonce
                }, function(response) {
                    if (response.success) {
                        showResult(response.data.message, 'success');
                        loadQueueStatus();
                    } else {
                        showResult('<?php _e('Erro ao retomar:', 'bulbo-raiz'); ?> ' + response.data.message, 'error');
                    }
                });
            }
            
            function showProgress(message) {
                $('#sync-progress-message').text(message);
                $('#sync-progress').show();
                $('#sync-result').hide();
            }
            
            function hideProgress() {
                $('#sync-progress').hide();
            }
            
            function showResult(message, type) {
                const resultEl = $('#sync-result');
                const noticeEl = resultEl.find('.notice');
                
                noticeEl.removeClass('notice-success notice-error notice-warning');
                
                if (type === 'success') {
                    noticeEl.addClass('notice-success');
                } else if (type === 'error') {
                    noticeEl.addClass('notice-error');
                } else {
                    noticeEl.addClass('notice-warning');
                }
                
                $('#sync-result-message').html(message);
                resultEl.show();
                
                // Auto-hide after 10 seconds
                setTimeout(function() {
                    resultEl.fadeOut();
                }, 10000);
            }
        });
        </script>
        <?php
    }
    
    /**
     * Get plugin statistics
     */
    private function get_plugin_stats() {
        $stats = get_option('bulbo_raiz_stats', array(
            'forms_rendered' => 0,
            'leads_sent' => 0,
            'success_rate' => 0
        ));
        
        return $stats;
    }
}

// Initialize admin
new Bulbo_Raiz_Admin();

