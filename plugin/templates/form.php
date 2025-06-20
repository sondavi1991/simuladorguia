<?php
/**
 * Template do formulário Bulbo Raiz
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="bulbo-raiz-form-container" data-theme="<?php echo esc_attr($atts['theme']); ?>">
    <form id="bulbo-raiz-form" class="bulbo-raiz-form" method="post">
        <?php wp_nonce_field('bulbo_raiz_nonce', 'bulbo_raiz_nonce'); ?>
        
        <!-- Dropdown de Atendimento -->
        <div class="bulbo-raiz-field-group">
            <label for="bulbo_service_type" class="bulbo-raiz-label">
                Para qual das opções você deseja atendimento: ▼
            </label>
            <select id="bulbo_service_type" name="service_type" class="bulbo-raiz-select" required>
                <option value="">Selecione uma opção</option>
                <option value="cliente_final">Cliente Final</option>
                <option value="profissional">Terapeuta Capilar, Tricologista, Dermatologista, Cabeleireira (o)  ou Barbeiro</option>
                <option value="representante">Quero ser Representante</option>
            </select>
        </div>

        <!-- Nome -->
        <div class="bulbo-raiz-field-group">
            <label for="bulbo_name" class="bulbo-raiz-label">Nome:</label>
            <input type="text" 
                   id="bulbo_name" 
                   name="name" 
                   class="bulbo-raiz-input" 
                   placeholder="Nome completo"
                   required>
            <span class="bulbo-raiz-required">campo obrigatório</span>
        </div>

        <!-- Email -->
        <div class="bulbo-raiz-field-group">
            <label for="bulbo_email" class="bulbo-raiz-label">E-mail:</label>
            <input type="email" 
                   id="bulbo_email" 
                   name="email" 
                   class="bulbo-raiz-input" 
                   placeholder="Seu e-mail"
                   required>
            <span class="bulbo-raiz-required">campo obrigatório</span>
        </div>

        <!-- Telefone -->
        <div class="bulbo-raiz-field-group">
            <label for="bulbo_phone" class="bulbo-raiz-label">WhatsApp:</label>
            <input type="tel" 
                   id="bulbo_phone" 
                   name="phone" 
                   class="bulbo-raiz-input" 
                   placeholder="(00) 99999-9999"
                   required>
            <span class="bulbo-raiz-required">campo obrigatório</span>
        </div>

        <!-- Estado Federal -->
        <div class="bulbo-raiz-field-group">
            <label for="bulbo_state" class="bulbo-raiz-label">Estado Federal:</label>
            <select id="bulbo_state" 
                    name="state_id" 
                    class="bulbo-raiz-select" 
                    required>
                <option value="">Carregando estados...</option>
            </select>
            <span class="bulbo-raiz-required">campo obrigatório</span>
        </div>

        <!-- Cidade - Agora sempre visível mas inicialmente desabilitada -->
        <div class="bulbo-raiz-field-group" id="city-field-group">
            <label for="bulbo_city" class="bulbo-raiz-label">Cidade:</label>
            <select id="bulbo_city" 
                    name="city_id" 
                    class="bulbo-raiz-select"
                    disabled
                    required>
                <option value="">Selecione primeiro o estado</option>
            </select>
            <span class="bulbo-raiz-required">campo obrigatório</span>
        </div>

        <!-- Bairro - Nova interface de busca inteligente -->
        <div class="bulbo-raiz-field-group" id="neighborhood-field-group">
            <label for="bulbo_neighborhood_search" class="bulbo-raiz-label">Bairro:</label>
            <div id="neighborhood-search-container">
                <input type="text" 
                       id="bulbo_neighborhood_search" 
                       name="neighborhood_search" 
                       class="bulbo-raiz-input" 
                       placeholder="Digite o nome do seu bairro" 
                       disabled
                       autocomplete="off"
                       required>
                <div id="neighborhood-search-results" class="search-results-dropdown" style="display: none;"></div>
                <div id="neighborhood-not-found" style="display: none; margin-top: 8px;">
                    <p style="color: #666; font-size: 13px; margin: 5px 0;">
                        Nenhum bairro encontrado. 
                        <a href="#" id="manual-neighborhood-link" style="color: #0073aa; text-decoration: underline;">
                            Clique aqui para escrever o nome do seu bairro
                        </a>
                    </p>
                </div>
            </div>
            <!-- Campos ocultos para envio -->
            <input type="hidden" id="selected_neighborhood_id" name="neighborhood_id" value="">
            <input type="hidden" id="selected_neighborhood_name" name="neighborhood_custom" value="">
            <span class="bulbo-raiz-required">campo obrigatório</span>
            <small class="bulbo-raiz-help" id="neighborhood-help">
                <?php _e('Digite o nome do seu bairro.', 'bulbo-raiz'); ?>
            </small>
        </div>

        <!-- Botão Enviar -->
        <div class="bulbo-raiz-submit-wrapper">
            <button type="submit" class="bulbo-raiz-submit-btn" id="bulbo-submit-btn">
                <span class="bulbo-raiz-loading" style="display: none;">
                    <span class="bulbo-raiz-spinner"></span>
                    Processando...
                </span>
                <span class="bulbo-raiz-btn-text">Enviar</span>
            </button>
        </div>

        <!-- Área de Resultado -->
        <div class="bulbo-raiz-result" id="bulbo-result" style="display: none;">
            <!-- Resultado será inserido aqui via JavaScript -->
        </div>

        <!-- Área de Erro -->
        <div class="bulbo-raiz-error" id="bulbo-error" style="display: none;">
            <!-- Erros serão inseridos aqui via JavaScript -->
        </div>
    </form>

    <!-- Loading Overlay -->
    <div class="bulbo-raiz-overlay" id="bulbo-overlay" style="display: none;">
        <div class="bulbo-raiz-overlay-content">
            <div class="bulbo-raiz-spinner-large"></div>
            <p><?php _e('Buscando distribuidor na sua região...', 'bulbo-raiz'); ?></p>
        </div>
    </div>
</div>

<!-- Template para resultado de sucesso -->
<script type="text/template" id="bulbo-success-template">
    <div class="bulbo-raiz-success-card">
        <div class="bulbo-raiz-success-header">
            <span class="bulbo-raiz-success-icon">✅</span>
            <h4><?php _e('Distribuidor Encontrado!', 'bulbo-raiz'); ?></h4>
        </div>
        <div class="bulbo-raiz-actions" style="justify-content:center;">
            <a href="{{whatsapp_url}}" target="_blank" class="bulbo-raiz-whatsapp-btn">
                <span class="bulbo-raiz-whatsapp-logo">💬</span>
                <?php _e('Conversar no WhatsApp', 'bulbo-raiz'); ?>
            </a>
        </div>
        <div class="bulbo-raiz-success-footer">
            <p class="bulbo-raiz-success-message">
                <?php _e('Sua solicitação foi enviada! O distribuidor entrará em contato em breve.', 'bulbo-raiz'); ?>
            </p>
        </div>
    </div>
</script>

