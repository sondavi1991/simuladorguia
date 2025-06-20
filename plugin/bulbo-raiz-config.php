<?php
/**
 * Configurações do Plugin Bulbo Raiz
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Configurações da API baseadas no ambiente
class Bulbo_Raiz_Config {
    
    /**
     * Get API base URL based on environment
     */
    public static function get_api_url() {
        // Em produção, usar a URL de produção
        if (self::is_production()) {
            return 'https://bakbulbo.sitesobmedida.com.br/api';
        }
        
        // Em desenvolvimento, tentar detectar URL local ou usar padrão
        return self::get_local_api_url();
    }
    
    /**
     * Get frontend URL for CORS reference
     */
    public static function get_frontend_url() {
        if (self::is_production()) {
            return 'https://criacao.davimanoel.com.br/appbulbo';
        }
        
        return 'http://localhost:3000';
    }
    
    /**
     * Get plugin URL for CORS reference
     */
    public static function get_plugin_url() {
        if (self::is_production()) {
            return 'https://criacao.davimanoel.com.br/bulbowp';
        }
        
        return home_url();
    }
    
    /**
     * Check if we're in production environment
     */
    private static function is_production() {
        $host = $_SERVER['HTTP_HOST'] ?? '';
        
        // Detectar se estamos em produção
        return (
            strpos($host, 'criacao.davimanoel.com.br') !== false ||
            strpos($host, 'davimanoel.com.br') !== false ||
            strpos($host, 'bulboraiz.com.br') !== false
        );
    }
    
    /**
     * Get local API URL for development
     */
    private static function get_local_api_url() {
        // Tentar algumas URLs comuns de desenvolvimento
        $possible_urls = [
            'http://localhost:8000/api',
            'http://127.0.0.1:8000/api',
            'http://bulbo-novo.test/back/api',
            'http://localhost/bulbo-novo/back/api'
        ];
        
        return $possible_urls[0]; // Default para localhost:8000
    }
    
    /**
     * Get authentication configuration
     */
    public static function get_auth_config() {
        return [
            'token_expires_in_days' => 30,
            'auto_refresh_token' => true,
            'enable_debug' => !self::is_production(),
            'timeout' => 30
        ];
    }
    
    /**
     * Get CORS allowed origins for reference
     */
    public static function get_cors_origins() {
        return [
            self::get_frontend_url(),
            self::get_plugin_url(),
            'https://criacao.davimanoel.com.br',
            'https://bakbulbo.sitesobmedida.com.br'
        ];
    }
} 