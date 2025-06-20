/**
 * Bulbo Raiz Plugin JavaScript
 * Integração com API Laravel para cadastro de leads e busca de distribuidores
 */

jQuery(document).ready(function($) {
    
    // Inicializar formulário
    initBulboRaizForm();
    
    function initBulboRaizForm() {
        // Carregar estados inicialmente
        loadStates();
        
        // Aplicar máscara de telefone
        $('#bulbo_phone').on('input', function() {
            let value = $(this).val().replace(/\D/g, '');
            
            if (value.length <= 11) {
                // Formato: (11) 99999-9999
                value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                if (value.length < 14) {
                    // Formato: (11) 9999-9999
                    value = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
                }
            }
            
            $(this).val(value);
        });
        
        // Event listeners para dependência entre campos
        $('#bulbo_state').on('change', function() {
            const stateId = $(this).val();
            if (stateId) {
                enableCityField();
                resetCityField(); // Reset both normal select and search interface
                loadCities(stateId);
                // Desabilitar campo bairro quando muda estado
                disableNeighborhoodField();
            } else {
                disableCityField();
                disableNeighborhoodField();
            }
        });
        
        $('#bulbo_city').on('change', function() {
            const cityId = $(this).val();
            const cityName = $('#bulbo_city option:selected').text();
            
            console.log('City changed:', cityId, cityName); // Debug
            
            if (cityId) {
                // Habilitar campo bairro após seleção da cidade
                enableNeighborhoodField();
                // Configurar lógica de busca baseada na cidade
                setupNeighborhoodSearch(cityId, cityName);
            } else {
                disableNeighborhoodField();
            }
        });
        
        // Lógica para o link "escrever manualmente"
        $(document).on('click', '#manual-neighborhood-link', function(e) {
            e.preventDefault();
            enableManualNeighborhoodInput();
        });
        
        // Submit do formulário
        $('#bulbo-raiz-form').on('submit', function(e) {
            e.preventDefault();
            submitForm();
        });
        
        // Adicionar validação em tempo real
        $('.bulbo-raiz-input, .bulbo-raiz-select').on('blur', function() {
            validateField($(this));
        });
        
        // Limpar estados de erro ao digitar
        $('.bulbo-raiz-input, .bulbo-raiz-select').on('input change', function() {
            const $fieldGroup = $(this).closest('.bulbo-raiz-field-group');
            $fieldGroup.removeClass('error');
        });
    }
    
    function loadStates() {
        const $select = $('#bulbo_state');
        $select.empty().append('<option value="">Carregando estados...</option>');
        
        $.ajax({
            url: bulbo_raiz_ajax.ajax_url,
            method: 'POST',
            data: {
                action: 'bulbo_raiz_get_states',
                nonce: bulbo_raiz_ajax.nonce
            },
            timeout: 15000, // 15 segundos de timeout
            beforeSend: function() {
            },
            success: function(response) {
                if (response.success && response.data) {
                    // Verificar se os dados são array ou objeto e converter se necessário
                    let statesData = response.data;
                    
                    // Se response.data é um objeto com índices numéricos, converter para array
                    if (typeof statesData === 'object' && !Array.isArray(statesData)) {
                        // Filtrar apenas as propriedades numéricas (ignorar 'success' etc)
                        statesData = Object.keys(statesData)
                            .filter(key => !isNaN(key)) // Apenas chaves numéricas
                            .map(key => statesData[key]); // Mapear para array
                    }
                    
                    if (Array.isArray(statesData) && statesData.length > 0) {
                        populateStates(statesData);
                    } else {
                        $select.empty().append('<option value="">Nenhum estado encontrado</option>');
                        showMessage('Nenhum estado encontrado', 'error');
                    }
                } else {
                    $select.empty().append('<option value="">Erro ao carregar estados</option>');
                    showMessage(response.data && response.data.message ? response.data.message : 'Erro desconhecido ao carregar estados', 'error');
                }
            },
            error: function() {
                $select.empty().append('<option value="">Erro ao carregar estados</option>');
                showMessage('Erro ao carregar estados. Verifique sua conexão com a internet.', 'error');
            }
        });
    }
    
    function populateStates(states) {
        const $select = $('#bulbo_state');
        $select.empty().append('<option value="">Selecione seu estado</option>');
        
        if (states && states.length > 0) {
            states.forEach(function(state) {
                $select.append(`<option value="${state.id}">${state.name}</option>`);
            });
        } else {
            $select.append('<option value="">Nenhum estado encontrado</option>');
        }
    }
    
    function loadCities(stateId) {
        const $select = $('#bulbo_city');
        const $fieldGroup = $select.closest('.bulbo-raiz-field-group');
        
        // Limpar qualquer interface de busca existente
        $fieldGroup.find('.city-search-container').remove();
        
        // Mostrar loading
        $select.empty().append('<option value="">Carregando cidades...</option>');
        
        // Configurar interface de busca
        setupCitySearchInterface($fieldGroup, stateId);
    }
    
         function setupCitySearchInterface($fieldGroup, stateId) {
         const $select = $fieldGroup.find('#bulbo_city');
        
        // Esconder o select original
        $select.hide();
        
        // Criar input de busca
        const $searchContainer = $(
            `<div class="city-search-container">
                <input type="text" 
                       class="city-search-input bulbo-raiz-input" 
                       placeholder="Digite pelo menos 3 letras da cidade" 
                       autocomplete="off"
                       data-state-id="${stateId}">
                <div class="search-results"></div>
                <div class="search-loading" style="display:none;">
                    <div class="loading-spinner">🔄</div>
                    Buscando cidades...
                </div>
            </div>`
        );
        
        $select.after($searchContainer);
        const $searchInput = $searchContainer.find('.city-search-input');
        const $searchResults = $searchContainer.find('.search-results');
        const $searchLoading = $searchContainer.find('.search-loading');
        
        // Cache para resultados de busca
        const searchCache = new Map();
        let searchTimeout;
        let currentRequest;
        
        // Debounce para busca (aguarda 300ms após parar de digitar)
        $searchInput.on('input', function() {
            const searchTerm = $(this).val().trim();
            
            // Cancelar timeout anterior
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            
            // Cancelar requisição anterior se ainda estiver pendente
            if (currentRequest && currentRequest.readyState !== 4) {
                currentRequest.abort();
            }
            
            // Limpar resultados anteriores apenas se o termo for muito curto
            if (searchTerm.length < 3) {
                $searchResults.removeClass('show').hide();
                $searchLoading.hide();
                
                if (searchTerm.length > 0) {
                    $searchResults.html('<div class="search-message">Digite pelo menos 3 letras</div>').addClass('show').show();
                }
                return;
            }
            
            // Verificar cache primeiro
            const cacheKey = `${stateId}-${searchTerm.toLowerCase()}`;
            if (searchCache.has(cacheKey)) {
                const cachedResult = searchCache.get(cacheKey);
                $searchLoading.hide();
                displayCitySearchResults($searchResults, cachedResult);
                return;
            }
            
            // Aguardar 300ms antes de fazer a busca
            searchTimeout = setTimeout(() => {
                $searchLoading.show();
                $searchResults.removeClass('show').hide(); // Esconder resultados antigos só quando começar nova busca
                performCitySearch(searchTerm, stateId, $searchResults, searchCache, cacheKey);
            }, 300);
        });
        
        // Remover a lógica de blur problemática e simplificar o controle de foco
        $searchInput.on('blur', function() {
            // Só esconder se realmente não há interação com os resultados
            setTimeout(() => {
                if (!$searchResults.is(':hover') && !$(document.activeElement).closest('.city-search-container').length) {
                    // Só esconde se não tiver resultados selecionados ou se não estiver interagindo
                    const hasSelectedCity = $searchInput.prop('readonly');
                    if (!hasSelectedCity) {
                        $searchResults.removeClass('show').hide();
                    }
                }
            }, 150);
        });
        
        // Mostrar resultados quando ganhar foco (se houver)
        $searchInput.on('focus', function() {
            if ($searchResults.find('.city-result-item').length > 0 || $searchResults.find('.city-selected').length > 0) {
                $searchResults.addClass('show').show();
            }
        });
        
        // Permitir clique nos resultados sem perder foco
        $searchResults.on('mousedown', function(e) {
            e.preventDefault(); // Previne que o input perca foco
        });
    }
    
    function performCitySearch(searchTerm, stateId, $searchResults, searchCache, cacheKey) {
        const $searchLoading = $('.city-search-container .search-loading');
        
        currentRequest = $.ajax({
            url: bulbo_raiz_ajax.ajax_url,
            method: 'POST',
            timeout: 10000, // 10 segundos de timeout
            data: {
                action: 'bulbo_raiz_get_cities',
                nonce: bulbo_raiz_ajax.nonce,
                state_id: stateId,
                search: searchTerm
            },
            success: function(response) {
                $searchLoading.hide();
                
                if (response.success && response.data) {
                    // Armazenar no cache (máximo 50 entradas por estado)
                    if (searchCache.size < 50) {
                        searchCache.set(cacheKey, response.data);
                    }
                    
                    // Garantir que os resultados sejam exibidos após busca bem-sucedida
                    displayCitySearchResults($searchResults, response.data);
                    
                    // Forçar exibição com múltiplas verificações
                    setTimeout(() => {
                        if (!$searchResults.hasClass('show') || !$searchResults.is(':visible')) {
                            $searchResults.addClass('show').show();
                        }
                    }, 10);
                    
                } else {
                    $searchResults.html(`<div class="search-error">❌ ${response.data?.message || 'Erro na busca'}</div>`).addClass('show').show();
                }
            },
            error: function(xhr) {
                $searchLoading.hide();
                
                if (xhr.statusText !== 'abort') { // Não mostrar erro se foi cancelado
                    let errorMessage = '';
                    if (xhr.status === 0) {
                        errorMessage = '<div class="search-error">❌ Conexão perdida. Verifique sua internet.</div>';
                    } else if (xhr.status === 408 || xhr.statusText === 'timeout') {
                        errorMessage = '<div class="search-error">❌ Busca demorou muito. Tente termos mais específicos.</div>';
                    } else {
                        errorMessage = '<div class="search-error">❌ Erro na busca. Tente novamente.</div>';
                    }
                    $searchResults.html(errorMessage).addClass('show').show();
                }
            }
        });
    }
    
    function displayCitySearchResults($container, data) {
        const { cities, message, total_results } = data;
        
        if (!cities || cities.length === 0) {
            $container.html('<div class="search-message">Nenhuma cidade encontrada</div>').addClass('show').show();
            return;
        }
        
        let html = '';
        
        if (message) {
            html += `<div class="search-info-result">${message}</div>`;
        }
        
        html += '<div class="city-results">';
        cities.forEach(city => {
            html += `
                <div class="city-result-item" data-city-id="${city.id}" data-city-name="${city.name}">
                    📍 ${city.name}
                </div>
            `;
        });
        html += '</div>';
        
        $container.html(html).addClass('show').show(); // Garantir que seja exibido
        
        // Handle city selection
        $container.find('.city-result-item').on('click', function() {
            const cityId = $(this).data('city-id');
            const cityName = $(this).data('city-name');
            
            selectCityFromSearch(cityId, cityName);
            
            // Mark as selected
            $container.find('.city-result-item').removeClass('selected');
            $(this).addClass('selected');
        });
    }
    
    function selectCityFromSearch(cityId, cityName) {
        // Update hidden select
        const $select = $('#bulbo_city');
        $select.empty().append(`<option value="${cityId}" selected>${cityName}</option>`);
        
        // Trigger change event manually to activate neighborhood field
        $select.trigger('change');
        
        // Update search input
        $('.city-search-input').val(cityName).prop('readonly', true);
        
        // Show success feedback
        const $container = $('.city-search-container .search-results');
        $container.html(`
            <div class="city-selected">
                ✅ <strong>${cityName}</strong> selecionada
                <button type="button" class="change-city-btn">Alterar</button>
            </div>
        `).addClass('show').show(); // Garantir que seja sempre visível
        
        // Add change city handler
        $container.find('.change-city-btn').on('click', function() {
            $('.city-search-input').prop('readonly', false).val('').focus();
            $container.removeClass('show').hide();
            disableNeighborhoodField();
        });
        
        // Não esconder automaticamente o feedback de seleção
        // O usuário pode clicar em "Alterar" se quiser mudar
    }
    
    function resetCityField() {
        const $select = $('#bulbo_city');
        const $fieldGroup = $select.closest('.bulbo-raiz-field-group');
        
        // Remove existing search container
        $fieldGroup.find('.city-search-container').remove();
        
        // Reset and show original select
        $select.empty().append('<option value="">Selecione primeiro o estado</option>');
        $select.show();
    }
    
    function enableCityField() {
        const $citySelect = $('#bulbo_city');
        $citySelect.prop('disabled', false).prop('required', true);
    }
    
    function disableCityField() {
        const $citySelect = $('#bulbo_city');
        $citySelect.val('').prop('disabled', true).prop('required', false);
        // Limpar interface de busca se existir
        $('#city-field-group .city-search-container').remove();
    }
    
    function resetNeighborhoodField() {
        const $searchInput = $('#bulbo_neighborhood_search');
        const $searchResults = $('#neighborhood-search-results');
        const $notFound = $('#neighborhood-not-found');
        const $hiddenId = $('#selected_neighborhood_id');
        const $hiddenName = $('#selected_neighborhood_name');
        const $help = $('#neighborhood-help');
        
        $searchInput.val('').prop('disabled', true).prop('required', false);
        $searchResults.hide().empty();
        $notFound.hide();
        $hiddenId.val('');
        $hiddenName.val('');
        $help.text('Selecione primeiro a cidade.');
    }
    
    function enableNeighborhoodField() {
        const $searchInput = $('#bulbo_neighborhood_search');
        const $help = $('#neighborhood-help');
        
        $searchInput.prop('disabled', false).prop('required', true);
        $help.text('Digite o nome do seu bairro.');
    }
    
    function disableNeighborhoodField() {
        resetNeighborhoodField();
    }
    
    function validateField($field) {
        const $fieldGroup = $field.closest('.bulbo-raiz-field-group');
        const value = $field.val().trim();
        const isRequired = $field.prop('required');
        let isValid = true;
        
        if (isRequired && !value) {
            isValid = false;
        }
        
        // Validação específica para email
        if ($field.attr('type') === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
            }
        }
        
        // Validação específica para telefone
        if ($field.attr('type') === 'tel' && value) {
            // Aceitar telefones com ou sem máscara (mínimo 10 dígitos)
            const phoneDigits = value.replace(/\D/g, '');
            if (phoneDigits.length < 10 || phoneDigits.length > 11) {
                isValid = false;
            }
        }
        
        if (isValid) {
            $fieldGroup.removeClass('error').addClass('success');
        } else {
            $fieldGroup.removeClass('success').addClass('error');
        }
        
        return isValid;
    }
    
    function validateForm() {
        let isValid = true;
        const requiredFields = $('#bulbo-raiz-form .bulbo-raiz-input[required], #bulbo-raiz-form .bulbo-raiz-select[required]');
        
        requiredFields.each(function() {
            if (!validateField($(this))) {
                isValid = false;
            }
        });

        // Validação especial para bairro - sempre obrigatório
        const $neighborhoodSearch = $('#bulbo_neighborhood_search');
        const $hiddenId = $('#selected_neighborhood_id');
        const $hiddenName = $('#selected_neighborhood_name');
        const $neighGroup = $('#neighborhood-field-group');
        
        const searchValue = $neighborhoodSearch.val().trim();
        const hiddenIdValue = $hiddenId.val();
        const hiddenNameValue = $hiddenName.val().trim();
        
        // Precisa ter pelo menos o valor no input de busca OU nos campos ocultos
        if (!searchValue && !hiddenIdValue && !hiddenNameValue) {
            $neighGroup.removeClass('success').addClass('error');
            isValid = false;
        } else {
            $neighGroup.removeClass('error').addClass('success');
        }
        
        return isValid;
    }
    
    function submitForm() {
        // Validar formulário
        if (!validateForm()) {
            showMessage('Por favor, preencha todos os campos obrigatórios corretamente.', 'error');
            return;
        }
        
        const $form = $('#bulbo-raiz-form');
        const $submitBtn = $('#bulbo-submit-btn');
        const $btnText = $submitBtn.find('.bulbo-raiz-btn-text');
        const $loading = $submitBtn.find('.bulbo-raiz-loading');
        
        // Mostrar loading
        $submitBtn.prop('disabled', true);
        $btnText.hide();
        $loading.show();
        showOverlay(true);
        
        // Coletar dados do formulário
        const neighborhoodId = $('#selected_neighborhood_id').val();
        const neighborhoodCustom = $('#selected_neighborhood_name').val().trim();
        const neighborhoodSearch = $('#bulbo_neighborhood_search').val().trim();
        
        const formData = {
            service_type: $('#bulbo_service_type').val(),
            name: $('#bulbo_name').val().trim(),
            email: $('#bulbo_email').val().trim(),
            phone: $('#bulbo_phone').val().trim(),
            state_id: $('#bulbo_state').val(),
            city_id: $('#bulbo_city').val(),
            neighborhood_id: neighborhoodId || null,
            neighborhood_custom: neighborhoodCustom || neighborhoodSearch || null,
            source: 'wordpress_plugin',
            nonce: $('#bulbo_raiz_nonce').val()
        };
        
        // Enviar via AJAX para o WordPress
        $.ajax({
            url: bulbo_raiz_ajax.ajax_url,
            method: 'POST',
            data: {
                action: 'bulbo_raiz_submit',
                nonce: bulbo_raiz_ajax.nonce,
                form_data: formData
            },
            success: function(response) {
                if (response.success) {
                    showSuccessResult(response.data);
                    $form[0].reset();
                    $('.bulbo-raiz-field-group').removeClass('success error');
                    // Desabilitar campos dependentes após reset
                    disableCityField();
                    disableNeighborhoodField();
                    // Recarregar estados
                    loadStates();
                } else {
                    showMessage(response.data.message || 'Erro ao processar sua solicitação.', 'error');
                }
            },
            error: function() {
                showMessage('Erro ao processar sua solicitação. Tente novamente em alguns instantes.', 'error');
            },
            complete: function() {
                // Restaurar botão
                $submitBtn.prop('disabled', false);
                $loading.hide();
                $btnText.show();
                showOverlay(false);
            }
        });
    }
    
    function showSuccessResult(data) {
        const $result = $('#bulbo-result');
        let template = $('#bulbo-success-template').html();
        
        // Garantir que temos os dados necessários
        const nome = (data.form_data && data.form_data.name) ? data.form_data.name : '';
        const estado = (data.form_data && data.form_data.state_name) ? data.form_data.state_name : '';
        const cidade = (data.form_data && data.form_data.city_name) ? data.form_data.city_name : '';
        const motivo = (data.form_data && data.form_data.service_type_label) ? data.form_data.service_type_label : (data.service_type || '');
        const whatsappNumber = data.whatsapp || 'Não disponível';

        // Montar mensagem personalizada
        let mensagem = `Olá, sou a ${nome}`;
        if (estado || cidade) {
            mensagem += ` e moro em`;
            if (estado && cidade) {
                mensagem += ` ${estado}, ${cidade}`;
            } else if (estado) {
                mensagem += ` ${estado}`;
            } else if (cidade) {
                mensagem += ` ${cidade}`;
            }
        }
        mensagem += ` e estou entrando em contato pelo site pelo motivo \"${motivo}\".`;

        // Substituir todos os placeholders no template
        template = template.replace(/{{whatsapp_url}}/g, '#'); // placeholder, será substituído abaixo

        // Criar URL do WhatsApp
        if (data.whatsapp && data.whatsapp !== 'Não disponível') {
            const cleanWhatsapp = data.whatsapp.replace(/\D/g, '');
            const message = encodeURIComponent(mensagem);
            const whatsappUrl = `https://wa.me/55${cleanWhatsapp}?text=${message}`;
            template = template.replace(/#/, whatsappUrl);
        }

        $result.html(template).show();

        // Scroll para o resultado
        $result[0].scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
    
    function showMessage(message, type = 'info') {
        const $error = $('#bulbo-error');
        $error.html(`<p>${message}</p>`);
        
        if (type === 'error') {
            $error.show();
            // Scroll para a mensagem de erro
            $error[0].scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        } else if (type === 'info') {
            $error.show();
            // Auto-hide info messages after 5 seconds
            setTimeout(() => {
                $error.fadeOut();
            }, 5000);
        } else {
            $error.hide();
        }
    }
    
    function showOverlay(show) {
        const $overlay = $('#bulbo-overlay');
        if (show) {
            $overlay.fadeIn(300);
        } else {
            $overlay.fadeOut(300);
        }
    }
    
    // Função global para copiar WhatsApp
    window.bulboRaizCopyWhatsApp = function(whatsapp) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(whatsapp).then(function() {
                showCopySuccess();
            }).catch(function(err) {
                fallbackCopyTextToClipboard(whatsapp);
            });
        } else {
            fallbackCopyTextToClipboard(whatsapp);
        }
    };
    
    function showCopySuccess() {
        // Criar uma notificação visual temporária
        const notification = $('<div>')
            .addClass('bulbo-raiz-copy-notification')
            .text('✅ Número copiado!')
            .css({
                position: 'fixed',
                top: '20px',
                right: '20px',
                background: '#10b981',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                zIndex: '9999',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            });
        
        $('body').append(notification);
        
        // Remover após 3 segundos
        setTimeout(() => {
            notification.fadeOut(300, function() {
                $(this).remove();
            });
        }, 3000);
    }
    
    function fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        textArea.style.pointerEvents = "none";
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showCopySuccess();
            } else {
                showCopyError(text);
            }
        } catch (err) {
            showCopyError(text);
        }
        
        document.body.removeChild(textArea);
    }
    
    function showCopyError(text) {
        alert('Não foi possível copiar automaticamente. Copie manualmente: ' + text);
    }
    
    function setupNeighborhoodSearch(cityId, cityName) {
        const $searchInput = $('#bulbo_neighborhood_search');
        const $searchResults = $('#neighborhood-search-results');
        const $notFound = $('#neighborhood-not-found');
        const $help = $('#neighborhood-help');
        
        // Verificar se é São Paulo/SP
        const isSaoPauloSP = cityName.toLowerCase().includes('são paulo') && 
                            $('#bulbo_state option:selected').text().toLowerCase().includes('são paulo');
        
        if (isSaoPauloSP) {
            // São Paulo/SP - busca inteligente
            $help.html('Digite o nome do seu bairro. <span style="color: #10b981;">Para São Paulo, buscaremos distribuidores próximos.</span>');
            setupSaoPauloSearch(cityId);
        } else {
            // Outras cidades - input manual apenas
            $help.text('Digite o nome do seu bairro.');
            setupManualNeighborhoodInput();
        }
    }
    
    function setupSaoPauloSearch(cityId) {
        const $searchInput = $('#bulbo_neighborhood_search');
        const $searchResults = $('#neighborhood-search-results');
        const $notFound = $('#neighborhood-not-found');
        
        let searchTimeout;
        let searchCache = new Map();
        
        // Remover listeners anteriores
        $searchInput.off('input.neighborhood');
        
        // Listener para busca em tempo real
        $searchInput.on('input.neighborhood', function() {
            const searchTerm = $(this).val().trim();
            
            clearTimeout(searchTimeout);
            $searchResults.hide().empty();
            $notFound.hide();
            
            if (searchTerm.length < 2) {
                if (searchTerm.length === 1) {
                    // Mostrar dica para digitar mais caracteres
                    $searchResults.html(`
                        <div style="padding: 15px; text-align: center; color: #666;">
                            <div style="font-size: 14px;">💡</div>
                            <div style="margin-top: 5px; font-size: 13px;">Digite pelo menos 2 caracteres</div>
                        </div>
                    `).show();
                }
                return;
            }
            
            // Mostrar indicador de que vai buscar
            $searchResults.html(`
                <div style="padding: 10px; text-align: center; color: #666; font-size: 12px;">
                    ⏳ Buscando em ${((300 - (Date.now() % 300)) / 100).toFixed(1)}s...
                </div>
            `).show();
            
            // Debounce reduzido para 200ms para busca mais responsiva
            searchTimeout = setTimeout(function() {
                performNeighborhoodSearch(searchTerm, cityId, searchCache);
            }, 200);
        });
        
        // Adicionar listener para teclas especiais
        $searchInput.on('keydown.neighborhood', function(e) {
            const $results = $('#neighborhood-search-results');
            const $items = $results.find('.neighborhood-item');
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const $selected = $items.filter('.selected');
                const nextIndex = $selected.length ? $selected.index() + 1 : 0;
                
                $items.removeClass('selected');
                if (nextIndex < $items.length) {
                    $items.eq(nextIndex).addClass('selected');
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const $selected = $items.filter('.selected');
                const prevIndex = $selected.length ? $selected.index() - 1 : $items.length - 1;
                
                $items.removeClass('selected');
                if (prevIndex >= 0) {
                    $items.eq(prevIndex).addClass('selected');
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const $selected = $items.filter('.selected');
                if ($selected.length) {
                    $selected.click();
                }
            }
        });
    }
    
    function performNeighborhoodSearch(searchTerm, cityId, searchCache) {
        const $searchResults = $('#neighborhood-search-results');
        const $notFound = $('#neighborhood-not-found');
        
        // Verificar cache
        const cacheKey = `${cityId}_${searchTerm.toLowerCase()}`;
        if (searchCache.has(cacheKey)) {
            displayNeighborhoodResults(searchCache.get(cacheKey));
            return;
        }
        
        // Mostrar loading com contador de caracteres
        $searchResults.show().html(`
            <div style="padding: 15px; text-align: center; color: #666;">
                <span style="animation: spin 1s linear infinite; font-size: 16px;">🔄</span> 
                <div style="margin-top: 8px;">Buscando "${searchTerm}"...</div>
            </div>
        `);
        
        $.ajax({
            url: bulbo_raiz_ajax.ajax_url,
            method: 'POST',
            data: {
                action: 'bulbo_raiz_get_neighborhoods',
                nonce: bulbo_raiz_ajax.nonce,
                city_id: cityId,
                search: searchTerm
            },
            success: function(response) {
                if (response.success && response.data) {
                    // Cache do resultado
                    searchCache.set(cacheKey, response.data);
                    displayNeighborhoodResults(response.data, searchTerm);
                } else {
                    showNoNeighborhoodsFound(searchTerm);
                }
            },
            error: function() {
                showNoNeighborhoodsFound(searchTerm);
            }
        });
    }
    
    function displayNeighborhoodResults(neighborhoods, searchTerm = '') {
        const $searchResults = $('#neighborhood-search-results');
        const $notFound = $('#neighborhood-not-found');
        
        if (neighborhoods && neighborhoods.length > 0) {
            let html = '<div class="neighborhood-results">';
            
            // Adicionar cabeçalho com contador se há busca
            if (searchTerm) {
                const count = neighborhoods.length;
                const maxResults = count >= 50 ? ' (máximo 50)' : '';
                html += `<div style="padding: 8px 16px; background: #f8f9fa; border-bottom: 1px solid #e9ecef; font-size: 12px; color: #666;">
                    ${count} resultado${count !== 1 ? 's' : ''} para "${searchTerm}"${maxResults}
                </div>`;
            }
            
            neighborhoods.forEach(function(neighborhood) {
                // Destacar termo de busca no nome
                let displayName = neighborhood.name;
                if (searchTerm) {
                    const regex = new RegExp(`(${searchTerm})`, 'gi');
                    displayName = displayName.replace(regex, '<strong style="background: #fff3cd;">$1</strong>');
                }
                
                html += `<div class="neighborhood-item" data-id="${neighborhood.id}" data-name="${neighborhood.name}">
                    <span class="neighborhood-name">${displayName}</span>
                </div>`;
            });
            html += '</div>';
            
            $searchResults.html(html).show();
            $notFound.hide();
            
            // Listener para seleção
            $searchResults.find('.neighborhood-item').on('click', function() {
                const id = $(this).data('id');
                const name = $(this).data('name');
                selectNeighborhood(id, name);
            });
        } else {
            showNoNeighborhoodsFound(searchTerm);
        }
    }
    
    function showNoNeighborhoodsFound(searchTerm = '') {
        const $searchResults = $('#neighborhood-search-results');
        const $notFound = $('#neighborhood-not-found');
        
        // Mostrar mensagem na div de resultados também
        let message = 'Nenhum bairro encontrado';
        if (searchTerm) {
            message += ` para "${searchTerm}"`;
        }
        
        $searchResults.html(`
            <div style="padding: 20px; text-align: center; color: #666;">
                <div style="font-size: 16px; margin-bottom: 8px;">📍</div>
                <div>${message}</div>
                <div style="margin-top: 10px; font-size: 12px;">
                    Tente usar menos caracteres ou 
                    <a href="#" id="manual-neighborhood-link-inline" style="color: #0073aa; text-decoration: underline;">
                        escreva manualmente
                    </a>
                </div>
            </div>
        `).show();
        
        // Adicionar listener para o link inline
        $searchResults.find('#manual-neighborhood-link-inline').on('click', function(e) {
            e.preventDefault();
            enableManualNeighborhoodInput();
        });
        
        $notFound.show();
    }
    
    function selectNeighborhood(id, name) {
        const $searchInput = $('#bulbo_neighborhood_search');
        const $searchResults = $('#neighborhood-search-results');
        const $hiddenId = $('#selected_neighborhood_id');
        const $hiddenName = $('#selected_neighborhood_name');
        
        $searchInput.val(name);
        $hiddenId.val(id);
        $hiddenName.val(''); // Limpar custom name pois selecionou da lista
        $searchResults.hide();
        $('#neighborhood-not-found').hide();
    }
    
    function setupManualNeighborhoodInput() {
        const $searchInput = $('#bulbo_neighborhood_search');
        
        // Remover listeners de busca
        $searchInput.off('input.neighborhood');
        
        // Adicionar listener para input manual
        $searchInput.on('input.manual', function() {
            const value = $(this).val().trim();
            $('#selected_neighborhood_id').val('');
            $('#selected_neighborhood_name').val(value);
        });
    }
    
    function enableManualNeighborhoodInput() {
        const $searchInput = $('#bulbo_neighborhood_search');
        const $searchResults = $('#neighborhood-search-results');
        const $notFound = $('#neighborhood-not-found');
        const $help = $('#neighborhood-help');
        
        // Esconder resultados e mensagem
        $searchResults.hide();
        $notFound.hide();
        
        // Alterar placeholder e help
        $searchInput.attr('placeholder', 'Digite o nome do seu bairro manualmente');
        $help.html('<span style="color: #10b981;">Modo manual ativado. Digite o nome do seu bairro.</span>');
        
        // Configurar input manual
        setupManualNeighborhoodInput();
        
        // Focar no input
        $searchInput.focus();
    }
    

});