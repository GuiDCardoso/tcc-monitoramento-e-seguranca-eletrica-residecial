// --- LÓGICA DE LOGIN (executado apenas no index.html) ---
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const user = document.getElementById('username').value.trim();
        
        // Simulação de papéis
        let role = 'Morador';
        if (user.toLowerCase() === 'admin') {
            role = 'Administrador';
        }

        // Salva na memória do navegador para usar no dashboard
        localStorage.setItem('currentUser', user);
        localStorage.setItem('currentRole', role);

        // Redireciona para o dashboard
        window.location.href = 'dashboard.html';
    });
}

// --- LÓGICA DO DASHBOARD (executado apenas no dashboard.html) ---
const userNameDisplay = document.getElementById('userNameDisplay');

if (userNameDisplay) {
    // Carrega dados do usuário
    const storedUser = localStorage.getItem('currentUser') || 'Convidado';
    const storedRole = localStorage.getItem('currentRole') || 'Visualizador';
    
    userNameDisplay.textContent = storedUser;
    document.getElementById('userRoleDisplay').textContent = storedRole;

    // Lógica de Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });

    // Configuração do Gráfico Chart.js
    const ctx = document.getElementById('consumoChart').getContext('2d');
    const consumoChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], // Horários
            datasets: [{
                label: 'Consumo de Potência (W)',
                data: [],
                borderColor: '#4A7FA7', // Destaque/Ação
                backgroundColor: 'rgba(74, 127, 167, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: 5000
                }
            },
            animation: {
                duration: 0 // Desliga animação para não piscar no setInterval
            }
        }
    });

    // Função para controlar o Alerta de Sobrecarga
    function gerenciarAlerta(potenciaAtual) {
        const alertBanner = document.getElementById('overloadAlert');
        // Define que acima de 4500W é considerado sobrecarga
        if (potenciaAtual > 4500) {
            alertBanner.style.display = 'block';
        } else {
            alertBanner.style.display = 'none';
        }
    }

    // Função principal que busca/simula os dados do ESP32
    function buscarDadosESP32() {
        // Em um cenário real, você usaria fetch():
        // fetch('http://ip-do-esp32/dados')
        //   .then(res => res.json())
        //   .then(data => {...})

        // Simulação de dados randômicos
        const baseTensao = 220;
        const variacaoTensao = (Math.random() * 10 - 5); // Varia de -5 a +5
        const tensao = (baseTensao + variacaoTensao).toFixed(1);

        // Gera uma corrente entre 2A e 22A (para ocasionalmente disparar o alerta > 4500W)
        const corrente = (Math.random() * 20 + 2).toFixed(2);
        
        // P = V * I (Fator de potência simulado como 1)
        const potencia = (tensao * corrente).toFixed(0);

        // Atualiza os Cards
        document.getElementById('tensaoValue').textContent = tensao;
        document.getElementById('correnteValue').textContent = corrente;
        document.getElementById('potenciaValue').textContent = potencia;

        // Verifica Sobrecarga
        gerenciarAlerta(parseInt(potencia));

        // Atualiza Gráfico
        const agora = new Date();
        const horaFormatada = `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}:${agora.getSeconds().toString().padStart(2, '0')}`;

        consumoChart.data.labels.push(horaFormatada);
        consumoChart.data.datasets[0].data.push(potencia);

        // Mantém apenas os últimos 10 pontos no gráfico para não poluir
        if (consumoChart.data.labels.length > 10) {
            consumoChart.data.labels.shift();
            consumoChart.data.datasets[0].data.shift();
        }

        consumoChart.update();
    }

    // Chama a função imediatamente e depois a cada 5 segundos
    buscarDadosESP32();
    setInterval(buscarDadosESP32, 1000);
}