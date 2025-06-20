/**
 * Bulbo Raiz Admin JavaScript
 * Funcionalidades da área administrativa do plugin
 */

jQuery(document).ready(function($) {
    
    // Verificar status automaticamente quando a página carrega
    checkConnectionStatusOnLoad();
    checkSyncStatusOnLoad();
    
    // Test connection button
    $('#test-connection').on('click', function() {
        const $btn = $(this);
        const $status = $('#connection-status');
        const originalText = $btn.text();
        
        $btn.prop('disabled', true).text(bulbo_raiz_admin.strings.testing);
        $status.removeClass('success error').addClass('loading')
            .find('.bulbo-raiz-status-text').text('Testando conexão...');
        
        const apiUrl = $('input[name="bulbo_raiz_options[api_url]"]').val();
        const apiToken = $('input[name="bulbo_raiz_options[api_token]"]').val();
        
        $.post(bulbo_raiz_admin.ajax_url, {
            action: 'bulbo_raiz_test_connection',
            nonce: bulbo_raiz_admin.nonce,
            api_url: apiUrl,
            api_token: apiToken
        }, function(response) {
            $btn.prop('disabled', false).text(originalText);
            
            if (response.success) {
                $status.removeClass('loading error').addClass('success')
                    .find('.bulbo-raiz-status-text').text(bulbo_raiz_admin.strings.success);
            } else {
                $status.removeClass('loading success').addClass('error')
                    .find('.bulbo-raiz-status-text').text(bulbo_raiz_admin.strings.error + ' ' + response.data.message);
            }
        }).fail(function() {
            $btn.prop('disabled', false).text(originalText);
            $status.removeClass('loading success').addClass('error')
                .find('.bulbo-raiz-status-text').text('Erro de conexão');
        });
    });
    
    // Função para verificar status da conexão automaticamente
    function checkConnectionStatusOnLoad() {
        console.log('checkConnectionStatusOnLoad called'); // Debug
        const $status = $('#connection-status');
        console.log('connection-status element found:', $status.length); // Debug
        
        if ($status.length === 0) return;
        
        const apiUrl = $('input[name="bulbo_raiz_options[api_url]"]').val();
        const apiToken = $('input[name="bulbo_raiz_options[api_token]"]').val();
        
        console.log('API URL:', apiUrl, 'API Token:', apiToken ? 'present' : 'missing'); // Debug
        
        if (!apiUrl) {
            $status.removeClass('loading success').addClass('error')
                .find('.bulbo-raiz-status-text').text('URL da API não configurada');
            return;
        }
        
        // Teste silencioso da conexão
        $.post(bulbo_raiz_admin.ajax_url, {
            action: 'bulbo_raiz_test_connection',
            nonce: bulbo_raiz_admin.nonce,
            api_url: apiUrl,
            api_token: apiToken
        }, function(response) {
            console.log('Connection test response:', response); // Debug
            if (response.success) {
                $status.removeClass('loading error').addClass('success')
                    .find('.bulbo-raiz-status-text').text('Conexão funcionando');
            } else {
                $status.removeClass('loading success').addClass('error')
                    .find('.bulbo-raiz-status-text').text('Falha na conexão');
            }
        }).fail(function(xhr, status, error) {
            console.log('Connection test failed:', xhr, status, error); // Debug
            $status.removeClass('loading success').addClass('error')
                .find('.bulbo-raiz-status-text').text('Erro na conexão');
        });
    }
    
    // Função para verificar status da sincronização automaticamente
    function checkSyncStatusOnLoad() {
        console.log('checkSyncStatusOnLoad called'); // Debug
        const $syncStatus = $('#sync-status-display');
        console.log('sync-status-display element found:', $syncStatus.length); // Debug
        
        if ($syncStatus.length === 0) return;
        
        // Verificar se existe a função ajax_get_sync_status
        $.post(bulbo_raiz_admin.ajax_url, {
            action: 'bulbo_raiz_get_sync_status',
            nonce: bulbo_raiz_admin.nonce
        }, function(response) {
            console.log('Sync status response:', response); // Debug
            if (response.success) {
                updateSyncStatusDisplay(response.data);
                $('#sync-details').show();
            } else {
                $syncStatus.removeClass('loading success').addClass('error')
                    .html('<span class="sync-error">❌</span> <span>Erro ao verificar status</span>');
            }
        }).fail(function(xhr, status, error) {
            console.log('Sync status failed:', xhr, status, error); // Debug
            $syncStatus.removeClass('loading success').addClass('error')
                .html('<span class="sync-error">❌</span> <span>Erro de conexão</span>');
        });
    }
    
    // Função para atualizar a exibição do status de sincronização
    function updateSyncStatusDisplay(data) {
        const $syncStatus = $('#sync-status-display');
        const hasData = data.counts.states > 0;
        
        if (hasData && !data.needs_sync) {
            $syncStatus.removeClass('loading error warning').addClass('success')
                .html('<span class="sync-success">✅</span> <span>Dados sincronizados</span>');
        } else if (hasData && data.needs_sync) {
            $syncStatus.removeClass('loading error success').addClass('warning')
                .html('<span class="sync-warning">⚠️</span> <span>Sincronização recomendada</span>');
        } else {
            $syncStatus.removeClass('loading success warning').addClass('error')
                .html('<span class="sync-error">❌</span> <span>Necessária sincronização</span>');
        }
        
        // Atualizar contadores
        $('#states-count').text(data.counts.states || 0);
        $('#cities-count').text(data.counts.cities || 0);
        $('#neighborhoods-count').text(data.counts.neighborhoods || 0);
        $('#last-sync-date').text(data.last_sync || 'Nunca');
    }
    
    // Clear cache button
    $('#clear-cache').on('click', function() {
        const $btn = $(this);
        const originalText = $btn.text();
        
        if (!confirm('Tem certeza que deseja limpar o cache?')) {
            return;
        }
        
        $btn.prop('disabled', true).text('Limpando...');
        
        $.post(bulbo_raiz_admin.ajax_url, {
            action: 'bulbo_raiz_clear_cache',
            nonce: bulbo_raiz_admin.nonce
        }, function(response) {
            $btn.prop('disabled', false).text(originalText);
            
            if (response.success) {
                alert('Cache limpo com sucesso!');
            } else {
                alert('Erro ao limpar cache: ' + response.data.message);
            }
        }).fail(function() {
            $btn.prop('disabled', false).text(originalText);
            alert('Erro de conexão');
        });
    });
    
    // Generate token button
    $('#generate-token').on('click', function() {
        const $btn = $(this);
        const originalText = $btn.text();
        
        const email = $('input[name="bulbo_raiz_options[api_email]"]').val();
        const password = $('input[name="bulbo_raiz_options[api_password]"]').val();
        
        if (!email || !password) {
            alert('Por favor, preencha o email e senha primeiro.');
            return;
        }
        
        $btn.prop('disabled', true).text('Gerando...');
        
        $.post(bulbo_raiz_admin.ajax_url, {
            action: 'bulbo_raiz_generate_token',
            nonce: bulbo_raiz_admin.nonce,
            email: email,
            password: password
        }, function(response) {
            $btn.prop('disabled', false).text(originalText);
            
            if (response.success) {
                $('input[name="bulbo_raiz_options[api_token]"]').val(response.data.token);
                $('input[name="bulbo_raiz_options[token_expires_at]"]').val(response.data.expires_at);
                $('#refresh-token').prop('disabled', false);
                alert('Token gerado com sucesso!');
                
                // Update token status display
                updateTokenStatus(true, response.data.expires_at);
            } else {
                alert('Erro ao gerar token: ' + response.data.message);
            }
        }).fail(function() {
            $btn.prop('disabled', false).text(originalText);
            alert('Erro de conexão');
        });
    });
    
    // Refresh token button
    $('#refresh-token').on('click', function() {
        const $btn = $(this);
        const originalText = $btn.text();
        
        $btn.prop('disabled', true).text('Renovando...');
        
        $.post(bulbo_raiz_admin.ajax_url, {
            action: 'bulbo_raiz_refresh_token',
            nonce: bulbo_raiz_admin.nonce
        }, function(response) {
            $btn.prop('disabled', false).text(originalText);
            
            if (response.success) {
                $('input[name="bulbo_raiz_options[api_token]"]').val(response.data.token);
                $('input[name="bulbo_raiz_options[token_expires_at]"]').val(response.data.expires_at);
                alert('Token renovado com sucesso!');
                
                // Update token status display
                updateTokenStatus(true, response.data.expires_at);
            } else {
                alert('Erro ao renovar token: ' + response.data.message);
            }
        }).fail(function() {
            $btn.prop('disabled', false).text(originalText);
            alert('Erro de conexão');
        });
    });
    
    // Update token status display
    function updateTokenStatus(isValid, expiresAt) {
        const $status = $('.token-status');
        if ($status.length) {
            if (isValid) {
                $status.find('.status-indicator').text('🟢');
                $status.find('.status-text').text('Token ativo');
                if (expiresAt) {
                    const expiry = new Date(expiresAt);
                    $status.find('.expiry-info').text('Expira em: ' + expiry.toLocaleString('pt-BR'));
                }
            } else {
                $status.find('.status-indicator').text('🔴');
                $status.find('.status-text').text('Token inválido ou expirado');
                $status.find('.expiry-info').text('');
            }
        }
    }
    
    // Auto-save form on significant changes
    let saveTimeout;
    $('input[name^="bulbo_raiz_options"], select[name^="bulbo_raiz_options"], textarea[name^="bulbo_raiz_options"]').on('change', function() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(function() {
            // Could implement auto-save here if desired
            console.log('Form data changed');
        }, 2000);
    });
    
    // Show/hide advanced options
    $('.bulbo-raiz-advanced-toggle').on('click', function() {
        const $target = $($(this).data('target'));
        $target.slideToggle();
        $(this).text($target.is(':visible') ? 'Ocultar' : 'Mostrar');
    });
    
    // Copy buttons for code snippets
    $('.bulbo-raiz-widget code').each(function() {
        const $code = $(this);
        const $copyBtn = $('<button type="button" class="button button-small copy-code" style="margin-left: 10px; padding: 2px 8px; font-size: 11px;">Copiar</button>');
        
        $copyBtn.on('click', function() {
            const textToCopy = $code.text();
            
            if (navigator.clipboard) {
                navigator.clipboard.writeText(textToCopy).then(function() {
                    $copyBtn.text('Copiado!');
                    setTimeout(() => $copyBtn.text('Copiar'), 2000);
                });
            } else {
                // Fallback
                const textarea = document.createElement('textarea');
                textarea.value = textToCopy;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                
                $copyBtn.text('Copiado!');
                setTimeout(() => $copyBtn.text('Copiar'), 2000);
            }
        });
        
        $code.after($copyBtn);
    });
    
    // Initialize tooltips if available
    if (typeof $.fn.tooltip === 'function') {
        $('[data-tooltip]').tooltip();
    }
    
    // Form validation
    $('form').on('submit', function() {
        let isValid = true;
        const requiredFields = $(this).find('[required]');
        
        requiredFields.each(function() {
            const $field = $(this);
            if (!$field.val().trim()) {
                $field.addClass('error');
                isValid = false;
            } else {
                $field.removeClass('error');
            }
        });
        
        if (!isValid) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return false;
        }
    });
    
    // Real-time URL validation
    $('input[type="url"]').on('blur', function() {
        const $input = $(this);
        const url = $input.val();
        
        if (url && !isValidUrl(url)) {
            $input.addClass('error');
            $input.after('<div class="error-message">URL inválida</div>');
        } else {
            $input.removeClass('error');
            $input.siblings('.error-message').remove();
        }
    });
    
    // URL validation function
    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
    
    // Debug info toggle
    $('.debug-info-toggle').on('click', function() {
        $('.debug-info').slideToggle();
    });
    
    // Verificar status quando a página se torna visível novamente
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            checkConnectionStatusOnLoad();
            checkSyncStatusOnLoad();
        }
    });
    
    // Botão para sincronizar bairros de São Paulo
    console.log('🔍 DEBUG: Registrando handler para botão SP neighborhoods');
    console.log('🔍 DEBUG: Botão encontrado:', $('#btn-sync-sp-neighborhoods').length);
    
    $(document).on('click', '#btn-sync-sp-neighborhoods', function() {
        console.log('🚀 SP neighborhoods sync button clicked!!!');
        console.log('🔍 Button element:', this);
        console.log('🔍 bulbo_raiz_admin object:', typeof bulbo_raiz_admin !== 'undefined' ? bulbo_raiz_admin : 'UNDEFINED');
        
        const $btn = $(this);
        const originalText = $btn.text();
        
        if (!confirm('Deseja sincronizar os bairros de São Paulo? Esta ação irá substituir os bairros existentes.')) {
            console.log('🔍 User cancelled confirmation');
            return;
        }
        
        console.log('🔍 User confirmed, proceeding with sync');
        
        $btn.prop('disabled', true).html('<span class="dashicons dashicons-update spin"></span> Sincronizando...');
        
        // Mostrar progresso
        $('#sync-result').show().html('<div class="notice notice-info"><p>🔄 Sincronizando bairros de São Paulo...</p></div>');
        
        console.log('📡 Sending AJAX request to sync SP neighborhoods');
        console.log('📡 AJAX URL:', bulbo_raiz_admin.ajax_url);
        console.log('📡 Nonce:', bulbo_raiz_admin.nonce);
        
        $.post(bulbo_raiz_admin.ajax_url, {
            action: 'bulbo_raiz_sync_sp_neighborhoods',
            nonce: bulbo_raiz_admin.nonce
        }, function(response) {
            console.log('✅ SP sync response received:', response);
            $btn.prop('disabled', false).html(originalText);
            
            if (response.success) {
                console.log('✅ Sync successful:', response.data.message);
                $('#sync-result').html('<div class="notice notice-success"><p>✅ ' + response.data.message + '</p></div>');
                
                // Atualizar status automaticamente
                setTimeout(function() {
                    checkSyncStatusOnLoad();
                }, 1000);
            } else {
                console.log('❌ Sync failed:', response.data.message);
                $('#sync-result').html('<div class="notice notice-error"><p>❌ Erro: ' + response.data.message + '</p></div>');
            }
        }).fail(function(xhr, status, error) {
            console.log('💥 SP sync AJAX failed:', {xhr: xhr, status: status, error: error});
            $btn.prop('disabled', false).html(originalText);
            $('#sync-result').html('<div class="notice notice-error"><p>❌ Erro de conexão: ' + error + '</p></div>');
        });
    });
    
    // Verificação final de inicialização
    console.log('🎯 Bulbo Raiz Admin JavaScript loaded successfully');
    console.log('🎯 jQuery version:', $.fn.jquery);
    console.log('🎯 bulbo_raiz_admin available:', typeof bulbo_raiz_admin !== 'undefined');
    console.log('🎯 SP button exists:', $('#btn-sync-sp-neighborhoods').length > 0);
    
    // Adicionar verificação adicional após um pequeno delay
    setTimeout(function() {
        console.log('🎯 DELAYED CHECK - SP button exists:', $('#btn-sync-sp-neighborhoods').length > 0);
        if ($('#btn-sync-sp-neighborhoods').length > 0) {
            console.log('🎯 DELAYED CHECK - SP button text:', $('#btn-sync-sp-neighborhoods').text());
            console.log('🎯 DELAYED CHECK - SP button visible:', $('#btn-sync-sp-neighborhoods').is(':visible'));
        }
    }, 1000);

    // ===================================================================
    // 🔄 SISTEMA AUTOMÁTICO DE PROCESSAMENTO DA FILA DE SINCRONIZAÇÃO
    // ===================================================================
    
    let queueProcessingInterval = null;
    let isProcessingQueue = false;
    
    /**
     * Sistema automático para processar fila quando cron jobs não funcionam
     */
    function startAutoQueueProcessing() {
        console.log('🤖 Iniciando sistema automático de processamento da fila');
        
        if (queueProcessingInterval) {
            clearInterval(queueProcessingInterval);
        }
        
        // Verificar fila a cada 30 segundos
        queueProcessingInterval = setInterval(function() {
            checkAndProcessQueue();
        }, 30000);
        
        // Primeira verificação imediata
        setTimeout(checkAndProcessQueue, 2000);
    }
    
    /**
     * Verificar status da fila e processar se necessário
     */
    function checkAndProcessQueue() {
        if (isProcessingQueue) {
            console.log('🤖 Já processando fila, aguardando...');
            return;
        }
        
        $.post(bulbo_raiz_admin.ajax_url, {
            action: 'bulbo_raiz_get_sync_queue_status',
            nonce: bulbo_raiz_admin.nonce
        }, function(response) {
            if (response.success && response.data.pending_items > 0 && !response.data.is_paused) {
                console.log('🤖 Fila tem itens pendentes:', response.data.pending_items);
                processQueueItem();
            }
        }).fail(function() {
            console.log('🤖 Erro ao verificar status da fila');
        });
    }
    
    /**
     * Processar um item da fila via AJAX
     */
    function processQueueItem() {
        if (isProcessingQueue) return;
        
        isProcessingQueue = true;
        console.log('🤖 Processando item da fila...');
        
        $.post(bulbo_raiz_admin.ajax_url, {
            action: 'bulbo_raiz_process_queue',
            nonce: bulbo_raiz_admin.nonce
        }, function(response) {
            console.log('🤖 Resposta do processamento:', response);
            
            if (response.success) {
                if (response.data.has_more) {
                    console.log('🤖 Mais itens na fila, continuando...');
                    // Processar próximo item em 2 segundos
                    setTimeout(function() {
                        isProcessingQueue = false;
                        processQueueItem();
                    }, 2000);
                } else {
                    console.log('🤖 Fila vazia, finalizando processamento automático');
                    isProcessingQueue = false;
                }
                
                // Atualizar display se estiver na página
                updateQueueDisplay(response.data.queue_status);
            } else {
                console.log('🤖 Erro no processamento:', response.data.message);
                isProcessingQueue = false;
            }
        }).fail(function() {
            console.log('🤖 Erro AJAX no processamento');
            isProcessingQueue = false;
        });
    }
    
    /**
     * Atualizar display do status da fila
     */
    function updateQueueDisplay(queueStatus) {
        if (!queueStatus) return;
        
        const $display = $('#queue-status-display');
        if ($display.length === 0) return;
        
        let statusHtml = '';
        if (queueStatus.pending > 0) {
            statusHtml += `<span class="queue-pending">⏳ ${queueStatus.pending} pendentes</span> `;
        }
        if (queueStatus.completed > 0) {
            statusHtml += `<span class="queue-completed">✅ ${queueStatus.completed} concluídos</span> `;
        }
        if (queueStatus.failed > 0) {
            statusHtml += `<span class="queue-failed">❌ ${queueStatus.failed} falharam</span>`;
        }
        
        if (!statusHtml) {
            statusHtml = '<span class="queue-empty">📭 Fila vazia</span>';
        }
        
        $display.html(statusHtml);
    }
    
    /**
     * Parar processamento automático
     */
    function stopAutoQueueProcessing() {
        console.log('🛑 Parando sistema automático de processamento');
        if (queueProcessingInterval) {
            clearInterval(queueProcessingInterval);
            queueProcessingInterval = null;
        }
        isProcessingQueue = false;
    }
    
    // Iniciar sistema automático quando a página carregar
    if (typeof bulbo_raiz_admin !== 'undefined') {
        startAutoQueueProcessing();
        
        // Parar quando sair da página
        $(window).on('beforeunload', function() {
            stopAutoQueueProcessing();
        });
        
        // Parar/iniciar baseado na visibilidade da página
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                stopAutoQueueProcessing();
            } else {
                startAutoQueueProcessing();
            }
        });
    }
    
    console.log('🤖 Sistema automático de processamento de fila configurado');
    
    // ===================================================================
    // 🧪 BOTÃO DE TESTE ESPECÍFICO PARA wp/states
    // ===================================================================
    
    $(document).on('click', '#btn-test-wp-states', function() {
        console.log('🧪 Testando API wp/states especificamente');
        
        const $btn = $(this);
        const originalHtml = $btn.html();
        
        $btn.prop('disabled', true).html('<span class="dashicons dashicons-update spin"></span> Testando wp/states...');
        
        // Mostrar resultado
        $('#sync-result').show().html('<div class="notice notice-info"><p>🔄 Testando comunicação com API wp/states...</p></div>');
        
        $.post(bulbo_raiz_admin.ajax_url, {
            action: 'bulbo_raiz_test_wp_states',
            nonce: bulbo_raiz_admin.nonce
        }, function(response) {
            console.log('🧪 Resposta do teste wp/states:', response);
            $btn.prop('disabled', false).html(originalHtml);
            
            if (response.success) {
                const data = response.data.data;
                let resultHtml = `
                    <div class="notice notice-success">
                        <h4>✅ Teste wp/states concluído</h4>
                        <p><strong>Tipo:</strong> ${data.type}</p>
                        <p><strong>É array:</strong> ${data.is_array ? 'SIM' : 'NÃO'}</p>
                        <p><strong>Quantidade:</strong> ${data.count || 'N/A'}</p>
                        <p><strong>Amostra:</strong></p>
                        <pre style="background: #f0f0f0; padding: 10px; max-height: 200px; overflow: auto;">${JSON.stringify(data.sample, null, 2)}</pre>
                        <p><em>Verifique os logs do servidor para mais detalhes</em></p>
                    </div>
                `;
                $('#sync-result').html(resultHtml);
            } else {
                $('#sync-result').html(`
                    <div class="notice notice-error">
                        <h4>❌ Erro no teste wp/states</h4>
                        <p>${response.data.message}</p>
                        <p><em>Verifique os logs do servidor para mais detalhes</em></p>
                    </div>
                `);
            }
        }).fail(function(xhr, status, error) {
            console.log('💥 Erro AJAX no teste wp/states:', {xhr: xhr, status: status, error: error});
            $btn.prop('disabled', false).html(originalHtml);
            $('#sync-result').html(`
                <div class="notice notice-error">
                    <h4>❌ Erro de conexão no teste</h4>
                    <p>Erro AJAX: ${error}</p>
                </div>
            `);
        });
    });
});

