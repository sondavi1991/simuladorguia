/**
 * Script de teste de conexão para o frontend
 * Adiciona um botão de teste no formulário para diagnosticar problemas
 */

jQuery(document).ready(function($) {
    
    // Adicionar botão de teste ao formulário
    addTestConnectionButton();
    
    function addTestConnectionButton() {
        const $form = $('#bulbo-raiz-form');
        if ($form.length === 0) return;
        
        const $testButton = $(`
            <div class="bulbo-test-connection" style="margin: 20px 0; text-align: center;">
                <button type="button" id="bulbo-test-btn" class="bulbo-test-button" style="
                    background: #007cba;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                    margin-right: 10px;
                ">
                    🔧 Testar Conexão API
                </button>
                <div id="bulbo-test-results" style="margin-top: 15px;"></div>
            </div>
        `);
        
        $form.before($testButton);
        
        // Event listener para o botão
        $('#bulbo-test-btn').on('click', function() {
            testApiConnection();
        });
    }
    
    function testApiConnection() {
        const $button = $('#bulbo-test-btn');
        const $results = $('#bulbo-test-results');
        
        // State do botão
        const originalText = $button.text();
        $button.prop('disabled', true).text('🔄 Testando...');
        
        // Limpar resultados anteriores
        $results.html('');
        
        // Array de testes a serem executados
        const tests = [
            {
                name: 'Conectividade Básica',
                url: 'https://bakbulbo.sitesobmedida.com.br/api/test',
                method: 'GET'
            },
            {
                name: 'Teste Frontend-Backend',
                url: 'https://bakbulbo.sitesobmedida.com.br/api/frontend-test',
                method: 'GET'
            },
            {
                name: 'Estados (WordPress)',
                url: 'https://bakbulbo.sitesobmedida.com.br/api/wp/states',
                method: 'GET'
            }
        ];
        
        let completedTests = 0;
        const totalTests = tests.length;
        
        // Mostrar progresso
        $results.html(`
            <div class="test-progress" style="
                background: #f0f0f1;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 15px;
            ">
                <h4>🧪 Executando Testes (0/${totalTests})</h4>
                <div class="progress-bar" style="
                    background: #ddd;
                    height: 20px;
                    border-radius: 10px;
                    overflow: hidden;
                ">
                    <div class="progress-fill" style="
                        background: #007cba;
                        height: 100%;
                        width: 0%;
                        transition: width 0.3s ease;
                    "></div>
                </div>
            </div>
            <div class="test-results-list"></div>
        `);
        
        // Executar cada teste
        tests.forEach(function(test, index) {
            setTimeout(function() {
                executeTest(test, function(result) {
                    completedTests++;
                    displayTestResult(test, result);
                    
                    // Atualizar progresso
                    const progress = (completedTests / totalTests) * 100;
                    $('.progress-fill').css('width', progress + '%');
                    $('.test-progress h4').text(`🧪 Executando Testes (${completedTests}/${totalTests})`);
                    
                    // Se todos os testes foram completados
                    if (completedTests === totalTests) {
                        $button.prop('disabled', false).text(originalText);
                        
                        // Mostrar resumo
                        const passedTests = $('.test-result.success').length;
                        const failedTests = $('.test-result.error').length;
                        
                        $('.test-progress').html(`
                            <h4>📊 Resumo dos Testes</h4>
                            <p>✅ <strong>Passou:</strong> ${passedTests} | ❌ <strong>Falhou:</strong> ${failedTests}</p>
                            ${failedTests > 0 ? '<p style="color: #d63384;">⚠️ Há problemas de conectividade. Verifique as configurações.</p>' : '<p style="color: #198754;">🎉 Todos os testes passaram! A conexão está funcionando.</p>'}
                        `);
                    }
                });
            }, index * 1000); // Espaçar os testes por 1 segundo
        });
    }
    
    function executeTest(test, callback) {
        const startTime = Date.now();
        
        fetch(test.url, {
            method: test.method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'cors'
        })
        .then(response => {
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            return response.json().then(data => {
                callback({
                    success: response.ok,
                    status: response.status,
                    data: data,
                    duration: duration,
                    error: null
                });
            }).catch(jsonError => {
                callback({
                    success: response.ok,
                    status: response.status,
                    data: null,
                    duration: duration,
                    error: 'Resposta não é JSON válido'
                });
            });
        })
        .catch(error => {
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            callback({
                success: false,
                status: 0,
                data: null,
                duration: duration,
                error: error.message
            });
        });
    }
    
    function displayTestResult(test, result) {
        const $resultsList = $('.test-results-list');
        
        const statusClass = result.success ? 'success' : 'error';
        const statusIcon = result.success ? '✅' : '❌';
        const statusColor = result.success ? '#198754' : '#d63384';
        
        const $testResult = $(`
            <div class="test-result ${statusClass}" style="
                margin-bottom: 15px;
                padding: 15px;
                border: 1px solid ${result.success ? '#badbcc' : '#f5c2c7'};
                border-radius: 5px;
                background: ${result.success ? '#d1e7dd' : '#f8d7da'};
            ">
                <h5 style="margin: 0 0 10px 0; color: ${statusColor};">
                    ${statusIcon} ${test.name}
                </h5>
                <p style="margin: 5px 0; font-size: 14px;">
                    <strong>URL:</strong> <code>${test.url}</code><br>
                    <strong>Status:</strong> ${result.status}<br>
                    <strong>Tempo:</strong> ${result.duration}ms
                </p>
                ${result.error ? `<p style="color: #d63384; margin: 5px 0;"><strong>Erro:</strong> ${result.error}</p>` : ''}
                ${result.data ? `
                    <details style="margin-top: 10px;">
                        <summary style="cursor: pointer; font-weight: bold;">Ver Resposta</summary>
                        <pre style="
                            background: #f8f9fa;
                            padding: 10px;
                            border-radius: 3px;
                            font-size: 12px;
                            overflow-x: auto;
                            margin-top: 10px;
                        ">${JSON.stringify(result.data, null, 2)}</pre>
                    </details>
                ` : ''}
            </div>
        `);
        
        $resultsList.append($testResult);
    }
    
    // Adicionar CSS personalizado
    const customCSS = `
        <style>
        .bulbo-test-button:hover {
            background: #005a87 !important;
        }
        .bulbo-test-button:disabled {
            background: #6c757d !important;
            cursor: not-allowed !important;
        }
        </style>
    `;
    $('head').append(customCSS);
});

// Função global para testar via console
window.bulboTestApi = function() {
    jQuery('#bulbo-test-btn').trigger('click');
}; 