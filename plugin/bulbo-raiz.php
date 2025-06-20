<?php
/**
 * Plugin Name: Bulbo Raiz - Sistema de Distribuidores
 * Plugin URI: https://bulboraiz.com.br
 * Description: Plugin WordPress que integra com o sistema Bulbo Raiz Laravel para encontrar distribuidores por localização geográfica e retornar WhatsApp automaticamente.
 * Version: 1.0.0
 * Author: Bulbo Raiz
 * Author URI: https://bulboraiz.com.br
 * Text Domain: bulbo-raiz
 * Domain Path: /languages
 * Requires at least: 5.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('BULBO_RAIZ_VERSION', '1.0.0');
define('BULBO_RAIZ_PLUGIN_FILE', __FILE__);
define('BULBO_RAIZ_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('BULBO_RAIZ_PLUGIN_BASENAME', plugin_basename(__FILE__));
define('BULBO_RAIZ_URL', plugin_dir_url(__FILE__));

// Load configuration
require_once BULBO_RAIZ_PLUGIN_DIR . 'bulbo-raiz-config.php';

/**
 * Main plugin class
 */
class Bulbo_Raiz_Plugin {
    
    private static $instance = null;
    
    /**
     * Get singleton instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        add_action('init', array($this, 'init'));
        add_action('plugins_loaded', array($this, 'load_textdomain'));
        
        // Activation, deactivation and uninstall hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        register_uninstall_hook(__FILE__, array('Bulbo_Raiz_Plugin', 'uninstall'));
        
        // Schedule cleanup if needed
        add_action('bulbo_raiz_cleanup_sync_queue', array($this, 'cleanup_sync_queue'));
        add_action('bulbo_raiz_process_sync_queue', array($this, 'process_sync_queue'));
    }
    
    /**
     * Initialize plugin
     */
    public function init() {
        // Load admin
        if (is_admin()) {
            require_once BULBO_RAIZ_PLUGIN_DIR . 'admin/admin.php';
        }
        
        // Register shortcode
        add_shortcode('bulbo_raiz_form', array($this, 'shortcode_form'));
        
        // Enqueue scripts and styles
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        
        // AJAX handlers
        add_action('wp_ajax_bulbo_raiz_get_states', array($this, 'ajax_get_states'));
        add_action('wp_ajax_nopriv_bulbo_raiz_get_states', array($this, 'ajax_get_states'));
        
        add_action('wp_ajax_bulbo_raiz_get_cities', array($this, 'ajax_get_cities'));
        add_action('wp_ajax_nopriv_bulbo_raiz_get_cities', array($this, 'ajax_get_cities'));
        
        add_action('wp_ajax_bulbo_raiz_get_neighborhoods', array($this, 'ajax_get_neighborhoods'));
        add_action('wp_ajax_nopriv_bulbo_raiz_get_neighborhoods', array($this, 'ajax_get_neighborhoods'));
        
        add_action('wp_ajax_bulbo_raiz_submit', array($this, 'ajax_submit_form'));
        add_action('wp_ajax_nopriv_bulbo_raiz_submit', array($this, 'ajax_submit_form'));
        
        // Admin AJAX handlers
        add_action('wp_ajax_bulbo_raiz_test_connection', array($this, 'ajax_test_connection'));
        add_action('wp_ajax_bulbo_raiz_clear_cache', array($this, 'ajax_clear_cache'));
        add_action('wp_ajax_bulbo_raiz_generate_token', array($this, 'ajax_generate_token'));
        add_action('wp_ajax_bulbo_raiz_refresh_token', array($this, 'ajax_refresh_token'));
        add_action('wp_ajax_bulbo_raiz_sync_geography', array($this, 'ajax_sync_geography'));
        add_action('wp_ajax_bulbo_raiz_get_sync_status', array($this, 'ajax_get_sync_status'));
        
        // New enhanced sync handlers
        add_action('wp_ajax_bulbo_raiz_clean_tables', array($this, 'ajax_clean_tables'));
        add_action('wp_ajax_bulbo_raiz_regenerate_tables', array($this, 'ajax_regenerate_tables'));
        add_action('wp_ajax_bulbo_raiz_smart_sync', array($this, 'ajax_smart_sync'));
        add_action('wp_ajax_bulbo_raiz_get_sync_queue_status', array($this, 'ajax_get_sync_queue_status'));
        add_action('wp_ajax_bulbo_raiz_pause_sync', array($this, 'ajax_pause_sync'));
        add_action('wp_ajax_bulbo_raiz_resume_sync', array($this, 'ajax_resume_sync'));
        add_action('wp_ajax_bulbo_raiz_sync_sp_neighborhoods', array($this, 'ajax_sync_sp_neighborhoods'));
        add_action('wp_ajax_bulbo_raiz_process_queue', array($this, 'ajax_process_queue'));
        
        // Test AJAX handler
        add_action('wp_ajax_bulbo_raiz_test_ajax', array($this, 'ajax_test_simple'));
        add_action('wp_ajax_nopriv_bulbo_raiz_test_ajax', array($this, 'ajax_test_simple'));
        
        // Schedule sync queue processing (reduced frequency to avoid overload)
        if (!wp_next_scheduled('bulbo_raiz_process_sync_queue')) {
            wp_schedule_event(time(), 'hourly', 'bulbo_raiz_process_sync_queue');
        }
    }
    
    /**
     * Load text domain
     */
    public function load_textdomain() {
        load_plugin_textdomain('bulbo-raiz', false, dirname(BULBO_RAIZ_PLUGIN_BASENAME) . '/languages');
    }
    
    /**
     * Enqueue scripts and styles
     */
    public function enqueue_scripts() {
        // Only load on pages with shortcode
        global $post;
        if (!is_a($post, 'WP_Post') || !has_shortcode($post->post_content, 'bulbo_raiz_form')) {
            return;
        }
        
        // CSS
        wp_enqueue_style('bulbo-raiz', BULBO_RAIZ_URL . 'assets/css/bulbo-raiz.css', array(), BULBO_RAIZ_VERSION);
        
        // JavaScript
        wp_enqueue_script('bulbo-raiz', BULBO_RAIZ_URL . 'assets/js/bulbo-raiz.js', array('jquery'), BULBO_RAIZ_VERSION, true);
        
        // Localize script
        wp_localize_script('bulbo-raiz', 'bulbo_raiz_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('bulbo_raiz_nonce'),
            'debug' => $this->get_option('enable_debug', false),
            'api_url' => $this->get_option('api_url', Bulbo_Raiz_Config::get_api_url())
        ));
    }
    
    /**
     * Shortcode handler
     */
    public function shortcode_form($atts) {
        // Default attributes
        $atts = shortcode_atts(array(
            'title' => $this->get_option('default_title', __('Encontre seu Distribuidor', 'bulbo-raiz')),
            'subtitle' => $this->get_option('default_subtitle', __('Preencha seus dados e encontre o distribuidor mais próximo', 'bulbo-raiz')),
            'button_text' => $this->get_option('default_button_text', __('Encontrar Distribuidor', 'bulbo-raiz')),
            'theme' => $this->get_option('theme', 'light'),
            'show_title' => 'true'
        ), $atts, 'bulbo_raiz_form');
        
        // Update stats
        $this->update_stat('forms_rendered');
        
        // Start output buffering
        ob_start();
        
        // Include template
        include BULBO_RAIZ_PLUGIN_DIR . 'templates/form.php';
        
        return ob_get_clean();
    }
    
    /**
     * AJAX: Get states (using local data)
     */
    public function ajax_get_states() {
        // Capturar qualquer output indesejado
        ob_start();
        
        if ($this->get_option('enable_debug', false)) {
            error_log('=== DEBUG AJAX GET STATES (LOCAL) ===');
            error_log('Carregando estados do banco local do WordPress');
        }
        
        check_ajax_referer('bulbo_raiz_nonce', 'nonce');
        
        global $wpdb;
        $states_table = $wpdb->prefix . 'bulbo_raiz_states';
        
        // Check if table exists and has data
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$states_table'") == $states_table;
        
        if (!$table_exists) {
            $unwanted_output = ob_get_clean();
            if ($this->get_option('enable_debug', false)) {
                error_log('Tabela de estados não existe - precisa sincronizar');
            }
            wp_send_json_error(array('message' => __('Dados não sincronizados. Por favor, sincronize na área administrativa.', 'bulbo-raiz')));
        }
        
        $states = $wpdb->get_results("SELECT id, name, code FROM $states_table ORDER BY name", ARRAY_A);
        
        if ($this->get_option('enable_debug', false)) {
            error_log('Estados encontrados no banco local: ' . count($states));
        }
        
        // Limpar qualquer output capturado
        $unwanted_output = ob_get_clean();
        if (!empty($unwanted_output) && $this->get_option('enable_debug', false)) {
            error_log('Output indesejado capturado: ' . $unwanted_output);
        }
        
        if ($states && count($states) > 0) {
            wp_send_json_success($states);
        } else {
            wp_send_json_error(array('message' => __('Nenhum estado encontrado. Sincronize os dados na área administrativa.', 'bulbo-raiz')));
        }
    }
    
    /**
     * AJAX: Get cities (always search mode - optimized)
     */
    public function ajax_get_cities() {
        // Capturar qualquer output indesejado
        ob_start();
        
        check_ajax_referer('bulbo_raiz_nonce', 'nonce');
        
        $state_id = intval($_POST['state_id']);
        $search = isset($_POST['search']) ? sanitize_text_field($_POST['search']) : '';
        
        if ($this->get_option('enable_debug', false)) {
            error_log('=== DEBUG AJAX GET CITIES (SEARCH ONLY) ===');
            error_log("State ID: {$state_id}, Search: '{$search}'");
        }
        
        if (!$state_id) {
            $unwanted_output = ob_get_clean();
            wp_send_json_error(array('message' => __('ID do estado inválido', 'bulbo-raiz')));
        }
        
        global $wpdb;
        $cities_table = $wpdb->prefix . 'bulbo_raiz_cities';
        
        // Verificar se tem busca (mínimo 3 caracteres)
        if (empty($search) || strlen($search) < 3) {
            // Sem busca ou busca muito curta - retornar instruções
            $total_cities = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM $cities_table WHERE state_id = %d",
                $state_id
            ));
            
            if ($this->get_option('enable_debug', false)) {
                error_log("No search term or too short. Total cities: {$total_cities}");
            }
            
            // Limpar qualquer output capturado
            $unwanted_output = ob_get_clean();
            
            wp_send_json_success(array(
                'cities' => array(),
                'total' => intval($total_cities),
                'search_required' => true,
                'message' => sprintf(__('Digite pelo menos 3 letras para buscar entre %d cidades', 'bulbo-raiz'), $total_cities)
            ));
        }
        
        // Cache de busca por 5 minutos
        $cache_key = "bulbo_raiz_cities_search_{$state_id}_" . md5($search);
        $cached_result = get_transient($cache_key);
        
        if ($cached_result !== false && !$this->get_option('enable_debug', false)) {
            $unwanted_output = ob_get_clean();
            wp_send_json_success($cached_result);
        }
        
        // Realizar busca otimizada sem REPLACEs custosos
        $search_term = '%' . $wpdb->esc_like($search) . '%';
        $search_lower = strtolower($search);
        $search_start = $search_lower . '%';
        
        // Query otimizada usando índices e evitando funções custosas
        $cities = $wpdb->get_results($wpdb->prepare(
            "SELECT id, name FROM $cities_table 
             WHERE state_id = %d 
             AND (
                 LOWER(name) LIKE %s 
                 OR name LIKE %s
             )
             ORDER BY 
               CASE 
                 WHEN LOWER(name) LIKE %s THEN 1
                 WHEN LOWER(name) LIKE %s THEN 2  
                 ELSE 3 
               END,
               CHAR_LENGTH(name),
               name 
             LIMIT 50",
            $state_id,
            $search_term,
            $search_term,
            $search_start,     // Prioridade 1: começa com o termo
            $search_term       // Prioridade 2: contém o termo
        ), ARRAY_A);
        
        // Se não encontrou nada com busca simples, tentar busca phonetic/aproximada
        if (empty($cities) && strlen($search) >= 4) {
            // Busca mais flexível para nomes com acentos
            $search_clean = $this->remove_accents($search);
            $search_clean_term = '%' . $wpdb->esc_like($search_clean) . '%';
            
            $cities = $wpdb->get_results($wpdb->prepare(
                "SELECT id, name FROM $cities_table 
                 WHERE state_id = %d 
                 AND LOWER(name) LIKE %s
                 ORDER BY CHAR_LENGTH(name), name 
                 LIMIT 20",
                $state_id,
                $search_clean_term
            ), ARRAY_A);
        }
        
        $result_data = array(
            'cities' => $cities,
            'search_term' => $search,
            'total_results' => count($cities),
            'message' => count($cities) > 0 
                ? sprintf(__('%d cidades encontradas para "%s"', 'bulbo-raiz'), count($cities), $search)
                : sprintf(__('Nenhuma cidade encontrada para "%s"', 'bulbo-raiz'), $search)
        );
        
        // Cache por 5 minutos
        set_transient($cache_key, $result_data, 5 * MINUTE_IN_SECONDS);
        
        if ($this->get_option('enable_debug', false)) {
            error_log("Search performed for '{$search}': " . count($cities) . " results");
        }
        
        // Limpar qualquer output capturado
        $unwanted_output = ob_get_clean();
        if (!empty($unwanted_output) && $this->get_option('enable_debug', false)) {
            error_log('Output indesejado capturado: ' . $unwanted_output);
        }
        
        wp_send_json_success($result_data);
    }
    
    /**
     * Remove acentos de forma eficiente
     */
    private function remove_accents($string) {
        $accents = array(
            'á' => 'a', 'à' => 'a', 'ã' => 'a', 'â' => 'a', 'ä' => 'a',
            'é' => 'e', 'ê' => 'e', 'ë' => 'e',
            'í' => 'i', 'î' => 'i', 'ï' => 'i',
            'ó' => 'o', 'ô' => 'o', 'õ' => 'o', 'ö' => 'o',
            'ú' => 'u', 'û' => 'u', 'ü' => 'u',
            'ç' => 'c',
            'Á' => 'A', 'À' => 'A', 'Ã' => 'A', 'Â' => 'A', 'Ä' => 'A',
            'É' => 'E', 'Ê' => 'E', 'Ë' => 'E',
            'Í' => 'I', 'Î' => 'I', 'Ï' => 'I',
            'Ó' => 'O', 'Ô' => 'O', 'Õ' => 'O', 'Ö' => 'O',
            'Ú' => 'U', 'Û' => 'U', 'Ü' => 'U',
            'Ç' => 'C'
        );
        
        return strtr($string, $accents);
    }
    
    /**
     * AJAX: Get neighborhoods (using local data)
     */
    public function ajax_get_neighborhoods() {
        // Capturar qualquer output indesejado
        ob_start();
        
        check_ajax_referer('bulbo_raiz_nonce', 'nonce');
        
        $city_id = intval($_POST['city_id']);
        $search_term = isset($_POST['search']) ? sanitize_text_field($_POST['search']) : '';
        
        if ($this->get_option('enable_debug', false)) {
            error_log('=== DEBUG AJAX GET NEIGHBORHOODS (LOCAL) ===');
            error_log('City ID recebido: ' . $city_id);
            error_log('Termo de busca: ' . $search_term);
            error_log('Carregando bairros do banco local do WordPress');
        }
        
        if (!$city_id) {
            $unwanted_output = ob_get_clean();
            wp_send_json_error(array('message' => __('ID da cidade inválido', 'bulbo-raiz')));
        }
        
        global $wpdb;
        $neighborhoods_table = $wpdb->prefix . 'bulbo_raiz_neighborhoods';
        
        // Query básica
        $query = "SELECT id, name FROM $neighborhoods_table WHERE city_id = %d";
        $query_params = array($city_id);
        
        // Se tem termo de busca, adicionar filtro LIKE
        if (!empty($search_term)) {
            $query .= " AND name LIKE %s";
            $query_params[] = '%' . $search_term . '%';
        }
        
        // Ordenar por relevância se há busca, senão alfabético
        if (!empty($search_term)) {
            // Priorizar resultados que começam com o termo, depois que contêm
            $query .= " ORDER BY 
                CASE 
                    WHEN name LIKE %s THEN 1 
                    WHEN name LIKE %s THEN 2 
                    ELSE 3 
                END, name";
            $query_params[] = $search_term . '%';     // Começa com
            $query_params[] = '%' . $search_term . '%'; // Contém
        } else {
            $query .= " ORDER BY name";
        }
        
        // Limitar resultados para performance
        $query .= " LIMIT 50";
        
        $neighborhoods = $wpdb->get_results($wpdb->prepare($query, $query_params), ARRAY_A);
        
        if ($this->get_option('enable_debug', false)) {
            error_log('Bairros encontrados no banco local: ' . count($neighborhoods));
            if (!empty($search_term)) {
                error_log('Filtrados pelo termo: ' . $search_term);
            }
        }
        
        // Limpar qualquer output capturado
        $unwanted_output = ob_get_clean();
        if (!empty($unwanted_output) && $this->get_option('enable_debug', false)) {
            error_log('Output indesejado capturado: ' . $unwanted_output);
        }
        
        // Sempre retorna sucesso, mesmo que array vazio (cidade sem bairros ou sem resultados para a busca)
        wp_send_json_success($neighborhoods);
    }
    
    /**
     * AJAX: Simple test
     */
    public function ajax_test_simple() {
        error_log('=== TESTE AJAX SIMPLES ===');
        
        // Teste 1: Resposta básica
        if (isset($_POST['test']) && $_POST['test'] === 'basic') {
            error_log('Teste básico - enviando resposta simples');
            wp_send_json_success(array('message' => 'AJAX funcionando!'));
            return;
        }
        
        // Teste 2: Dados simulados de estados
        if (isset($_POST['test']) && $_POST['test'] === 'states') {
            error_log('Teste estados - enviando dados simulados');
            $fake_states = array(
                array('id' => 1, 'name' => 'São Paulo', 'code' => 'SP'),
                array('id' => 2, 'name' => 'Rio de Janeiro', 'code' => 'RJ')
            );
            wp_send_json_success($fake_states);
            return;
        }
        
        // Teste 3: Requisição real para API
        if (isset($_POST['test']) && $_POST['test'] === 'api') {
            error_log('Teste API - fazendo requisição real');
            $states = $this->api_request('geography/states', null, 'GET', false);
            error_log('Resposta da API: ' . json_encode($states));
            
            if ($states) {
                wp_send_json_success(array('message' => 'API OK', 'count' => count($states)));
            } else {
                wp_send_json_error(array('message' => 'API falhou'));
            }
            return;
        }
        
        wp_send_json_error(array('message' => 'Parâmetro de teste inválido'));
    }
    
    /**
     * AJAX: Submit form
     */
    public function ajax_submit_form() {
        check_ajax_referer('bulbo_raiz_nonce', 'nonce');
        
        if ($this->get_option('enable_debug', false)) {
            error_log('Bulbo Raiz: Iniciando processamento do formulário');
        }
        
        // Get form data
        $form_data = $_POST['form_data'];
        
        if ($this->get_option('enable_debug', false)) {
            error_log('Bulbo Raiz: Dados recebidos: ' . json_encode($form_data));
        }
        
        // Validate required fields
        $required_fields = array('service_type', 'name', 'email', 'phone', 'state_id', 'city_id');
        foreach ($required_fields as $field) {
            if (empty($form_data[$field])) {
                if ($this->get_option('enable_debug', false)) {
                    error_log("Bulbo Raiz: Campo obrigatório ausente: {$field}");
                }
                wp_send_json_error(array('message' => sprintf(__('Campo %s é obrigatório', 'bulbo-raiz'), $field)));
            }
        }
        
        if ($this->get_option('enable_debug', false)) {
            error_log('Bulbo Raiz: Validação de campos obrigatórios passou');
        }
        
        // Buscar nome do estado e cidade no banco local
        global $wpdb;
        $states_table = $wpdb->prefix . 'bulbo_raiz_states';
        $cities_table = $wpdb->prefix . 'bulbo_raiz_cities';
        $neighborhoods_table = $wpdb->prefix . 'bulbo_raiz_neighborhoods';
        
        $state_name = $wpdb->get_var($wpdb->prepare("SELECT name FROM $states_table WHERE id = %d", $form_data['state_id']));
        $city_name = $wpdb->get_var($wpdb->prepare("SELECT name FROM $cities_table WHERE id = %d", $form_data['city_id']));
        
        if (!$state_name) $state_name = 'Estado não encontrado';
        if (!$city_name) $city_name = 'Cidade não encontrada';
        
        // Lógica inteligente para bairro
        $neighborhood_id = null;
        $neighborhood_name = null;
        
        // Se tem bairro personalizado, usar ele com prioridade
        if (!empty($form_data['neighborhood_custom'])) {
            $neighborhood_name = sanitize_text_field($form_data['neighborhood_custom']);
            
            // Tentar encontrar um bairro cadastrado que corresponda ao nome digitado
            $existing_neighborhood = $wpdb->get_row($wpdb->prepare(
                "SELECT id, name FROM $neighborhoods_table WHERE city_id = %d AND LOWER(name) LIKE LOWER(%s)",
                $form_data['city_id'],
                '%' . $neighborhood_name . '%'
            ));
            
            if ($existing_neighborhood) {
                $neighborhood_id = $existing_neighborhood->id;
                $neighborhood_name = $existing_neighborhood->name;
                if ($this->get_option('enable_debug', false)) {
                    error_log("Bulbo Raiz: Bairro personalizado encontrado no banco: ID {$neighborhood_id} - {$neighborhood_name}");
                }
            } else {
                if ($this->get_option('enable_debug', false)) {
                    error_log("Bulbo Raiz: Bairro personalizado não encontrado no banco, mantendo texto: {$neighborhood_name}");
                }
            }
        }
        // Se não tem bairro personalizado mas tem ID selecionado, usar o ID
        elseif (!empty($form_data['neighborhood_id'])) {
            $neighborhood_id = intval($form_data['neighborhood_id']);
            $neighborhood_name = $wpdb->get_var($wpdb->prepare("SELECT name FROM $neighborhoods_table WHERE id = %d", $neighborhood_id));
            if (!$neighborhood_name) {
                $neighborhood_name = 'Bairro ID ' . $neighborhood_id;
            }
            
            if ($this->get_option('enable_debug', false)) {
                error_log("Bulbo Raiz: Bairro selecionado da lista: ID {$neighborhood_id} - {$neighborhood_name}");
            }
        }
        
        if ($this->get_option('enable_debug', false)) {
            error_log("Bulbo Raiz: Resultado final bairro - ID: {$neighborhood_id}, Nome: {$neighborhood_name}");
        }
        
        // Sanitize data
        $data = array(
            'service_type' => sanitize_text_field($form_data['service_type']),
            'name' => sanitize_text_field($form_data['name']),
            'email' => sanitize_email($form_data['email']),
            'phone' => sanitize_text_field($form_data['phone']),
            'state_id' => intval($form_data['state_id']),
            'city_id' => intval($form_data['city_id']),
            'neighborhood_id' => $neighborhood_id,
            'neighborhood_custom' => !empty($form_data['neighborhood_custom']) ? sanitize_text_field($form_data['neighborhood_custom']) : null,
            'state' => $state_name,
            'city' => $city_name,
            'neighborhood' => $neighborhood_name,
            'source' => 'wordpress_plugin',
            'notes' => 'LEAD deseja atendimento para: ' . $this->get_service_type_label(sanitize_text_field($form_data['service_type']))
        );
        
        if ($this->get_option('enable_debug', false)) {
            error_log('Bulbo Raiz: Dados preparados para envio: ' . json_encode($data));
        }
        
        // Validate email
        if (!is_email($data['email'])) {
            if ($this->get_option('enable_debug', false)) {
                error_log('Bulbo Raiz: Email inválido: ' . $data['email']);
            }
            wp_send_json_error(array('message' => __('E-mail inválido', 'bulbo-raiz')));
        }
        
        if ($this->get_option('enable_debug', false)) {
            error_log('Bulbo Raiz: Iniciando criação do lead via API');
        }
        
        if ($this->get_option('enable_debug', false)) {
            error_log('Bulbo Raiz: Payload final enviado para API de leads: ' . json_encode($data));
        }
        // Create the lead first
        // Create lead via webhook (PUBLIC ROUTE - no auth needed)
        $lead_response = $this->api_request('leads/webhook', $data, 'POST', false);
        
        if ($this->get_option('enable_debug', false)) {
            error_log('Bulbo Raiz: Resposta da API para criação de lead: ' . json_encode($lead_response));
        }
        
        if (!$lead_response || !$lead_response['success']) {
            // Update stats
            $this->update_success_rate(false);
            
            $error_message = __('Erro ao cadastrar lead', 'bulbo-raiz');
            if ($lead_response && isset($lead_response['message'])) {
                $error_message = $lead_response['message'];
            }
            
            if ($this->get_option('enable_debug', false)) {
                error_log('Bulbo Raiz: Falha na criação do lead: ' . $error_message);
            }
            
            wp_send_json_error(array('message' => $error_message));
        }
        
        if ($this->get_option('enable_debug', false)) {
            error_log('Bulbo Raiz: Lead criado com sucesso, iniciando busca por distribuidor');
        }
        
        // Now search for distributor in the area
        $distributor_search = array(
            'state_id' => $data['state_id'],
            'city_id' => $data['city_id'],
            'neighborhood_id' => $neighborhood_id,
            'service_type' => $data['service_type']
        );
        
        if ($this->get_option('enable_debug', false)) {
            error_log('Bulbo Raiz: Dados para busca de distribuidor: ' . json_encode($distributor_search));
        }
        
        // Build query string for distributor search (GET request)
        $query_params = array();
        foreach ($distributor_search as $key => $value) {
            if ($value !== null) {
                $query_params[] = urlencode($key) . '=' . urlencode($value);
            }
        }
        $query_string = implode('&', $query_params);
        $search_endpoint = 'distributors/search?' . $query_string;
        
        if ($this->get_option('enable_debug', false)) {
            error_log('Bulbo Raiz: Endpoint de busca por distribuidor: ' . $search_endpoint);
        }
        
        // Search distributors (PUBLIC ROUTE - no auth needed)
        $distributor_response = $this->api_request($search_endpoint, null, 'GET', false);
        
        if ($this->get_option('enable_debug', false)) {
            error_log('Bulbo Raiz: Resposta da busca por distribuidor: ' . json_encode($distributor_response));
        }
        
        // Prepare response data
        $location_parts = array_filter(array($data['city'], $data['state']));
        $response_data = array(
            'message' => __('Lead cadastrado com sucesso!', 'bulbo-raiz'),
            'lead_id' => isset($lead_response['id']) ? $lead_response['id'] : null,
            'location' => implode(', ', $location_parts),
            'service_type' => $data['service_type'],
            // Adicionando dados do formulário para uso no JS
            'form_data' => array(
                'name' => $data['name'],
                'state_name' => $state_name,
                'city_name' => $city_name,
                'service_type_label' => $this->get_service_type_label($data['service_type'])
            )
        );
        
        // Check if distributor was found
        if ($distributor_response && $distributor_response['success']) {
            // A resposta da API tem a estrutura: { success: true, distributor: {...} }
            $distributor = null;
            
            if (isset($distributor_response['distributor'])) {
                $distributor = $distributor_response['distributor'];
            }
            
            if ($distributor) {
                // Extrair nome do distribuidor
                $distributor_name = isset($distributor['name']) ? $distributor['name'] : 'Distribuidor';
                
                // Extrair WhatsApp do distribuidor
                $distributor_whatsapp = isset($distributor['whatsapp']) ? $distributor['whatsapp'] : '';
                
                // Extrair área de cobertura
                $coverage_area = isset($distributor['coverage_area']) ? $distributor['coverage_area'] : $data['city'] . ', ' . $data['state'];
                
                $response_data['distributor'] = array(
                    'name' => $distributor_name,
                    'region' => $coverage_area
                );
                $response_data['whatsapp'] = $distributor_whatsapp;
                $response_data['message'] = __('Lead cadastrado e distribuidor encontrado!', 'bulbo-raiz');
                
                if ($this->get_option('enable_debug', false)) {
                    error_log('Bulbo Raiz: Distribuidor encontrado: ' . $distributor_name . ' - WhatsApp: ' . $distributor_whatsapp);
                }
            } else {
                if ($this->get_option('enable_debug', false)) {
                    error_log('Bulbo Raiz: Resposta de sucesso mas distribuidor não encontrado na estrutura de dados');
                }
                // Fallback para caso não consiga extrair o distribuidor
                $response_data['message'] = __('Lead cadastrado! Em breve nossa equipe entrará em contato.', 'bulbo-raiz');
                $response_data['whatsapp'] = $this->get_option('default_whatsapp', '');
                $response_data['distributor'] = array(
                    'name' => 'Equipe Bulbo Raiz',
                    'region' => 'Nacional'
                );
            }
        } else {
            // No distributor found - return generic contact info or message
            $response_data['message'] = __('Lead cadastrado! Em breve nossa equipe entrará em contato.', 'bulbo-raiz');
            $response_data['whatsapp'] = $this->get_option('default_whatsapp', '');
            $response_data['distributor'] = array(
                'name' => 'Equipe Bulbo Raiz',
                'region' => 'Nacional'
            );
            
            if ($this->get_option('enable_debug', false)) {
                error_log('Bulbo Raiz: Nenhum distribuidor encontrado, usando WhatsApp padrão');
            }
        }
        
        // Update stats
        $this->update_stat('leads_sent');
        $this->update_success_rate(true);
        
        if ($this->get_option('enable_debug', false)) {
            error_log('Bulbo Raiz: Processamento concluído com sucesso');
        }
        
        wp_send_json_success($response_data);
    }
    
    /**
     * AJAX: Test connection (SIMPLIFIED)
     */
    public function ajax_test_connection() {
        check_ajax_referer('bulbo_raiz_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Permissão negada', 'bulbo-raiz')));
        }
        
        $api_url = sanitize_url($_POST['api_url']);
        
        if (!$api_url) {
            wp_send_json_error(array('message' => __('URL da API é obrigatória', 'bulbo-raiz')));
        }
        
        // Test with simple geography/states route (no auth needed)
        $response = wp_remote_get($api_url . '/geography/states', array(
            'timeout' => 15,
            'headers' => array(
                'Accept' => 'application/json',
                'User-Agent' => 'BulboRaiz-WordPress-Plugin/' . BULBO_RAIZ_VERSION
            )
        ));
        
        if (is_wp_error($response)) {
            wp_send_json_error(array('message' => $response->get_error_message()));
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        if ($status_code !== 200) {
            wp_send_json_error(array('message' => sprintf(__('Erro HTTP %d - Servidor Laravel não acessível', 'bulbo-raiz'), $status_code)));
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (!$data || !is_array($data)) {
            wp_send_json_error(array('message' => __('Resposta inválida da API', 'bulbo-raiz')));
        }
        
        wp_send_json_success(array(
            'message' => sprintf(__('Conexão OK! %d estados encontrados.', 'bulbo-raiz'), count($data)),
            'states_count' => count($data)
        ));
    }
    
    /**
     * AJAX: Clear cache (admin)
     */
    public function ajax_clear_cache() {
        check_ajax_referer('bulbo_raiz_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Permissão negada', 'bulbo-raiz')));
        }
        
        // Clear all cached data
        global $wpdb;
        $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE 'bulbo_raiz_cache_%'");
        
        wp_send_json_success(array('message' => __('Cache limpo com sucesso', 'bulbo-raiz')));
    }
    
    /**
     * AJAX: Generate authentication token
     */
    public function ajax_generate_token() {
        if ($this->get_option('enable_debug', false)) {
            error_log('Bulbo Raiz: Iniciando geração de token');
        }
        
        check_ajax_referer('bulbo_raiz_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            error_log('Bulbo Raiz: Usuário sem permissão para gerar token');
            wp_send_json_error(array('message' => __('Permissão negada', 'bulbo-raiz')));
        }
        
        $email = sanitize_email($_POST['email']);
        $password = sanitize_text_field($_POST['password']);
        
        if ($this->get_option('enable_debug', false)) {
            error_log('Bulbo Raiz: Credenciais recebidas - Email: ' . $email . ', Senha: ' . (!empty($password) ? '[PRESENTE]' : '[VAZIA]'));
        }
        
        if (empty($email) || empty($password)) {
            error_log('Bulbo Raiz: Email ou senha vazios');
            wp_send_json_error(array('message' => __('Email e senha são obrigatórios', 'bulbo-raiz')));
        }
        
        // Validate email format
        if (!is_email($email)) {
            error_log('Bulbo Raiz: Email inválido: ' . $email);
            wp_send_json_error(array('message' => __('Email inválido', 'bulbo-raiz')));
        }
        
        $api_url = $this->get_option('api_url', 'http://localhost:8000/api');
        if ($this->get_option('enable_debug', false)) {
            error_log('Bulbo Raiz: URL da API: ' . $api_url);
        }
        
        $token_data = $this->authenticate_and_get_token($email, $password);
        
        if ($token_data) {
            // Update options with new token
            $options = get_option('bulbo_raiz_options', array());
            $options['api_token'] = $token_data['token'];
            $options['token_expires_at'] = $token_data['expires_at'];
            update_option('bulbo_raiz_options', $options);
            
            if ($this->get_option('enable_debug', false)) {
                error_log('Bulbo Raiz: Token gerado com sucesso');
            }
            
            wp_send_json_success(array(
                'message' => __('Token gerado com sucesso!', 'bulbo-raiz'),
                'token' => $token_data['token'],
                'expires_at' => $token_data['expires_at']
            ));
        } else {
            error_log('Bulbo Raiz: Falha na autenticação com as credenciais fornecidas');
            wp_send_json_error(array('message' => __('Falha na autenticação. Verifique suas credenciais e se o Laravel está rodando.', 'bulbo-raiz')));
        }
    }
    
    /**
     * AJAX: Refresh authentication token
     */
    public function ajax_refresh_token() {
        check_ajax_referer('bulbo_raiz_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Permissão negada', 'bulbo-raiz')));
        }
        
        $email = $this->get_option('api_email');
        $password = $this->get_option('api_password');
        
        if (empty($email) || empty($password)) {
            wp_send_json_error(array('message' => __('Credenciais não configuradas. Configure email e senha primeiro.', 'bulbo-raiz')));
        }
        
        $token_data = $this->authenticate_and_get_token($email, $password);
        
        if ($token_data) {
            // Update options with new token
            $options = get_option('bulbo_raiz_options', array());
            $options['api_token'] = $token_data['token'];
            $options['token_expires_at'] = $token_data['expires_at'];
            update_option('bulbo_raiz_options', $options);
            
            wp_send_json_success(array(
                'message' => __('Token renovado com sucesso!', 'bulbo-raiz'),
                'token' => $token_data['token'],
                'expires_at' => $token_data['expires_at']
            ));
        } else {
            wp_send_json_error(array('message' => __('Falha na renovação do token. Verifique suas credenciais.', 'bulbo-raiz')));
        }
    }
    
    /**
     * Authenticate with Laravel API and get token
     */
    private function authenticate_and_get_token($email, $password) {
        $api_url = $this->get_option('api_url', Bulbo_Raiz_Config::get_api_url());
        $url = rtrim($api_url, '/') . '/login';
        
        if ($this->get_option('enable_debug', false)) {
            error_log('Bulbo Raiz: Tentando autenticar em: ' . $url);
        }
        
        $args = array(
            'timeout' => 60,
            'headers' => array(
                'Accept' => 'application/json',
                'Content-Type' => 'application/json'
            ),
            'body' => json_encode(array(
                'email' => $email,
                'password' => $password
            )),
            'method' => 'POST'
        );
        
        if ($this->get_option('enable_debug', false)) {
            error_log('Bulbo Raiz: Dados da requisição: ' . json_encode(array(
                'url' => $url,
                'headers' => $args['headers'],
                'email' => $email
            )));
        }
        
        $response = wp_remote_request($url, $args);
        
        if (is_wp_error($response)) {
            $error_message = $response->get_error_message();
            error_log('Bulbo Raiz Auth Error: ' . $error_message);
            
            if ($this->get_option('enable_debug', false)) {
                error_log('Bulbo Raiz: Erro WP_Error detalhado: ' . print_r($response, true));
            }
            
            return false;
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        
        if ($this->get_option('enable_debug', false)) {
            error_log('Bulbo Raiz: Resposta da API - Status: ' . $status_code);
            error_log('Bulbo Raiz: Resposta da API - Body: ' . $body);
        }
        
        if ($status_code !== 200) {
            error_log("Bulbo Raiz Auth Error: HTTP {$status_code} - {$body}");
            
            // Try to decode error message
            $error_data = json_decode($body, true);
            if ($error_data && isset($error_data['message'])) {
                error_log('Bulbo Raiz: Mensagem de erro da API: ' . $error_data['message']);
            }
            
            return false;
        }
        
        $data = json_decode($body, true);
        
        if (!$data) {
            error_log('Bulbo Raiz Auth Error: Invalid JSON response - ' . $body);
            return false;
        }
        
        if (!isset($data['token'])) {
            error_log('Bulbo Raiz Auth Error: Token not found in response - ' . json_encode($data));
            return false;
        }
        
        // Calculate expiration time (Laravel Sanctum tokens don't have expiration by default)
        // We'll set a reasonable expiration time
        $expires_at = date('Y-m-d\TH:i', strtotime('+30 days'));
        
        if ($this->get_option('enable_debug', false)) {
            error_log('Bulbo Raiz: Token gerado com sucesso. Expira em: ' . $expires_at);
        }
        
        return array(
            'token' => $data['token'],
            'expires_at' => $expires_at
        );
    }
    
    /**
     * Make API request - VERSÃO SIMPLES COM LOGIN AUTOMÁTICO
     */
    /**
     * API request with Bearer token authentication (same as frontend)
     */
    private function api_request($endpoint, $data = null, $method = 'GET', $require_auth = true) {
        $api_url = $this->get_option('api_url', Bulbo_Raiz_Config::get_api_url());
        $url = rtrim($api_url, '/') . '/' . ltrim($endpoint, '/');
        
        $args = array(
            'timeout' => 30,
            'method' => $method,
            'headers' => array(
                'Accept' => 'application/json',
                'Content-Type' => 'application/json'
            )
        );
        
        // Add Bearer token if authentication is required
        if ($require_auth) {
            $token = $this->get_valid_token();
            if (!$token) {
                if ($this->get_option('enable_debug', false)) {
                    error_log("Bulbo Raiz: Não foi possível obter token válido para a requisição");
                }
                return false;
            }
            $args['headers']['Authorization'] = 'Bearer ' . $token;
        }
        
        if ($method === 'POST' && $data) {
            $args['body'] = json_encode($data);
        }
        
        if ($this->get_option('enable_debug', false)) {
            error_log("Bulbo Raiz: Fazendo requisição para: " . $url);
            error_log("Bulbo Raiz: Method: " . $method);
            error_log("Bulbo Raiz: Require Auth: " . ($require_auth ? 'true' : 'false'));
            error_log("Bulbo Raiz: Has Token: " . ($require_auth && !empty($args['headers']['Authorization']) ? 'true' : 'false'));
        }
        
        $response = wp_remote_request($url, $args);
        
        if (is_wp_error($response)) {
            if ($this->get_option('enable_debug', false)) {
                error_log("Bulbo Raiz API Error: " . $response->get_error_message());
            }
            return false;
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        
        if ($this->get_option('enable_debug', false)) {
            error_log("Bulbo Raiz: Resposta - Status: " . $status_code);
        }
        
        // Handle 401 Unauthorized - token might be expired
        if ($status_code === 401 && $require_auth) {
            if ($this->get_option('enable_debug', false)) {
                error_log("Bulbo Raiz: Token expirado, tentando renovar...");
            }
            
            // Try to refresh token
            if ($this->refresh_token_if_possible()) {
                // Retry the request with new token
                $token = $this->get_option('api_token');
                if ($token) {
                    $args['headers']['Authorization'] = 'Bearer ' . $token;
                    $response = wp_remote_request($url, $args);
                    $status_code = wp_remote_retrieve_response_code($response);
                    $body = wp_remote_retrieve_body($response);
                }
            }
        }
        
        if ($status_code >= 200 && $status_code < 300) {
            $decoded = json_decode($body, true);
            return $decoded ? $decoded : array();
        }
        
        if ($this->get_option('enable_debug', false)) {
            error_log("Bulbo Raiz API Error: HTTP {$status_code} - {$body}");
        }
        
        return false;
    }
    
    /**
     * Get a valid authentication token
     */
    private function get_valid_token() {
        $token = $this->get_option('api_token');
        
        // If no token or token is expired, try to get a new one
        if (!$token || $this->is_token_expired()) {
            if ($this->get_option('enable_debug', false)) {
                error_log("Bulbo Raiz: Token não existe ou expirado, tentando obter novo token...");
            }
            
            if (!$this->refresh_token_if_possible()) {
                return false;
            }
            
            $token = $this->get_option('api_token');
        }
        
        return $token;
    }
    
    /**
     * Check if current token is expired
     */
    private function is_token_expired() {
        $expires_at = $this->get_option('token_expires_at', '');
        if (!$expires_at) {
            return false; // No expiration set, assume it's valid
        }
        
        return strtotime($expires_at) < time();
    }
    
    /**
     * Try to refresh token if credentials are available
     */
    private function refresh_token_if_possible() {
        $email = $this->get_option('api_email');
        $password = $this->get_option('api_password');
        
        if (empty($email) || empty($password)) {
            return false;
        }
        
        $token_data = $this->authenticate_and_get_token($email, $password);
        
        if ($token_data) {
            $options = get_option('bulbo_raiz_options', array());
            $options['api_token'] = $token_data['token'];
            $options['token_expires_at'] = $token_data['expires_at'];
            update_option('bulbo_raiz_options', $options);
            return true;
        }
        
        return false;
    }
    
    /**
     * Get cached data
     */
    private function get_cached_data($key, $callback) {
        $cache_duration = intval($this->get_option('cache_duration', 60));
        
        if ($cache_duration <= 0) {
            return $callback();
        }
        
        $cache_key = 'bulbo_raiz_cache_' . $key;
        $cached = get_transient($cache_key);
        
        if ($cached !== false) {
            return $cached;
        }
        
        $data = $callback();
        
        if ($data) {
            set_transient($cache_key, $data, $cache_duration * 60);
        }
        
        return $data;
    }
    
    /**
     * Get plugin option
     */
    private function get_option($key, $default = '') {
        $options = get_option('bulbo_raiz_options', array());
        
        // Forçar debug temporariamente para diagnosticar problema
        if ($key === 'enable_debug') {
            return true;
        }
        
        return isset($options[$key]) ? $options[$key] : $default;
    }
    
    /**
     * Update statistics
     */
    private function update_stat($stat) {
        $stats = get_option('bulbo_raiz_stats', array(
            'forms_rendered' => 0,
            'leads_sent' => 0,
            'success_rate' => 0
        ));
        
        $stats[$stat] = intval($stats[$stat]) + 1;
        update_option('bulbo_raiz_stats', $stats);
    }
    
    /**
     * Update success rate
     */
    private function update_success_rate($success) {
        $stats = get_option('bulbo_raiz_stats', array(
            'forms_rendered' => 0,
            'leads_sent' => 0,
            'success_rate' => 0,
            'total_attempts' => 0,
            'successful_attempts' => 0
        ));
        
        $stats['total_attempts'] = intval($stats['total_attempts']) + 1;
        
        if ($success) {
            $stats['successful_attempts'] = intval($stats['successful_attempts']) + 1;
        }
        
        if ($stats['total_attempts'] > 0) {
            $stats['success_rate'] = round(($stats['successful_attempts'] / $stats['total_attempts']) * 100);
        }
        
        update_option('bulbo_raiz_stats', $stats);
    }
    
    /**
     * Plugin activation
     */
    public function activate() {
        global $wpdb;
        
        // Set default options
        $default_options = array(
            'api_url' => 'http://localhost:8000/api',
            'api_token' => '',
            'api_email' => '',
            'api_password' => '',
            'token_expires_at' => '',
            'wp_api_key' => '',
            'default_title' => __('Encontre seu Distribuidor', 'bulbo-raiz'),
            'default_subtitle' => __('Preencha seus dados e encontre o distribuidor mais próximo', 'bulbo-raiz'),
            'default_button_text' => __('Encontrar Distribuidor', 'bulbo-raiz'),
            'default_whatsapp' => '',
            'theme' => 'light',
            'enable_debug' => false,
            'cache_duration' => 60,
            'last_sync' => '',
            'sync_version' => '1.0'
        );
        
        add_option('bulbo_raiz_options', $default_options);
        
        // Initialize stats
        add_option('bulbo_raiz_stats', array(
            'forms_rendered' => 0,
            'leads_sent' => 0,
            'success_rate' => 0,
            'total_attempts' => 0,
            'successful_attempts' => 0
        ));
        
        // Create local geography tables
        $this->create_geography_tables();
        
        // Force check if all tables exist - this fixes the missing sync_queue table issue
        $required_tables = array(
            $wpdb->prefix . 'bulbo_raiz_sync_queue',
            $wpdb->prefix . 'bulbo_raiz_sync_monitor'
        );
        
        $missing_tables = array();
        foreach ($required_tables as $table) {
            $table_exists = $wpdb->get_var("SHOW TABLES LIKE '{$table}'");
            if (!$table_exists) {
                $missing_tables[] = $table;
            }
        }
        
        if (!empty($missing_tables)) {
            error_log('Bulbo Raiz Plugin: Missing critical tables detected during activation: ' . implode(', ', $missing_tables) . '. Recreating...');
            $this->create_geography_tables();
            
            // Verify again
            foreach ($missing_tables as $table) {
                $table_exists = $wpdb->get_var("SHOW TABLES LIKE '{$table}'");
                if ($table_exists) {
                    error_log('Bulbo Raiz Plugin: Successfully created table: ' . $table);
                } else {
                    error_log('Bulbo Raiz Plugin ERROR: Failed to create table: ' . $table);
                }
            }
        }
        
        error_log('Bulbo Raiz Plugin activated successfully');
    }
    
    /**
     * Create local tables for geography data
     */
    private function create_geography_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        // Table for states
        $states_table = $wpdb->prefix . 'bulbo_raiz_states';
        $sql_states = "CREATE TABLE $states_table (
            id bigint(20) NOT NULL,
            name varchar(100) NOT NULL,
            code varchar(2) NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY unique_code (code),
            KEY idx_name (name)
        ) $charset_collate;";
        
        // Table for cities
        $cities_table = $wpdb->prefix . 'bulbo_raiz_cities';
        $sql_cities = "CREATE TABLE $cities_table (
            id bigint(20) NOT NULL,
            name varchar(150) NOT NULL,
            state_id bigint(20) NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_state_id (state_id),
            KEY idx_name (name),
            KEY idx_state_name (state_id, name)
        ) $charset_collate;";
        
        // Table for neighborhoods
        $neighborhoods_table = $wpdb->prefix . 'bulbo_raiz_neighborhoods';
        $sql_neighborhoods = "CREATE TABLE $neighborhoods_table (
            id bigint(20) NOT NULL,
            name varchar(150) NOT NULL,
            city_id bigint(20) NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_city_id (city_id),
            KEY idx_name (name),
            KEY idx_city_name (city_id, name)
        ) $charset_collate;";
        
        // Table for sync control
        $sync_table = $wpdb->prefix . 'bulbo_raiz_sync_log';
        $sql_sync = "CREATE TABLE $sync_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            entity_type varchar(50) NOT NULL,
            total_records int(11) NOT NULL DEFAULT 0,
            sync_status varchar(20) NOT NULL DEFAULT 'pending',
            sync_message text,
            started_at datetime DEFAULT CURRENT_TIMESTAMP,
            completed_at datetime NULL,
            PRIMARY KEY (id),
            KEY idx_entity_type (entity_type),
            KEY idx_sync_status (sync_status),
            KEY idx_started_at (started_at)
        ) $charset_collate;";
        
        // New table for sync queue system
        $queue_table = $wpdb->prefix . 'bulbo_raiz_sync_queue';
        $sql_queue = "CREATE TABLE $queue_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            queue_type enum('states', 'cities', 'neighborhoods') NOT NULL,
            entity_id bigint(20) NULL,
            parent_id bigint(20) NULL,
            priority int(11) NOT NULL DEFAULT 0,
            status enum('pending', 'processing', 'completed', 'failed', 'paused') NOT NULL DEFAULT 'pending',
            attempts int(11) NOT NULL DEFAULT 0,
            max_attempts int(11) NOT NULL DEFAULT 3,
            error_message text NULL,
            data longtext NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            processed_at datetime NULL,
            PRIMARY KEY (id),
            KEY idx_queue_type (queue_type),
            KEY idx_status (status),
            KEY idx_priority (priority),
            KEY idx_created_at (created_at),
            KEY idx_parent_id (parent_id),
            KEY idx_compound (queue_type, status, priority)
        ) $charset_collate;";
        
        // New table for sync monitoring
        $monitor_table = $wpdb->prefix . 'bulbo_raiz_sync_monitor';
        $sql_monitor = "CREATE TABLE $monitor_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            sync_session_id varchar(50) NOT NULL,
            entity_type varchar(50) NOT NULL,
            entity_id bigint(20) NULL,
            action varchar(50) NOT NULL,
            status enum('started', 'completed', 'failed', 'skipped') NOT NULL,
            message text NULL,
            execution_time_ms int(11) NULL,
            memory_usage_mb decimal(10,2) NULL,
            api_response_code int(11) NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_session_id (sync_session_id),
            KEY idx_entity_type (entity_type),
            KEY idx_status (status),
            KEY idx_created_at (created_at)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        
        dbDelta($sql_states);
        dbDelta($sql_cities);
        dbDelta($sql_neighborhoods);
        dbDelta($sql_sync);
        dbDelta($sql_queue);
        dbDelta($sql_monitor);
        
        if ($this->get_option('enable_debug', false)) {
            error_log('Bulbo Raiz: Tabelas de geografia e sistema de filas criadas com sucesso');
        }
        
        // Create cron schedule if not exists (reduced frequency)
        if (!wp_get_schedule('bulbo_raiz_process_sync_queue')) {
            wp_schedule_event(time(), 'hourly', 'bulbo_raiz_process_sync_queue');
        }
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Clear cache
        global $wpdb;
        $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE 'bulbo_raiz_cache_%'");
        
        // Clear cron jobs
        wp_clear_scheduled_hook('bulbo_raiz_process_sync_queue');
        wp_clear_scheduled_hook('bulbo_raiz_cleanup_sync_queue');
    }
    
    /**
     * Plugin uninstall - remove all plugin data
     */
    public static function uninstall() {
        global $wpdb;
        
        // Get all table names
        $tables = array(
            $wpdb->prefix . 'bulbo_raiz_states',
            $wpdb->prefix . 'bulbo_raiz_cities', 
            $wpdb->prefix . 'bulbo_raiz_neighborhoods',
            $wpdb->prefix . 'bulbo_raiz_sync_log',
            $wpdb->prefix . 'bulbo_raiz_sync_queue',
            $wpdb->prefix . 'bulbo_raiz_sync_monitor'
        );
        
        // Drop all tables
        foreach ($tables as $table) {
            $wpdb->query("DROP TABLE IF EXISTS `{$table}`");
        }
        
        // Remove all plugin options
        $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE 'bulbo_raiz_%'");
        
        // Clean up scheduled events
        wp_clear_scheduled_hook('bulbo_raiz_process_sync_queue');
        wp_clear_scheduled_hook('bulbo_raiz_cleanup_sync_queue');
    }
    
    /**
     * AJAX: Clean all geography tables
     */
    public function ajax_clean_tables() {
        check_ajax_referer('bulbo_raiz_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Permissão negada', 'bulbo-raiz')));
        }
        
        global $wpdb;
        
        try {
            $tables = array(
                $wpdb->prefix . 'bulbo_raiz_states',
                $wpdb->prefix . 'bulbo_raiz_cities',
                $wpdb->prefix . 'bulbo_raiz_neighborhoods',
                $wpdb->prefix . 'bulbo_raiz_sync_queue',
                $wpdb->prefix . 'bulbo_raiz_sync_monitor'
            );
            
            $cleaned_records = 0;
            
            foreach ($tables as $table) {
                $count = $wpdb->get_var("SELECT COUNT(*) FROM `{$table}`");
                $wpdb->query("TRUNCATE TABLE `{$table}`");
                $cleaned_records += intval($count);
            }
            
            // Clear sync counters and status
            delete_option('bulbo_raiz_current_sync_id');
            delete_option('bulbo_raiz_sync_counters');
            delete_option('bulbo_raiz_sync_session_id');
            
            // Update last action
            $options = get_option('bulbo_raiz_options', array());
            $options['last_sync'] = '';
            $options['last_clean'] = current_time('mysql');
            update_option('bulbo_raiz_options', $options);
            
            wp_send_json_success(array(
                'message' => sprintf(__('Tabelas limpas com sucesso! %d registros removidos.', 'bulbo-raiz'), $cleaned_records),
                'cleaned_records' => $cleaned_records
            ));
            
        } catch (Exception $e) {
            error_log('Bulbo Raiz Clean Tables Error: ' . $e->getMessage());
            wp_send_json_error(array('message' => 'Erro ao limpar tabelas: ' . $e->getMessage()));
        }
    }
    
    /**
     * AJAX: Regenerate all tables
     */
    public function ajax_regenerate_tables() {
        check_ajax_referer('bulbo_raiz_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Permissão negada', 'bulbo-raiz')));
        }
        
        try {
            // First clean all tables
            global $wpdb;
            
            $tables = array(
                $wpdb->prefix . 'bulbo_raiz_states',
                $wpdb->prefix . 'bulbo_raiz_cities',
                $wpdb->prefix . 'bulbo_raiz_neighborhoods',
                $wpdb->prefix . 'bulbo_raiz_sync_log',
                $wpdb->prefix . 'bulbo_raiz_sync_queue',
                $wpdb->prefix . 'bulbo_raiz_sync_monitor'
            );
            
            // Drop tables
            foreach ($tables as $table) {
                $wpdb->query("DROP TABLE IF EXISTS `{$table}`");
            }
            
            // Recreate tables
            $this->create_geography_tables();
            
            // Clear options
            delete_option('bulbo_raiz_current_sync_id');
            delete_option('bulbo_raiz_sync_counters');
            delete_option('bulbo_raiz_sync_session_id');
            
            // Update options
            $options = get_option('bulbo_raiz_options', array());
            $options['last_sync'] = '';
            $options['last_regenerate'] = current_time('mysql');
            update_option('bulbo_raiz_options', $options);
            
            wp_send_json_success(array(
                'message' => __('Tabelas regeneradas com sucesso! Pronto para nova sincronização.', 'bulbo-raiz')
            ));
            
        } catch (Exception $e) {
            error_log('Bulbo Raiz Regenerate Tables Error: ' . $e->getMessage());
            wp_send_json_error(array('message' => 'Erro ao regenerar tabelas: ' . $e->getMessage()));
        }
    }
    
    /**
     * Get geography name by ID (helper method)
     */
    private function get_geography_name($type, $id) {
        if (!$id) return null;
        
        $endpoint = "geography/{$type}/{$id}";
        $response = $this->api_request($endpoint);
        
        if ($response && isset($response['name'])) {
            return $response['name'];
        }
        
        return null;
    }
    
    /**
     * AJAX: Sync geography data from Laravel API
     */
    public function ajax_sync_geography() {
        check_ajax_referer('bulbo_raiz_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Permissão negada', 'bulbo-raiz')));
        }
        
        $force_sync = isset($_POST['force']) && $_POST['force'] === 'true';
        $batch_step = isset($_POST['step']) ? sanitize_text_field($_POST['step']) : 'start';
        $state_id = isset($_POST['state_id']) ? intval($_POST['state_id']) : 0;
        
        if ($this->get_option('enable_debug', false)) {
            error_log("=== SYNC GEOGRAPHY BATCH ===");
            error_log("Step: {$batch_step}, State ID: {$state_id}, Force: " . ($force_sync ? 'true' : 'false'));
        }
        
        switch ($batch_step) {
            case 'start':
                $result = $this->start_sync_process($force_sync);
                break;
            case 'sync_states':
                $result = $this->sync_states_batch();
                break;
            case 'sync_cities':
                $result = $this->sync_cities_batch($state_id);
                break;
            case 'sync_neighborhoods':
                $result = $this->sync_neighborhoods_batch($state_id);
                break;
            case 'complete':
                $result = $this->complete_sync_process();
                break;
            default:
                $result = array('success' => false, 'message' => 'Step inválido');
        }
        
        if ($result['success']) {
            wp_send_json_success($result);
        } else {
            wp_send_json_error($result);
        }
    }
    
    /**
     * Start sync process
     */
    private function start_sync_process($force_sync = false) {
        global $wpdb;
        
        $sync_table = $wpdb->prefix . 'bulbo_raiz_sync_log';
        
        try {
            // Increase execution time and memory
            @ini_set('max_execution_time', 300); // 5 minutes
            @ini_set('memory_limit', '512M');
            
            // Clear existing sync logs older than 7 days
            $wpdb->query("DELETE FROM $sync_table WHERE started_at < DATE_SUB(NOW(), INTERVAL 7 DAY)");
            
            // Start new sync log
            $sync_id = $wpdb->insert($sync_table, array(
                'entity_type' => 'full_sync',
                'sync_status' => 'running',
                'sync_message' => 'Iniciando sincronização por lotes',
                'started_at' => current_time('mysql')
            ));
            
            if (!$sync_id) {
                throw new Exception('Falha ao criar log de sincronização');
            }
            
            // Store sync_id for tracking
            update_option('bulbo_raiz_current_sync_id', $sync_id);
            
            // Initialize counters
            update_option('bulbo_raiz_sync_counters', array(
                'states' => 0,
                'cities' => 0,
                'neighborhoods' => 0,
                'states_processed' => 0,
                'total_states' => 0,
                'current_state' => '',
                'errors' => array()
            ));
            
            if ($this->get_option('enable_debug', false)) {
                error_log("Sync process started with ID: {$sync_id}");
            }
            
            return array(
                'success' => true,
                'message' => 'Sincronização iniciada',
                'next_step' => 'sync_states',
                'progress' => 0,
                'sync_id' => $sync_id
            );
            
        } catch (Exception $e) {
            error_log('Bulbo Raiz Sync Error: ' . $e->getMessage());
            return array(
                'success' => false,
                'message' => 'Erro ao iniciar sincronização: ' . $e->getMessage()
            );
        }
    }
    
    /**
     * Sync states in batch
     */
    private function sync_states_batch() {
        global $wpdb;
        
        try {
            $states_table = $wpdb->prefix . 'bulbo_raiz_states';
            $counters = get_option('bulbo_raiz_sync_counters', array());
            
            if ($this->get_option('enable_debug', false)) {
                error_log("Starting states sync batch");
            }
            
            // Get states from API - USANDO ROTA PÚBLICA (SEM AUTH)
            $api_states = $this->api_request('geography/states', null, 'GET', false);
            
            if (!$api_states || !is_array($api_states)) {
                throw new Exception('Não foi possível obter estados da API');
            }
            
            if ($this->get_option('enable_debug', false)) {
                error_log("API returned " . count($api_states) . " states");
            }
            
            // Clear existing states if this is the first run
            if ($counters['states'] === 0) {
                $wpdb->query("TRUNCATE TABLE $states_table");
                if ($this->get_option('enable_debug', false)) {
                    error_log("States table truncated");
                }
            }
            
            $inserted = 0;
            $errors = array();
            
            foreach ($api_states as $state) {
                if (!isset($state['id'], $state['name'])) {
                    $errors[] = 'Estado inválido: ' . json_encode($state);
                    continue;
                }
                
                $result = $wpdb->insert($states_table, array(
                    'id' => intval($state['id']),
                    'name' => sanitize_text_field($state['name']),
                    'code' => sanitize_text_field($state['code'] ?? ''),
                    'created_at' => current_time('mysql'),
                    'updated_at' => current_time('mysql')
                ));
                
                if ($result === false) {
                    $errors[] = "Erro ao inserir estado {$state['name']}: " . $wpdb->last_error;
                } else {
                    $inserted++;
                }
            }
            
            // Verify insertion
            $total_states_in_db = $wpdb->get_var("SELECT COUNT(*) FROM $states_table");
            
            if ($this->get_option('enable_debug', false)) {
                error_log("States inserted: {$inserted}, Total in DB: {$total_states_in_db}, Errors: " . count($errors));
            }
            
            // Update counters
            $counters['states'] = intval($total_states_in_db);
            $counters['total_states'] = intval($total_states_in_db);
            $counters['errors'] = array_merge($counters['errors'] ?? array(), $errors);
            update_option('bulbo_raiz_sync_counters', $counters);
            
            if ($total_states_in_db === 0) {
                throw new Exception('Nenhum estado foi inserido no banco de dados');
            }
            
            // Get first state for next step
            $first_state = $wpdb->get_row("SELECT id, name FROM $states_table ORDER BY name LIMIT 1");
            
            return array(
                'success' => true,
                'message' => "Sincronizados {$inserted} estados (Total: {$total_states_in_db})",
                'next_step' => 'sync_cities',
                'state_id' => $first_state->id,
                'state_name' => $first_state->name,
                'progress' => 10,
                'stats' => array(
                    'states' => $total_states_in_db,
                    'cities' => 0,
                    'neighborhoods' => 0
                )
            );
            
        } catch (Exception $e) {
            error_log('Bulbo Raiz States Sync Error: ' . $e->getMessage());
            return array(
                'success' => false,
                'message' => 'Erro ao sincronizar estados: ' . $e->getMessage()
            );
        }
    }
    
    /**
     * Sync cities for one state at a time
     */
    private function sync_cities_batch($state_id) {
        global $wpdb;
        
        try {
            $states_table = $wpdb->prefix . 'bulbo_raiz_states';
            $cities_table = $wpdb->prefix . 'bulbo_raiz_cities';
            
            $counters = get_option('bulbo_raiz_sync_counters', array());
            
            if (!$state_id) {
                throw new Exception('ID do estado não fornecido');
            }
            
            // Get state info
            $state = $wpdb->get_row($wpdb->prepare(
                "SELECT id, name FROM $states_table WHERE id = %d",
                $state_id
            ));
            
            if (!$state) {
                throw new Exception("Estado com ID {$state_id} não encontrado");
            }
            
            if ($this->get_option('enable_debug', false)) {
                error_log("Syncing cities for state: {$state->name} (ID: {$state_id})");
            }
            
            // Get cities from API - USANDO ROTA PÚBLICA (SEM AUTH)
            $api_cities = $this->api_request("geography/cities?state_id=" . $state_id, null, 'GET', false);
            
            if (!is_array($api_cities)) {
                if ($this->get_option('enable_debug', false)) {
                    error_log("No cities returned for state {$state->name} or API error");
                }
                $api_cities = array(); // Estado sem cidades é válido
            }
            
            if ($this->get_option('enable_debug', false)) {
                error_log("API returned " . count($api_cities) . " cities for {$state->name}");
            }
            
            $inserted = 0;
            $errors = array();
            
            // Clear existing cities for this state
            $deleted = $wpdb->delete($cities_table, array('state_id' => $state_id));
            if ($this->get_option('enable_debug', false)) {
                error_log("Deleted {$deleted} existing cities for state {$state->name}");
            }
            
            foreach ($api_cities as $city) {
                if (!isset($city['id'], $city['name'])) {
                    $errors[] = "Cidade inválida para estado {$state->name}: " . json_encode($city);
                    continue;
                }
                
                $result = $wpdb->insert($cities_table, array(
                    'id' => intval($city['id']),
                    'name' => sanitize_text_field($city['name']),
                    'state_id' => intval($state_id),
                    'created_at' => current_time('mysql'),
                    'updated_at' => current_time('mysql')
                ));
                
                if ($result === false) {
                    $errors[] = "Erro ao inserir cidade {$city['name']}: " . $wpdb->last_error;
                } else {
                    $inserted++;
                }
            }
            
            // Update counters
            $counters['cities'] += $inserted;
            $counters['states_processed']++;
            $counters['current_state'] = $state->name;
            $counters['errors'] = array_merge($counters['errors'] ?? array(), $errors);
            update_option('bulbo_raiz_sync_counters', $counters);
            
            // Calculate progress
            $progress = 10 + (($counters['states_processed'] / $counters['total_states']) * 60); // 10-70%
            
            // Get next state
            $next_state = $wpdb->get_row($wpdb->prepare(
                "SELECT id, name FROM $states_table WHERE id > %d ORDER BY id LIMIT 1",
                $state_id
            ));
            
            if ($next_state) {
                // Continue with next state
                return array(
                    'success' => true,
                    'message' => "Estado {$state->name}: {$inserted} cidades sincronizadas",
                    'next_step' => 'sync_cities',
                    'state_id' => $next_state->id,
                    'state_name' => $next_state->name,
                    'progress' => intval($progress),
                    'stats' => array(
                        'states' => $counters['total_states'],
                        'cities' => $counters['cities'],
                        'neighborhoods' => $counters['neighborhoods']
                    )
                );
            } else {
                // All states processed, start neighborhoods
                $first_city = $wpdb->get_row("SELECT id, name FROM $cities_table ORDER BY id LIMIT 1");
                
                if (!$first_city) {
                    // No cities found, skip neighborhoods
                    return array(
                        'success' => true,
                        'message' => 'Nenhuma cidade encontrada, pulando sincronização de bairros',
                        'next_step' => 'complete',
                        'progress' => 100
                    );
                }
                
                return array(
                    'success' => true,
                    'message' => "Estado {$state->name}: {$inserted} cidades. Iniciando bairros...",
                    'next_step' => 'sync_neighborhoods',
                    'state_id' => $first_city->id, // Now it's city_id
                    'state_name' => $first_city->name, // Now it's city_name
                    'progress' => 70,
                    'stats' => array(
                        'states' => $counters['total_states'],
                        'cities' => $counters['cities'],
                        'neighborhoods' => $counters['neighborhoods']
                    )
                );
            }
            
        } catch (Exception $e) {
            error_log('Bulbo Raiz Cities Sync Error: ' . $e->getMessage());
            return array(
                'success' => false,
                'message' => 'Erro ao sincronizar cidades: ' . $e->getMessage()
            );
        }
    }
    
    /**
     * Sync neighborhoods for one city at a time
     */
    private function sync_neighborhoods_batch($city_id) {
        global $wpdb;
        
        try {
            $cities_table = $wpdb->prefix . 'bulbo_raiz_cities';
            $neighborhoods_table = $wpdb->prefix . 'bulbo_raiz_neighborhoods';
            
            $counters = get_option('bulbo_raiz_sync_counters', array());
            
            if (!$city_id) {
                throw new Exception('ID da cidade não fornecido');
            }
            
            // Get city info
            $city = $wpdb->get_row($wpdb->prepare(
                "SELECT c.id, c.name, s.name as state_name 
                 FROM $cities_table c 
                 JOIN {$wpdb->prefix}bulbo_raiz_states s ON c.state_id = s.id 
                 WHERE c.id = %d",
                $city_id
            ));
            
            if (!$city) {
                throw new Exception("Cidade com ID {$city_id} não encontrada");
            }
            
            if ($this->get_option('enable_debug', false)) {
                error_log("Syncing neighborhoods for city: {$city->name}, {$city->state_name} (ID: {$city_id})");
            }
            
            // Get neighborhoods from API - ROTA PÚBLICA (SEM AUTH)
            $api_neighborhoods = $this->api_request("geography/neighborhoods?city_id=" . $city_id, null, 'GET', false);
            
            if (!is_array($api_neighborhoods)) {
                if ($this->get_option('enable_debug', false)) {
                    error_log("No neighborhoods returned for city {$city->name} or API error");
                }
                $api_neighborhoods = array(); // Cidade sem bairros é válido
            }
            
            if ($this->get_option('enable_debug', false)) {
                error_log("API returned " . count($api_neighborhoods) . " neighborhoods for {$city->name}");
            }
            
            $inserted = 0;
            $errors = array();
            
            // Clear existing neighborhoods for this city
            $deleted = $wpdb->delete($neighborhoods_table, array('city_id' => $city_id));
            if ($this->get_option('enable_debug', false) && $deleted > 0) {
                error_log("Deleted {$deleted} existing neighborhoods for city {$city->name}");
            }
            
            foreach ($api_neighborhoods as $neighborhood) {
                if (!isset($neighborhood['id'], $neighborhood['name'])) {
                    $errors[] = "Bairro inválido para cidade {$city->name}: " . json_encode($neighborhood);
                    continue;
                }
                
                $result = $wpdb->insert($neighborhoods_table, array(
                    'id' => intval($neighborhood['id']),
                    'name' => sanitize_text_field($neighborhood['name']),
                    'city_id' => intval($city_id),
                    'created_at' => current_time('mysql'),
                    'updated_at' => current_time('mysql')
                ));
                
                if ($result === false) {
                    $errors[] = "Erro ao inserir bairro {$neighborhood['name']}: " . $wpdb->last_error;
                } else {
                    $inserted++;
                }
            }
            
            // Update counters
            $counters['neighborhoods'] += $inserted;
            $counters['errors'] = array_merge($counters['errors'] ?? array(), $errors);
            update_option('bulbo_raiz_sync_counters', $counters);
            
            // Get total cities for progress calculation
            $total_cities = $wpdb->get_var("SELECT COUNT(*) FROM $cities_table");
            $processed_cities = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM $cities_table WHERE id <= %d",
                $city_id
            ));
            
            // Calculate progress (70-95%)
            $progress = 70 + (($processed_cities / $total_cities) * 25);
            
            // Get next city
            $next_city = $wpdb->get_row($wpdb->prepare(
                "SELECT c.id, c.name FROM $cities_table c WHERE c.id > %d ORDER BY c.id LIMIT 1",
                $city_id
            ));
            
            if ($next_city) {
                // Continue with next city
                return array(
                    'success' => true,
                    'message' => "Cidade {$city->name}: {$inserted} bairros sincronizados",
                    'next_step' => 'sync_neighborhoods',
                    'state_id' => $next_city->id, // Actually city_id
                    'state_name' => $next_city->name, // Actually city_name
                    'progress' => intval($progress),
                    'stats' => array(
                        'states' => $counters['total_states'],
                        'cities' => $counters['cities'],
                        'neighborhoods' => $counters['neighborhoods']
                    )
                );
            } else {
                // All cities processed, complete sync
                return array(
                    'success' => true,
                    'message' => "Cidade {$city->name}: {$inserted} bairros. Finalizando...",
                    'next_step' => 'complete',
                    'progress' => 95,
                    'stats' => array(
                        'states' => $counters['total_states'],
                        'cities' => $counters['cities'],
                        'neighborhoods' => $counters['neighborhoods']
                    )
                );
            }
            
        } catch (Exception $e) {
            error_log('Bulbo Raiz Neighborhoods Sync Error: ' . $e->getMessage());
            return array(
                'success' => false,
                'message' => 'Erro ao sincronizar bairros: ' . $e->getMessage()
            );
        }
    }
    
    /**
     * Complete sync process
     */
    private function complete_sync_process() {
        global $wpdb;
        
        try {
            $sync_id = get_option('bulbo_raiz_current_sync_id');
            $counters = get_option('bulbo_raiz_sync_counters', array());
            $sync_table = $wpdb->prefix . 'bulbo_raiz_sync_log';
            
            // Final verification
            $final_states = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bulbo_raiz_states");
            $final_cities = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bulbo_raiz_cities");
            $final_neighborhoods = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bulbo_raiz_neighborhoods");
            
            $success_message = "Sincronização completa: {$final_states} estados, {$final_cities} cidades, {$final_neighborhoods} bairros";
            
            if (count($counters['errors'] ?? array()) > 0) {
                $success_message .= '. Erros: ' . count($counters['errors']);
                error_log('Bulbo Raiz Sync Errors: ' . json_encode($counters['errors']));
            }
            
            // Update sync log
            if ($sync_id) {
                $wpdb->update($sync_table, array(
                    'sync_status' => 'completed',
                    'sync_message' => $success_message,
                    'total_records' => $final_states + $final_cities + $final_neighborhoods,
                    'completed_at' => current_time('mysql')
                ), array('id' => $sync_id));
            }
            
            // Update last sync time
            $options = get_option('bulbo_raiz_options', array());
            $options['last_sync'] = current_time('mysql');
            update_option('bulbo_raiz_options', $options);
            
            // Clean up
            delete_option('bulbo_raiz_current_sync_id');
            delete_option('bulbo_raiz_sync_counters');
            
            if ($this->get_option('enable_debug', false)) {
                error_log("Sync completed successfully: States={$final_states}, Cities={$final_cities}, Neighborhoods={$final_neighborhoods}");
            }
            
            return array(
                'success' => true,
                'message' => $success_message,
                'next_step' => 'finished',
                'progress' => 100,
                'final_stats' => array(
                    'states' => intval($final_states),
                    'cities' => intval($final_cities),
                    'neighborhoods' => intval($final_neighborhoods),
                    'errors' => count($counters['errors'] ?? array())
                )
            );
            
        } catch (Exception $e) {
            error_log('Bulbo Raiz Sync Complete Error: ' . $e->getMessage());
            return array(
                'success' => false,
                'message' => 'Erro ao finalizar sincronização: ' . $e->getMessage()
            );
        }
    }
    
    /**
     * AJAX: Get sync status
     */
    public function ajax_get_sync_status() {
        check_ajax_referer('bulbo_raiz_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Permissão negada', 'bulbo-raiz')));
        }
        
        global $wpdb;
        
        $states_table = $wpdb->prefix . 'bulbo_raiz_states';
        $cities_table = $wpdb->prefix . 'bulbo_raiz_cities';
        $neighborhoods_table = $wpdb->prefix . 'bulbo_raiz_neighborhoods';
        $sync_table = $wpdb->prefix . 'bulbo_raiz_sync_log';
        
        // Get counts
        $states_count = $wpdb->get_var("SELECT COUNT(*) FROM $states_table");
        $cities_count = $wpdb->get_var("SELECT COUNT(*) FROM $cities_table");
        $neighborhoods_count = $wpdb->get_var("SELECT COUNT(*) FROM $neighborhoods_table");
        
        // Get last sync info
        $last_sync = $this->get_option('last_sync', '');
        $last_sync_logs = $wpdb->get_results(
            "SELECT * FROM $sync_table ORDER BY started_at DESC LIMIT 5",
            ARRAY_A
        );
        
        wp_send_json_success(array(
            'counts' => array(
                'states' => intval($states_count),
                'cities' => intval($cities_count),
                'neighborhoods' => intval($neighborhoods_count)
            ),
            'last_sync' => $last_sync,
            'sync_logs' => $last_sync_logs,
            'needs_sync' => empty($last_sync) || intval($states_count) === 0
        ));
    }
    
    /**
     * AJAX: Smart sync with queue system
     */
    public function ajax_smart_sync() {
        check_ajax_referer('bulbo_raiz_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Permissão negada', 'bulbo-raiz')));
        }
        
        $force_sync = isset($_POST['force']) && $_POST['force'] === 'true';
        
        try {
            $result = $this->initialize_smart_sync($force_sync);
            
            if ($result['success']) {
                wp_send_json_success($result);
            } else {
                wp_send_json_error($result);
            }
            
        } catch (Exception $e) {
            error_log('Bulbo Raiz Smart Sync Error: ' . $e->getMessage());
            wp_send_json_error(array('message' => 'Erro ao iniciar sincronização inteligente: ' . $e->getMessage()));
        }
    }
    
    /**
     * Initialize smart sync system
     */
    private function initialize_smart_sync($force_sync = false) {
        global $wpdb;
        
        // Generate unique session ID
        $session_id = 'sync_' . time() . '_' . wp_generate_password(8, false);
        update_option('bulbo_raiz_sync_session_id', $session_id);
        
        $queue_table = $wpdb->prefix . 'bulbo_raiz_sync_queue';
        $monitor_table = $wpdb->prefix . 'bulbo_raiz_sync_monitor';
        
        // Check if sync is needed
        if (!$force_sync) {
            $existing_data = $this->check_existing_data();
            if ($existing_data['has_data'] && !$existing_data['needs_update']) {
                return array(
                    'success' => true,
                    'message' => __('Dados já estão sincronizados e atualizados.', 'bulbo-raiz'),
                    'needs_sync' => false,
                    'session_id' => $session_id
                );
            }
        }
        
        // Clear existing queue for fresh start
        $wpdb->query("DELETE FROM `{$queue_table}` WHERE status IN ('pending', 'failed')");
        
        // Log sync start
        $this->log_sync_monitor($session_id, 'sync', null, 'started', 'Iniciando sincronização inteligente');
        
        // Create queue for states (priority 1 - highest)
        $states_result = $wpdb->insert($queue_table, array(
            'queue_type' => 'states',
            'priority' => 1,
            'status' => 'pending',
            'created_at' => current_time('mysql')
        ));
        
        if ($states_result === false) {
            throw new Exception('Erro ao criar fila para estados: ' . $wpdb->last_error);
        }
        
        return array(
            'success' => true,
            'message' => __('Sincronização inteligente iniciada com sucesso!', 'bulbo-raiz'),
            'session_id' => $session_id,
            'queue_created' => true,
            'next_step' => 'monitor'
        );
    }
    
    /**
     * Check existing data to determine if sync is needed
     */
    private function check_existing_data() {
        global $wpdb;
        
        $states_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bulbo_raiz_states");
        $cities_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bulbo_raiz_cities");
        $neighborhoods_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bulbo_raiz_neighborhoods");
        
        $has_data = $states_count > 0;
        
        // Check if data is stale (older than 7 days)
        $last_sync = $this->get_option('last_sync', '');
        $needs_update = false;
        
        if (!empty($last_sync)) {
            $last_sync_time = strtotime($last_sync);
            $week_ago = strtotime('-7 days');
            $needs_update = $last_sync_time < $week_ago;
        } else {
            $needs_update = true;
        }
        
        return array(
            'has_data' => $has_data,
            'needs_update' => $needs_update,
            'counts' => array(
                'states' => intval($states_count),
                'cities' => intval($cities_count),
                'neighborhoods' => intval($neighborhoods_count)
            ),
            'last_sync' => $last_sync
        );
    }
    
    /**
     * Process sync queue (called by cron)
     */
    public function process_sync_queue() {
        global $wpdb;
        
        $queue_table = $wpdb->prefix . 'bulbo_raiz_sync_queue';
        
        // Check if sync is paused
        if (get_option('bulbo_raiz_sync_paused', false)) {
            return;
        }
        
        // Get next pending item with highest priority
        $queue_item = $wpdb->get_row("
            SELECT * FROM `{$queue_table}` 
            WHERE status = 'pending' 
            ORDER BY priority ASC, created_at ASC 
            LIMIT 1
        ");
        
        if (!$queue_item) {
            return; // No items to process
        }
        
        // Mark as processing
        $wpdb->update($queue_table, 
            array('status' => 'processing', 'updated_at' => current_time('mysql')),
            array('id' => $queue_item->id)
        );
        
        $session_id = get_option('bulbo_raiz_sync_session_id', 'unknown');
        
        try {
            $start_time = microtime(true);
            $start_memory = memory_get_usage(true);
            
            switch ($queue_item->queue_type) {
                case 'states':
                    $result = $this->process_states_queue($queue_item, $session_id);
                    break;
                case 'cities':
                    $result = $this->process_cities_queue($queue_item, $session_id);
                    break;
                case 'neighborhoods':
                    $result = $this->process_neighborhoods_queue($queue_item, $session_id);
                    break;
                default:
                    throw new Exception('Tipo de fila desconhecido: ' . $queue_item->queue_type);
            }
            
            $end_time = microtime(true);
            $end_memory = memory_get_usage(true);
            $execution_time = round(($end_time - $start_time) * 1000, 2);
            $memory_usage = round(($end_memory - $start_memory) / 1024 / 1024, 2);
            
            if ($result['success']) {
                // Mark as completed
                $wpdb->update($queue_table, 
                    array(
                        'status' => 'completed', 
                        'processed_at' => current_time('mysql'),
                        'updated_at' => current_time('mysql')
                    ),
                    array('id' => $queue_item->id)
                );
                
                // Log success
                $this->log_sync_monitor($session_id, $queue_item->queue_type, $queue_item->entity_id, 
                    'completed', $result['message'], $execution_time, $memory_usage);
                
                // Schedule next queue processing immediately if more items exist
                $this->schedule_immediate_queue_processing();
                
            } else {
                throw new Exception($result['message']);
            }
            
        } catch (Exception $e) {
            // Handle failure
            $attempts = intval($queue_item->attempts) + 1;
            
            if ($attempts >= intval($queue_item->max_attempts)) {
                // Max attempts reached, mark as failed
                $wpdb->update($queue_table, 
                    array(
                        'status' => 'failed', 
                        'attempts' => $attempts,
                        'error_message' => $e->getMessage(),
                        'updated_at' => current_time('mysql')
                    ),
                    array('id' => $queue_item->id)
                );
                
                // Log failure
                $this->log_sync_monitor($session_id, $queue_item->queue_type, $queue_item->entity_id, 
                    'failed', 'Falha após ' . $attempts . ' tentativas: ' . $e->getMessage());
                
            } else {
                // Reset to pending for retry
                $wpdb->update($queue_table, 
                    array(
                        'status' => 'pending', 
                        'attempts' => $attempts,
                        'error_message' => $e->getMessage(),
                        'updated_at' => current_time('mysql')
                    ),
                    array('id' => $queue_item->id)
                );
                
                // Schedule retry in 1 minute
                wp_schedule_single_event(time() + 60, 'bulbo_raiz_process_sync_queue');
            }
            
            error_log('Bulbo Raiz Queue Processing Error: ' . $e->getMessage());
        }
    }

    /**
     * Schedule immediate queue processing if cron is working
     */
    private function schedule_immediate_queue_processing() {
        global $wpdb;
        
        $queue_table = $wpdb->prefix . 'bulbo_raiz_sync_queue';
        
        // Check if there are more pending items
        $pending_count = $wpdb->get_var("SELECT COUNT(*) FROM `{$queue_table}` WHERE status = 'pending'");
        
        if ($pending_count > 0) {
            // Schedule processing in 30 seconds (not immediately to avoid overload)
            wp_schedule_single_event(time() + 30, 'bulbo_raiz_process_sync_queue');
        }
    }

    /**
     * AJAX: Process queue manually (fallback for broken cron)
     */
    public function ajax_process_queue() {
        check_ajax_referer('bulbo_raiz_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Permissão negada', 'bulbo-raiz')));
        }
        
        try {
            // Process one item
            $this->process_sync_queue();
            
            global $wpdb;
            $queue_table = $wpdb->prefix . 'bulbo_raiz_sync_queue';
            
            // Get queue status
            $pending = $wpdb->get_var("SELECT COUNT(*) FROM `{$queue_table}` WHERE status = 'pending'");
            $processing = $wpdb->get_var("SELECT COUNT(*) FROM `{$queue_table}` WHERE status = 'processing'");
            $completed = $wpdb->get_var("SELECT COUNT(*) FROM `{$queue_table}` WHERE status = 'completed'");
            $failed = $wpdb->get_var("SELECT COUNT(*) FROM `{$queue_table}` WHERE status = 'failed'");
            
            wp_send_json_success(array(
                'message' => 'Item da fila processado',
                'queue_status' => array(
                    'pending' => intval($pending),
                    'processing' => intval($processing),
                    'completed' => intval($completed),
                    'failed' => intval($failed)
                ),
                'has_more' => $pending > 0
            ));
            
        } catch (Exception $e) {
            wp_send_json_error(array(
                'message' => 'Erro ao processar fila: ' . $e->getMessage()
            ));
        }
    }
    
    /**
     * Process states queue item
     */
    private function process_states_queue($queue_item, $session_id) {
        global $wpdb;
        
        try {
            error_log('🔍 DEBUG process_states_queue: Iniciando processamento de estados');
            
            // Get states from API
            $api_states = $this->api_request('geography/states');
            
            error_log('🔍 DEBUG process_states_queue: Resposta da API recebida');
            error_log('🔍 DEBUG api_states type: ' . gettype($api_states));
            error_log('🔍 DEBUG api_states is_array: ' . (is_array($api_states) ? 'true' : 'false'));
            error_log('🔍 DEBUG api_states count: ' . (is_array($api_states) ? count($api_states) : 'N/A'));
            error_log('🔍 DEBUG api_states sample: ' . json_encode(is_array($api_states) ? array_slice($api_states, 0, 2) : $api_states));
            
            if (!$api_states || !is_array($api_states)) {
                error_log('❌ DEBUG process_states_queue: API não retornou array válido');
                throw new Exception('Não foi possível obter estados da API - Tipo: ' . gettype($api_states) . ' - Dados: ' . json_encode($api_states));
            }
            
            $states_table = $wpdb->prefix . 'bulbo_raiz_states';
            $queue_table = $wpdb->prefix . 'bulbo_raiz_sync_queue';
            
            $inserted = 0;
            $updated = 0;
            $skipped = 0;
            
            foreach ($api_states as $state_data) {
                if (!isset($state_data['id'], $state_data['name'])) {
                    $skipped++;
                    continue;
                }
                
                // Check if state already exists
                $existing = $wpdb->get_row($wpdb->prepare(
                    "SELECT id FROM `{$states_table}` WHERE id = %d",
                    $state_data['id']
                ));
                
                if ($existing) {
                    // Update existing
                    $result = $wpdb->update($states_table, array(
                        'name' => sanitize_text_field($state_data['name']),
                        'code' => sanitize_text_field($state_data['code'] ?? ''),
                        'updated_at' => current_time('mysql')
                    ), array('id' => $state_data['id']));
                    
                    if ($result !== false) $updated++;
                } else {
                    // Insert new
                    $result = $wpdb->insert($states_table, array(
                        'id' => intval($state_data['id']),
                        'name' => sanitize_text_field($state_data['name']),
                        'code' => sanitize_text_field($state_data['code'] ?? ''),
                        'created_at' => current_time('mysql'),
                        'updated_at' => current_time('mysql')
                    ));
                    
                    if ($result !== false) $inserted++;
                }
                
                // Create cities queue for this state
                $cities_queue_exists = $wpdb->get_var($wpdb->prepare(
                    "SELECT COUNT(*) FROM `{$queue_table}` WHERE queue_type = 'cities' AND parent_id = %d",
                    $state_data['id']
                ));
                
                if (!$cities_queue_exists) {
                    $wpdb->insert($queue_table, array(
                        'queue_type' => 'cities',
                        'parent_id' => $state_data['id'],
                        'priority' => 2,
                        'status' => 'pending',
                        'data' => json_encode(array('state_name' => $state_data['name'])),
                        'created_at' => current_time('mysql')
                    ));
                }
            }
            
            return array(
                'success' => true,
                'message' => "Estados processados: {$inserted} inseridos, {$updated} atualizados, {$skipped} ignorados"
            );
            
        } catch (Exception $e) {
            return array(
                'success' => false,
                'message' => $e->getMessage()
            );
        }
    }
    
    /**
     * Process cities queue item
     */
    private function process_cities_queue($queue_item, $session_id) {
        global $wpdb;
        
        try {
            $state_id = $queue_item->parent_id;
            
            if (!$state_id) {
                throw new Exception('ID do estado não fornecido para sincronização de cidades');
            }
            
            // Get cities from API
            $api_cities = $this->api_request("geography/cities?state_id=" . $state_id);
            
            if (!is_array($api_cities)) {
                $api_cities = array(); // Estado sem cidades é válido
            }
            
            $cities_table = $wpdb->prefix . 'bulbo_raiz_cities';
            $queue_table = $wpdb->prefix . 'bulbo_raiz_sync_queue';
            
            $inserted = 0;
            $updated = 0;
            $skipped = 0;
            
            foreach ($api_cities as $city_data) {
                if (!isset($city_data['id'], $city_data['name'])) {
                    $skipped++;
                    continue;
                }
                
                // Check if city already exists
                $existing = $wpdb->get_row($wpdb->prepare(
                    "SELECT id FROM `{$cities_table}` WHERE id = %d",
                    $city_data['id']
                ));
                
                if ($existing) {
                    // Update existing
                    $result = $wpdb->update($cities_table, array(
                        'name' => sanitize_text_field($city_data['name']),
                        'state_id' => intval($state_id),
                        'updated_at' => current_time('mysql')
                    ), array('id' => $city_data['id']));
                    
                    if ($result !== false) $updated++;
                } else {
                    // Insert new
                    $result = $wpdb->insert($cities_table, array(
                        'id' => intval($city_data['id']),
                        'name' => sanitize_text_field($city_data['name']),
                        'state_id' => intval($state_id),
                        'created_at' => current_time('mysql'),
                        'updated_at' => current_time('mysql')
                    ));
                    
                    if ($result !== false) $inserted++;
                }
                
                // Create neighborhoods queue for this city
                $neighborhoods_queue_exists = $wpdb->get_var($wpdb->prepare(
                    "SELECT COUNT(*) FROM `{$queue_table}` WHERE queue_type = 'neighborhoods' AND parent_id = %d",
                    $city_data['id']
                ));
                
                if (!$neighborhoods_queue_exists) {
                    $wpdb->insert($queue_table, array(
                        'queue_type' => 'neighborhoods',
                        'parent_id' => $city_data['id'],
                        'priority' => 3,
                        'status' => 'pending',
                        'data' => json_encode(array('city_name' => $city_data['name'], 'state_id' => $state_id)),
                        'created_at' => current_time('mysql')
                    ));
                }
            }
            
            // Get state info for message
            $state_info = json_decode($queue_item->data, true);
            $state_name = $state_info['state_name'] ?? "Estado ID {$state_id}";
            
            return array(
                'success' => true,
                'message' => "Cidades de {$state_name}: {$inserted} inseridas, {$updated} atualizadas, {$skipped} ignoradas"
            );
            
        } catch (Exception $e) {
            return array(
                'success' => false,
                'message' => $e->getMessage()
            );
        }
    }
    
    /**
     * Process neighborhoods queue item
     */
    private function process_neighborhoods_queue($queue_item, $session_id) {
        global $wpdb;
        
        try {
            $city_id = $queue_item->parent_id;
            
            if (!$city_id) {
                throw new Exception('ID da cidade não fornecido para sincronização de bairros');
            }
            
            // Get neighborhoods from API
            $api_neighborhoods = $this->api_request("geography/neighborhoods?city_id=" . $city_id, null, 'GET');
            
            if (!is_array($api_neighborhoods)) {
                $api_neighborhoods = array(); // Cidade sem bairros é válido
            }
            
            $neighborhoods_table = $wpdb->prefix . 'bulbo_raiz_neighborhoods';
            
            $inserted = 0;
            $updated = 0;
            $skipped = 0;
            
            foreach ($api_neighborhoods as $neighborhood_data) {
                if (!isset($neighborhood_data['id'], $neighborhood_data['name'])) {
                    $skipped++;
                    continue;
                }
                
                // Check if neighborhood already exists
                $existing = $wpdb->get_row($wpdb->prepare(
                    "SELECT id FROM `{$neighborhoods_table}` WHERE id = %d",
                    $neighborhood_data['id']
                ));
                
                if ($existing) {
                    // Update existing
                    $result = $wpdb->update($neighborhoods_table, array(
                        'name' => sanitize_text_field($neighborhood_data['name']),
                        'city_id' => intval($city_id),
                        'updated_at' => current_time('mysql')
                    ), array('id' => $neighborhood_data['id']));
                    
                    if ($result !== false) $updated++;
                } else {
                    // Insert new
                    $result = $wpdb->insert($neighborhoods_table, array(
                        'id' => intval($neighborhood_data['id']),
                        'name' => sanitize_text_field($neighborhood_data['name']),
                        'city_id' => intval($city_id),
                        'created_at' => current_time('mysql'),
                        'updated_at' => current_time('mysql')
                    ));
                    
                    if ($result !== false) $inserted++;
                }
            }
            
            // Get city info for message
            $city_info = json_decode($queue_item->data, true);
            $city_name = $city_info['city_name'] ?? "Cidade ID {$city_id}";
            
            return array(
                'success' => true,
                'message' => "Bairros de {$city_name}: {$inserted} inseridos, {$updated} atualizados, {$skipped} ignorados"
            );
            
        } catch (Exception $e) {
            return array(
                'success' => false,
                'message' => $e->getMessage()
            );
        }
    }
    
    /**
     * Log sync monitoring data
     */
    private function log_sync_monitor($session_id, $entity_type, $entity_id, $status, $message, $execution_time_ms = null, $memory_usage_mb = null, $api_response_code = null) {
        global $wpdb;
        
        $monitor_table = $wpdb->prefix . 'bulbo_raiz_sync_monitor';
        
        $wpdb->insert($monitor_table, array(
            'sync_session_id' => $session_id,
            'entity_type' => $entity_type,
            'entity_id' => $entity_id,
            'action' => 'sync',
            'status' => $status,
            'message' => $message,
            'execution_time_ms' => $execution_time_ms,
            'memory_usage_mb' => $memory_usage_mb,
            'api_response_code' => $api_response_code,
            'created_at' => current_time('mysql')
        ));
    }
    
    /**
     * AJAX: Get sync queue status
     */
    public function ajax_get_sync_queue_status() {
        check_ajax_referer('bulbo_raiz_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Permissão negada', 'bulbo-raiz')));
        }
        
        global $wpdb;
        
        $queue_table = $wpdb->prefix . 'bulbo_raiz_sync_queue';
        $monitor_table = $wpdb->prefix . 'bulbo_raiz_sync_monitor';
        
        // Get queue statistics
        $queue_stats = $wpdb->get_results("
            SELECT 
                queue_type,
                status,
                COUNT(*) as count
            FROM `{$queue_table}` 
            GROUP BY queue_type, status
            ORDER BY queue_type, status
        ", ARRAY_A);
        
        // Get current session monitoring
        $session_id = get_option('bulbo_raiz_sync_session_id', '');
        $recent_monitors = array();
        
        if (!empty($session_id)) {
            $recent_monitors = $wpdb->get_results($wpdb->prepare("
                SELECT * FROM `{$monitor_table}` 
                WHERE sync_session_id = %s 
                ORDER BY created_at DESC 
                LIMIT 20
            ", $session_id), ARRAY_A);
        }
        
        // Get data counts
        $data_counts = array(
            'states' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bulbo_raiz_states"),
            'cities' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bulbo_raiz_cities"),
            'neighborhoods' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bulbo_raiz_neighborhoods")
        );
        
        // Check if sync is running
        $is_paused = get_option('bulbo_raiz_sync_paused', false);
        $pending_items = $wpdb->get_var("SELECT COUNT(*) FROM `{$queue_table}` WHERE status IN ('pending', 'processing')");
        
        wp_send_json_success(array(
            'queue_stats' => $queue_stats,
            'recent_monitors' => $recent_monitors,
            'data_counts' => $data_counts,
            'session_id' => $session_id,
            'is_paused' => $is_paused,
            'is_active' => $pending_items > 0,
            'pending_items' => intval($pending_items)
        ));
    }
    
    /**
     * AJAX: Pause sync
     */
    public function ajax_pause_sync() {
        check_ajax_referer('bulbo_raiz_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Permissão negada', 'bulbo-raiz')));
        }
        
        update_option('bulbo_raiz_sync_paused', true);
        
        // Log pause action
        $session_id = get_option('bulbo_raiz_sync_session_id', 'unknown');
        $this->log_sync_monitor($session_id, 'sync', null, 'started', 'Sincronização pausada pelo usuário');
        
        wp_send_json_success(array(
            'message' => __('Sincronização pausada com sucesso.', 'bulbo-raiz')
        ));
    }
    
    /**
     * AJAX: Resume sync
     */
    public function ajax_resume_sync() {
        check_ajax_referer('bulbo_raiz_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Permissão negada', 'bulbo-raiz')));
        }
        
        update_option('bulbo_raiz_sync_paused', false);
        
        // Log resume action
        $session_id = get_option('bulbo_raiz_sync_session_id', 'unknown');
        $this->log_sync_monitor($session_id, 'sync', null, 'started', 'Sincronização retomada pelo usuário');
        
        wp_send_json_success(array(
            'message' => __('Sincronização retomada com sucesso.', 'bulbo-raiz')
        ));
    }
    
    /**
     * Cleanup old sync queue items and monitoring data
     */
    public function cleanup_sync_queue() {
        global $wpdb;
        
        $queue_table = $wpdb->prefix . 'bulbo_raiz_sync_queue';
        $monitor_table = $wpdb->prefix . 'bulbo_raiz_sync_monitor';
        
        // Remove completed/failed items older than 7 days
        $wpdb->query("
            DELETE FROM `{$queue_table}` 
            WHERE status IN ('completed', 'failed') 
            AND updated_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
        ");
        
        // Remove monitoring data older than 30 days
        $wpdb->query("
            DELETE FROM `{$monitor_table}` 
            WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
        ");
        
        if ($this->get_option('enable_debug', false)) {
            error_log('Bulbo Raiz: Limpeza de filas e monitoramento executada');
        }
    }
    
    /**
     * AJAX: Sync São Paulo neighborhoods specifically
     */
    public function ajax_sync_sp_neighborhoods() {
        error_log('===== AJAX SP NEIGHBORHOODS SYNC CALLED =====');
        error_log('Nonce: ' . (isset($_POST['nonce']) ? $_POST['nonce'] : 'NOT_SET'));
        error_log('User can manage options: ' . (current_user_can('manage_options') ? 'YES' : 'NO'));
        
        check_ajax_referer('bulbo_raiz_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            error_log('AJAX SP NEIGHBORHOODS: Permission denied');
            wp_send_json_error(array('message' => __('Permissão negada', 'bulbo-raiz')));
        }

        // Verificar se a API está configurada
        $api_url = $this->get_option('api_url', 'http://localhost:8000/api');
        if (empty($api_url)) {
            error_log('AJAX SP NEIGHBORHOODS: API URL not configured');
            wp_send_json_error(array('message' => __('URL da API não está configurada', 'bulbo-raiz')));
        }
        
        error_log('AJAX SP NEIGHBORHOODS: API URL configured as: ' . $api_url);
        
        try {
            error_log('AJAX SP NEIGHBORHOODS: Starting sync process');
            $result = $this->sync_sao_paulo_neighborhoods();
            
            error_log('AJAX SP NEIGHBORHOODS: Sync result: ' . print_r($result, true));
            
            if ($result['success']) {
                wp_send_json_success($result);
            } else {
                wp_send_json_error($result);
            }
            
        } catch (Exception $e) {
            error_log('Bulbo Raiz SP Neighborhoods Sync Error: ' . $e->getMessage());
            wp_send_json_error(array('message' => 'Erro ao sincronizar bairros de São Paulo: ' . $e->getMessage()));
        }
    }
    
    /**
     * Sync São Paulo neighborhoods specifically
     */
    private function sync_sao_paulo_neighborhoods() {
        global $wpdb;
        
        error_log('=== SYNC SP NEIGHBORHOODS STARTED ===');
        
        // Primeiro, garantir que temos São Paulo cadastrado
        error_log('Ensuring São Paulo exists...');
        $this->ensure_sao_paulo_exists();
        
        // Buscar ID da cidade de São Paulo
        $sao_paulo_city_id = $wpdb->get_var("
            SELECT c.id 
            FROM {$wpdb->prefix}bulbo_raiz_cities c
            INNER JOIN {$wpdb->prefix}bulbo_raiz_states s ON c.state_id = s.id
            WHERE c.name = 'São Paulo' AND s.code = 'SP'
        ");
        
        error_log('São Paulo city ID found: ' . ($sao_paulo_city_id ?: 'NOT_FOUND'));
        
        if (!$sao_paulo_city_id) {
            error_log('ERROR: São Paulo city not found in database');
            return array(
                'success' => false,
                'message' => __('Cidade de São Paulo não encontrada. Execute primeiro a sincronização de estados e cidades.', 'bulbo-raiz')
            );
        }
        
        // Fazer requisição à API para buscar bairros de São Paulo
        $api_url = $this->get_option('api_url', 'http://localhost:8000/api');
        $endpoint = rtrim($api_url, '/') . '/wp/neighborhoods';
        
        error_log('Making request to: ' . $endpoint . ' with city_id: ' . $sao_paulo_city_id);
        
        // Testar primeiro se a API está acessível com uma requisição simples
        $test_endpoint = rtrim($api_url, '/') . '/geography/states';
        error_log('Testing API accessibility with: ' . $test_endpoint);
        
        $test_response = wp_remote_get($test_endpoint, array(
            'timeout' => 30,
            'headers' => array(
                'Accept' => 'application/json',
                'User-Agent' => 'BulboRaiz-WordPress-Plugin/' . BULBO_RAIZ_VERSION
            )
        ));
        
        if (is_wp_error($test_response)) {
            error_log('API Test failed: ' . $test_response->get_error_message());
            return array(
                'success' => false,
                'message' => __('Erro na conexão com a API: ', 'bulbo-raiz') . $test_response->get_error_message()
            );
        }
        
        $test_status = wp_remote_retrieve_response_code($test_response);
        error_log('API Test response status: ' . $test_status);
        
        if ($test_status !== 200) {
            return array(
                'success' => false,
                'message' => sprintf(__('API não acessível - Erro HTTP %d. Verifique se o servidor Laravel está rodando.', 'bulbo-raiz'), $test_status)
            );
        }
        
        // SIMPLIFICADO: Usar rota pública que NÃO precisa de autenticação
        error_log('Using public geography/neighborhoods route (no auth needed)');
        $neighborhoods = $this->api_request("geography/neighborhoods?city_id=" . $sao_paulo_city_id);
        
        if (!$neighborhoods) {
            return array(
                'success' => false,
                'message' => __('Erro na conexão com a API ou resposta vazia', 'bulbo-raiz')
            );
        }
        
        // Se api_request retorna array com success/message, extrair dados
        if (isset($neighborhoods['success']) && !$neighborhoods['success']) {
            return array(
                'success' => false,
                'message' => __('Erro da API: ', 'bulbo-raiz') . ($neighborhoods['message'] ?? 'Erro desconhecido')
            );
        }
        
        // Se retornou objeto com success=true mas não tem dados diretos, é resposta estruturada
        if (isset($neighborhoods['success']) && $neighborhoods['success'] && !isset($neighborhoods[0])) {
            // Se tem dados dentro de uma chave específica, extrair
            if (isset($neighborhoods['data'])) {
                $neighborhoods = $neighborhoods['data'];
            }
        }
        
        if (!$neighborhoods || !is_array($neighborhoods)) {
            return array(
                'success' => false,
                'message' => __('Resposta inválida da API', 'bulbo-raiz')
            );
        }
        
        // Limpar bairros existentes de São Paulo
        $wpdb->query($wpdb->prepare("DELETE FROM {$wpdb->prefix}bulbo_raiz_neighborhoods WHERE city_id = %d", $sao_paulo_city_id));
        
        // Inserir novos bairros
        $inserted_count = 0;
        $errors = array();
        
        foreach ($neighborhoods as $neighborhood) {
            if (!isset($neighborhood['id']) || !isset($neighborhood['name'])) {
                continue;
            }
            
            $result = $wpdb->insert(
                $wpdb->prefix . 'bulbo_raiz_neighborhoods',
                array(
                    'id' => intval($neighborhood['id']),
                    'city_id' => $sao_paulo_city_id,
                    'name' => sanitize_text_field($neighborhood['name']),
                    'created_at' => current_time('mysql'),
                    'updated_at' => current_time('mysql')
                ),
                array('%d', '%d', '%s', '%s', '%s')
            );
            
            if ($result !== false) {
                $inserted_count++;
            } else {
                $errors[] = $wpdb->last_error;
            }
        }
        
        // Atualizar última sincronização
        $options = get_option('bulbo_raiz_options', array());
        $options['last_sp_sync'] = current_time('mysql');
        update_option('bulbo_raiz_options', $options);
        
        if ($inserted_count > 0) {
            return array(
                'success' => true,
                'message' => sprintf(__('Sincronizados %d bairros de São Paulo com sucesso!', 'bulbo-raiz'), $inserted_count),
                'inserted_count' => $inserted_count,
                'errors' => $errors
            );
        } else {
            return array(
                'success' => false,
                'message' => __('Nenhum bairro foi sincronizado. Verifique a configuração da API.', 'bulbo-raiz'),
                'errors' => $errors
            );
        }
    }
    
    /**
     * Ensure São Paulo state and city exist in local database
     */
    private function ensure_sao_paulo_exists() {
        global $wpdb;
        
        error_log('Checking if São Paulo state and city exist...');
        
        // Verificar se SP existe
        $sp_state = $wpdb->get_row("SELECT * FROM {$wpdb->prefix}bulbo_raiz_states WHERE code = 'SP'");
        error_log('SP state query result: ' . ($sp_state ? 'Found ID ' . $sp_state->id : 'NOT FOUND'));
        
        if (!$sp_state) {
            // Inserir estado de SP
            error_log('Inserting SP state...');
            $result = $wpdb->insert(
                $wpdb->prefix . 'bulbo_raiz_states',
                array(
                    'id' => 25, // IBGE code for SP
                    'name' => 'São Paulo',
                    'code' => 'SP',
                    'created_at' => current_time('mysql'),
                    'updated_at' => current_time('mysql')
                ),
                array('%d', '%s', '%s', '%s', '%s')
            );
            error_log('SP state insert result: ' . ($result ? 'SUCCESS' : 'FAILED: ' . $wpdb->last_error));
            $sp_state_id = 25;
        } else {
            $sp_state_id = $sp_state->id;
        }
        
        // Verificar se cidade de São Paulo existe
        $sp_city = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}bulbo_raiz_cities WHERE name = 'São Paulo' AND state_id = %d",
            $sp_state_id
        ));
        error_log('SP city query result: ' . ($sp_city ? 'Found ID ' . $sp_city->id : 'NOT FOUND'));
        
        if (!$sp_city) {
            // Inserir cidade de São Paulo
            error_log('Inserting SP city...');
            $result = $wpdb->insert(
                $wpdb->prefix . 'bulbo_raiz_cities',
                array(
                    'id' => 3550308, // IBGE code for São Paulo city
                    'state_id' => $sp_state_id,
                    'name' => 'São Paulo',
                    'created_at' => current_time('mysql'),
                    'updated_at' => current_time('mysql')
                ),
                array('%d', '%d', '%s', '%s', '%s')
            );
            error_log('SP city insert result: ' . ($result ? 'SUCCESS' : 'FAILED: ' . $wpdb->last_error));
        }
        
        error_log('ensure_sao_paulo_exists completed');
    }
    
    /**
     * Retorna o label legível do tipo de atendimento
     */
    public function get_service_type_label($service_type) {
        switch ($service_type) {
            case 'cliente_final':
                return 'Cliente Final';
            case 'profissional':
                return 'Terapeuta Capilar, Tricologista, Dermatologista, Cabeleireira (o) ou Barbeiro';
            case 'representante':
                return 'Quero ser Representante';
            default:
                return $service_type;
        }
    }
    

}

// Removed custom 'every_minute' cron schedule to reduce server load
// The sync queue will be processed only when manually triggered or hourly

// Initialize plugin
Bulbo_Raiz_Plugin::get_instance();

