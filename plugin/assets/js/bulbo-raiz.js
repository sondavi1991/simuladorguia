/**
 * Bulbo Raiz Plugin JavaScript
 * Integração com API Laravel para cadastro de leads e busca de distribuidores
 */

jQuery(document).ready(function($) {
    
    // Configuração de autenticação similar ao frontend
    const BulboRaizAuth = {
        token: null,
        apiUrl: bulbo_raiz_ajax.api_url || 'https://bakbulbo.sitesobmedida.com.br/api',
        
        // Fazer requisição autenticada (como o frontend)
        async makeRequest(endpoint, options = {}) {
            const url = endpoint.startsWith('http') ? endpoint : `${this.apiUrl}/${endpoint.replace(/^\//, '')}`;
            
            const defaultOptions = {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            };
            
            // Adicionar token se disponível
            if (this.token) {
                defaultOptions.headers['Authorization'] = `Bearer ${this.token}`;
            }
            
            const finalOptions = { ...defaultOptions, ...options };
            
            if (bulbo_raiz_ajax.debug) {
                console.log('Bulbo Raiz: Fazendo requisição para:', url);
                console.log('Bulbo Raiz: Options:', finalOptions);
            }
            
            try {
                const response = await fetch(url, finalOptions);
                
                if (bulbo_raiz_ajax.debug) {
                    console.log('Bulbo Raiz: Resposta status:', response.status);
                }
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                return await response.json();
            } catch (error) {
                if (bulbo_raiz_ajax.debug) {
                    console.error('Bulbo Raiz: Erro na requisição:', error);
                }
                throw error;
            }
        },
        
        // Testar conexão com API
        async testConnection() {
            try {
                const response = await this.makeRequest('test');
                return response;
            } catch (error) {
                console.error('Erro ao testar conexão:', error);
                return false;
            }
        }
    };
    
    // Funções originais do plugin mantidas...
    var currentStep = 0;
    var currentData = {};
    
    function loadStates() {
        if (bulbo_raiz_ajax.debug) {
            console.log('Carregando estados...');
        }
        
        $.ajax({
            url: bulbo_raiz_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'bulbo_raiz_get_states',
                nonce: bulbo_raiz_ajax.nonce
            },
            success: function(response) {
                if (response.success) {
                    var states = response.data;
                    var stateSelect = $('#bulbo_raiz_state');
                    stateSelect.empty().append('<option value="">Selecione um estado</option>');
                    
                    $.each(states, function(index, state) {
                        stateSelect.append('<option value="' + state.id + '">' + state.name + '</option>');
                    });
                    
                    if (bulbo_raiz_ajax.debug) {
                        console.log('Estados carregados:', states.length);
                    }
                } else {
                    console.error('Erro ao carregar estados:', response.data);
                    showError('Erro ao carregar estados: ' + response.data.message);
                }
            },
            error: function(xhr, status, error) {
                console.error('Erro AJAX ao carregar estados:', error);
                showError('Erro de conexão ao carregar estados');
            }
        });
    }
    
    function loadCities(stateId) {
        if (!stateId) return;
        
        if (bulbo_raiz_ajax.debug) {
            console.log('Carregando cidades para estado:', stateId);
        }
        
        var citySelect = $('#bulbo_raiz_city');
        var neighborhoodSelect = $('#bulbo_raiz_neighborhood');
        
        citySelect.empty().append('<option value="">Carregando...</option>');
        neighborhoodSelect.empty().append('<option value="">Primeiro selecione uma cidade</option>');
        
        $.ajax({
            url: bulbo_raiz_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'bulbo_raiz_get_cities',
                state_id: stateId,
                nonce: bulbo_raiz_ajax.nonce
            },
            success: function(response) {
                if (response.success) {
                    var cities = response.data;
                    citySelect.empty().append('<option value="">Selecione uma cidade</option>');
                    
                    $.each(cities, function(index, city) {
                        citySelect.append('<option value="' + city.id + '">' + city.name + '</option>');
                    });
                    
                    if (bulbo_raiz_ajax.debug) {
                        console.log('Cidades carregadas:', cities.length);
                    }
                } else {
                    console.error('Erro ao carregar cidades:', response.data);
                    citySelect.empty().append('<option value="">Erro ao carregar cidades</option>');
                }
            },
            error: function(xhr, status, error) {
                console.error('Erro AJAX ao carregar cidades:', error);
                citySelect.empty().append('<option value="">Erro de conexão</option>');
            }
        });
    }
    
    function loadNeighborhoods(cityId) {
        if (!cityId) return;
        
        if (bulbo_raiz_ajax.debug) {
            console.log('Carregando bairros para cidade:', cityId);
        }
        
        var neighborhoodSelect = $('#bulbo_raiz_neighborhood');
        neighborhoodSelect.empty().append('<option value="">Carregando...</option>');
        
        $.ajax({
            url: bulbo_raiz_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'bulbo_raiz_get_neighborhoods',
                city_id: cityId,
                nonce: bulbo_raiz_ajax.nonce
            },
            success: function(response) {
                if (response.success) {
                    var neighborhoods = response.data;
                    neighborhoodSelect.empty().append('<option value="">Selecione um bairro</option>');
                    
                    $.each(neighborhoods, function(index, neighborhood) {
                        neighborhoodSelect.append('<option value="' + neighborhood.id + '">' + neighborhood.name + '</option>');
                    });
                    
                    // Adicionar opção "Outro"
                    neighborhoodSelect.append('<option value="outro">Outro (digite o nome)</option>');
                    
                    if (bulbo_raiz_ajax.debug) {
                        console.log('Bairros carregados:', neighborhoods.length);
                    }
                } else {
                    console.error('Erro ao carregar bairros:', response.data);
                    neighborhoodSelect.empty().append('<option value="">Erro ao carregar bairros</option>');
                }
            },
            error: function(xhr, status, error) {
                console.error('Erro AJAX ao carregar bairros:', error);
                neighborhoodSelect.empty().append('<option value="">Erro de conexão</option>');
            }
        });
    }
    
    function showError(message) {
        var errorDiv = $('#bulbo_raiz_error');
        if (errorDiv.length === 0) {
            errorDiv = $('<div id="bulbo_raiz_error" class="bulbo-raiz-error"></div>');
            $('.bulbo-raiz-form').prepend(errorDiv);
        }
        errorDiv.text(message).show();
        
        setTimeout(function() {
            errorDiv.fadeOut();
        }, 5000);
    }
    
    function showSuccess(message) {
        var successDiv = $('#bulbo_raiz_success');
        if (successDiv.length === 0) {
            successDiv = $('<div id="bulbo_raiz_success" class="bulbo-raiz-success"></div>');
            $('.bulbo-raiz-form').prepend(successDiv);
        }
        successDiv.text(message).show();
        
        setTimeout(function() {
            successDiv.fadeOut();
        }, 5000);
    }
    
    // Event handlers
    $(document).on('change', '#bulbo_raiz_state', function() {
        var stateId = $(this).val();
        if (stateId) {
            loadCities(stateId);
        } else {
            $('#bulbo_raiz_city').empty().append('<option value="">Primeiro selecione um estado</option>');
            $('#bulbo_raiz_neighborhood').empty().append('<option value="">Primeiro selecione uma cidade</option>');
        }
    });
    
    $(document).on('change', '#bulbo_raiz_city', function() {
        var cityId = $(this).val();
        if (cityId) {
            loadNeighborhoods(cityId);
        } else {
            $('#bulbo_raiz_neighborhood').empty().append('<option value="">Primeiro selecione uma cidade</option>');
        }
    });
    
    $(document).on('change', '#bulbo_raiz_neighborhood', function() {
        var value = $(this).val();
        var customInput = $('#bulbo_raiz_neighborhood_custom');
        
        if (value === 'outro') {
            customInput.show().attr('required', true);
        } else {
            customInput.hide().attr('required', false).val('');
        }
    });
    
    $(document).on('submit', '.bulbo-raiz-form', function(e) {
        e.preventDefault();
        
        var form = $(this);
        var submitBtn = form.find('.bulbo-raiz-submit');
        var originalText = submitBtn.text();
        
        // Validate required fields
        var isValid = true;
        form.find('input[required], select[required]').each(function() {
            if (!$(this).val()) {
                isValid = false;
                $(this).addClass('error');
            } else {
                $(this).removeClass('error');
            }
        });
        
        if (!isValid) {
            showError('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        
        // Disable submit button
        submitBtn.text('Enviando...').prop('disabled', true);
        
        // Collect form data
        var formData = {
            service_type: form.find('#bulbo_raiz_service').val(),
            name: form.find('#bulbo_raiz_name').val(),
            email: form.find('#bulbo_raiz_email').val(),
            phone: form.find('#bulbo_raiz_phone').val(),
            state_id: form.find('#bulbo_raiz_state').val(),
            city_id: form.find('#bulbo_raiz_city').val(),
            neighborhood_id: form.find('#bulbo_raiz_neighborhood').val(),
            neighborhood_custom: form.find('#bulbo_raiz_neighborhood_custom').val()
        };
        
        if (bulbo_raiz_ajax.debug) {
            console.log('Enviando dados do formulário:', formData);
        }
        
        $.ajax({
            url: bulbo_raiz_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'bulbo_raiz_submit',
                form_data: formData,
                nonce: bulbo_raiz_ajax.nonce
            },
            success: function(response) {
                if (response.success) {
                    showSuccess(response.data.message);
                    form[0].reset();
                    $('#bulbo_raiz_city').empty().append('<option value="">Primeiro selecione um estado</option>');
                    $('#bulbo_raiz_neighborhood').empty().append('<option value="">Primeiro selecione uma cidade</option>');
                } else {
                    showError(response.data.message || 'Erro ao enviar formulário');
                }
            },
            error: function(xhr, status, error) {
                console.error('Erro AJAX:', error);
                showError('Erro de conexão. Tente novamente.');
            },
            complete: function() {
                submitBtn.text(originalText).prop('disabled', false);
            }
        });
    });
    
    // Initialize
    if ($('.bulbo-raiz-form').length > 0) {
        loadStates();
        
        // Testar conexão se debug estiver ativo
        if (bulbo_raiz_ajax.debug) {
            BulboRaizAuth.testConnection().then(result => {
                if (result) {
                    console.log('Bulbo Raiz: Conexão com API OK:', result);
                } else {
                    console.log('Bulbo Raiz: Falha na conexão com API');
                }
            });
        }
    }
    
    // Expor funções globalmente para debug
    window.BulboRaizAuth = BulboRaizAuth;
});