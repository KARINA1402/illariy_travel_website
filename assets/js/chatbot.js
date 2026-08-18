// ==================== CONFIGURACIÓN AVANZADA ====================
const WHATSAPP_NUMBER = '51990693358';
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=Hola%2C%20necesito%20ayuda%20con%20un%20tour%20y%20pago`;
const UBICACION_NOMBRE = 'Jr. Puno 293, Huancayo';
const API_PAQUETES = 'https://illary.bsite.net/api/Paquete';
const EMPRESA_RUC = '20603181621';
const EMPRESA_NOMBRE = 'ILLARIY PERU TRAVEL GROUP E.I.R.L.';

let paquetes = [];
let nombreUsuario = null;
let primerMensaje = true;
let historial = [];
let mensajesRenderizados = [];
let currentTypingDiv = null;

// ==================== PERSISTENCIA CON LOCALSTORAGE ====================
function guardarEstado() {
    localStorage.setItem('chat_nombreUsuario', nombreUsuario || '');
    localStorage.setItem('chat_primerMensaje', primerMensaje);
    localStorage.setItem('chat_mensajes', JSON.stringify(mensajesRenderizados));
    localStorage.setItem('chat_historial', JSON.stringify(historial));
}

function guardarEstadoChat(abierto) {
    localStorage.setItem('chat_abierto', abierto ? 'true' : 'false');
}

function cargarEstado() {
    const nombreGuardado = localStorage.getItem('chat_nombreUsuario');
    if (nombreGuardado && nombreGuardado !== 'null') nombreUsuario = nombreGuardado;
    const primerGuardado = localStorage.getItem('chat_primerMensaje');
    if (primerGuardado !== null) primerMensaje = primerGuardado === 'true';
    const mensajesGuardados = localStorage.getItem('chat_mensajes');
    if (mensajesGuardados) {
        try {
            mensajesRenderizados = JSON.parse(mensajesGuardados);
            setTimeout(() => {
                mensajesRenderizados.forEach(msg => {
                    agregarMensajeDOM(msg.texto, msg.tipo, false);
                });
            }, 100);
        } catch (e) { console.warn('Error cargando mensajes', e); }
    }
    const historialGuardado = localStorage.getItem('chat_historial');
    if (historialGuardado) {
        try { historial = JSON.parse(historialGuardado); } catch (e) { }
    }
    const chatAbierto = localStorage.getItem('chat_abierto') === 'true';
    return chatAbierto;
}

function agregarMensajeDOM(html, tipo = 'user', guardar = true) {
    const container = document.getElementById('chatbot-messages');
    if (!container) return;
    const div = document.createElement('div');
    div.className = `message ${tipo}`;
    div.innerHTML = `<div class="message-bubble">${html}</div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    if (guardar) {
        mensajesRenderizados.push({ texto: html, tipo: tipo });
        guardarEstado();
    }
}

function agregarMensaje(html, tipo = 'user') {
    agregarMensajeDOM(html, tipo, true);
}

// ==================== CREAR WIDGET CHAT ====================
function crearWidgetChat() {
    if (document.getElementById('chatbot-flotante')) return;

    const chatHTML = `
        <div id="chatbot-flotante">
            <div id="chatbot-toggle" class="chatbot-toggle">
                <i class="fas fa-comment-dots"></i>
            </div>
            <div id="chatbot-window" class="chatbot-window">
                <div class="chatbot-header">
                    <div class="chatbot-header-info">
                        <i class="fas fa-robot"></i>
                        <span>Killa · Asistente Illariy</span>
                    </div>
                    <button id="chatbot-close" class="chatbot-close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div id="chatbot-messages" class="chatbot-messages"></div>
                <div class="chatbot-suggestions" id="suggestions-panel">
                    <button class="suggestion-btn" data-consulta="ver paquetes">📦 Ver paquetes</button>
                    <button class="suggestion-btn" data-consulta="asesor">📞 Asesor WhatsApp</button>
                    <button class="suggestion-btn" data-consulta="ubicación">📍 Dirección</button>
                    <button class="suggestion-btn" data-consulta="cambiar nombre">✏️ Mi nombre es</button>
                    <button class="suggestion-btn" data-consulta="ruc">🏢 RUC</button>
                    <button class="suggestion-btn" data-consulta="borrar chat">🗑️ Nueva conversación</button>
                </div>
                <div class="chatbot-input-area">
                    <input type="text" id="chatbot-input" placeholder="Escribe tu mensaje..." autocomplete="off">
                    <button id="chatbot-send">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
                <div class="chatbot-footer-note">
                    <i class="fas fa-brain"></i> IA experimental · puede tener errores
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', chatHTML);

    const estilos = document.createElement('style');
    estilos.textContent = `
        #chatbot-flotante {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            font-family: 'Inter', 'Segoe UI', sans-serif;
        }
        .chatbot-toggle {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #DC2626, #991B1B);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            color: white;
            font-size: 28px;
        }
        .chatbot-toggle:hover { transform: scale(1.08); box-shadow: 0 6px 20px rgba(220,38,38,0.4); }
        .chatbot-window {
            position: absolute;
            bottom: 80px;
            right: 0;
            width: 400px;
            max-width: calc(100vw - 40px);
            background: #121212;
            border-radius: 24px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            border: 1px solid #2C2C2C;
            display: none;
            flex-direction: column;
            overflow: hidden;
            backdrop-filter: blur(2px);
            animation: fadeInUp 0.2s ease;
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .chatbot-window.open { display: flex; }
        .chatbot-header {
            background: #1F1F1F;
            padding: 14px 18px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #DC2626;
        }
        .chatbot-header-info {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 700;
            color: #DC2626;
            font-size: 15px;
        }
        .chatbot-header-info i { font-size: 22px; }
        .chatbot-close-btn {
            background: transparent;
            border: none;
            color: #aaa;
            cursor: pointer;
            font-size: 20px;
            transition: 0.2s;
        }
        .chatbot-close-btn:hover { color: #DC2626; transform: scale(1.1); }
        .chatbot-messages {
            height: 380px;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            background: #0A0A0A;
            scroll-behavior: smooth;
        }
        .message {
            display: flex;
            animation: messagePop 0.2s ease;
        }
        @keyframes messagePop {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .message.bot { justify-content: flex-start; }
        .message.user { justify-content: flex-end; }
        .message-bubble {
            max-width: 85%;
            padding: 10px 14px;
            border-radius: 20px;
            font-size: 13.5px;
            line-height: 1.45;
            word-break: break-word;
        }
        .bot .message-bubble {
            background: #1F1F1F;
            color: #F0F0F0;
            border-bottom-left-radius: 4px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        .user .message-bubble {
            background: #DC2626;
            color: white;
            border-bottom-right-radius: 4px;
        }
        .typing-indicator {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #1F1F1F;
            padding: 10px 16px;
            border-radius: 24px;
            width: fit-content;
        }
        .typing-dot {
            width: 8px;
            height: 8px;
            background: #DC2626;
            border-radius: 50%;
            display: inline-block;
            animation: typingWave 1.2s infinite ease-in-out;
        }
        .typing-dot:nth-child(1) { animation-delay: 0s; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingWave {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30% { transform: translateY(-8px); opacity: 1; }
        }
        .chatbot-suggestions {
            padding: 10px 12px;
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            border-top: 1px solid #2C2C2C;
            background: #121212;
        }
        .suggestion-btn {
            background: #252525;
            border: none;
            padding: 6px 12px;
            border-radius: 30px;
            font-size: 11px;
            color: #E0E0E0;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: 500;
        }
        .suggestion-btn:hover {
            background: #DC2626;
            color: white;
            transform: translateY(-2px);
        }
        .chatbot-input-area {
            display: flex;
            padding: 12px;
            gap: 10px;
            background: #121212;
            border-top: 1px solid #2C2C2C;
        }
        #chatbot-input {
            flex: 1;
            background: #1F1F1F;
            border: 1px solid #3F3F3F;
            border-radius: 30px;
            padding: 11px 16px;
            color: white;
            outline: none;
            font-size: 13px;
            transition: 0.2s;
        }
        #chatbot-input:focus { border-color: #DC2626; box-shadow: 0 0 0 2px rgba(220,38,38,0.2); }
        #chatbot-send {
            background: #DC2626;
            border: none;
            width: 42px;
            height: 42px;
            border-radius: 50%;
            color: white;
            cursor: pointer;
            transition: 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #chatbot-send:hover { background: #991B1B; transform: scale(1.02); }
        .enlace-reserva, .whatsapp-link {
            display: inline-block;
            margin-top: 8px;
            font-size: 12px;
            background: #DC2626;
            padding: 6px 14px;
            border-radius: 30px;
            color: white;
            text-decoration: none;
            font-weight: 500;
            transition: 0.2s;
        }
        .whatsapp-link { background: #25D366; }
        .enlace-reserva:hover { background: #991B1B; }
        .whatsapp-link:hover { background: #128C7E; }
        .chatbot-footer-note {
            font-size: 9px;
            color: #6B7280;
            text-align: center;
            padding: 6px;
            border-top: 1px solid #2C2C2C;
            background: #0A0A0A;
        }
        .chatbot-footer-note i {
            font-size: 8px;
            margin-right: 4px;
        }
    `;
    document.head.appendChild(estilos);

    // Eventos
    const toggleBtn = document.getElementById('chatbot-toggle');
    const closeBtn = document.getElementById('chatbot-close');
    const windowChat = document.getElementById('chatbot-window');

    function setChatState(open) {
        if (open) {
            windowChat.classList.add('open');
        } else {
            windowChat.classList.remove('open');
        }
        guardarEstadoChat(open);
    }

    function toggleChat() {
        const isOpen = windowChat.classList.contains('open');
        setChatState(!isOpen);
        if (!isOpen) {
            document.getElementById('chatbot-input').focus();
        }
    }

    toggleBtn.onclick = toggleChat;
    closeBtn.onclick = () => setChatState(false);

    // Sugerencias
    document.querySelectorAll('.suggestion-btn').forEach(btn => {
        btn.onclick = () => {
            const consulta = btn.getAttribute('data-consulta');
            if (consulta === 'asesor') {
                agregarMensaje(`📞 <a href="${WHATSAPP_LINK}" target="_blank" class="whatsapp-link">Chatear con un asesor →</a>`, 'bot');
            } else if (consulta === 'cambiar nombre') {
                agregarMensaje("✏️ Escribe: 'me llamo [tu nombre]' o 'cambiar nombre a [nombre]'", 'bot');
            } else if (consulta === 'ruc') {
                agregarMensaje(`🏢 <strong>${EMPRESA_NOMBRE}</strong><br>RUC: ${EMPRESA_RUC}<br>Dirección: ${UBICACION_NOMBRE}<br>WhatsApp: +51 ${WHATSAPP_NUMBER}`, 'bot');
            } else if (consulta === 'borrar chat') {
                localStorage.clear();
                location.reload();
            } else {
                document.getElementById('chatbot-input').value = consulta;
                enviarMensaje();
            }
        };
    });

    document.getElementById('chatbot-send').onclick = () => enviarMensaje();
    document.getElementById('chatbot-input').onkeypress = (e) => {
        if (e.key === 'Enter') enviarMensaje();
    };

    cargarPaquetes().then(() => {
        const chatAbierto = cargarEstado();
        setChatState(chatAbierto);
        if (mensajesRenderizados.length === 0) {
            agregarMensaje("👋 ¡Hola! Soy Killa. ¿Cómo te llamas?", 'bot');
        }
    });
}

// ==================== FUNCIONES AUXILIARES ====================
async function cargarPaquetes() {
    try {
        const res = await fetch(API_PAQUETES);
        if (res.ok) paquetes = await res.json();
        else console.warn('API paquetes no disponible');
    } catch (e) { console.error('Error cargando paquetes:', e); }
}

function mostrarTyping() {
    if (currentTypingDiv && document.body.contains(currentTypingDiv)) return currentTypingDiv;
    const container = document.getElementById('chatbot-messages');
    if (!container) return null;
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot typing-message';
    typingDiv.innerHTML = `
        <div class="typing-indicator">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span style="margin-left: 6px; font-size: 12px; color:#aaa;">Killa está pensando...</span>
        </div>
    `;
    container.appendChild(typingDiv);
    container.scrollTop = container.scrollHeight;
    currentTypingDiv = typingDiv;
    return typingDiv;
}

function quitarTyping() {
    if (currentTypingDiv && currentTypingDiv.parentNode) {
        currentTypingDiv.remove();
        currentTypingDiv = null;
    }
}

function delayNatural() {
    return new Promise(resolve => setTimeout(resolve, Math.random() * 1500 + 1000));
}

function detectarNombre(texto) {
    const patrones = [
        /me llamo\s+([a-zA-Záéíóúñ]+)/i,
        /mi nombre es\s+([a-zA-Záéíóúñ]+)/i,
        /cambiar nombre a\s+([a-zA-Záéíóúñ]+)/i,
        /llámame\s+([a-zA-Záéíóúñ]+)/i,
        /soy\s+([a-zA-Záéíóúñ]+)/i
    ];
    for (let p of patrones) {
        const match = texto.match(p);
        if (match && match[1]) return match[1];
    }
    return null;
}

// ==================== LÓGICA PRINCIPAL ====================
async function enviarMensaje() {
    const input = document.getElementById('chatbot-input');
    let texto = input.value.trim();
    if (!texto) return;
    input.value = '';

    agregarMensaje(escapeHtml(texto), 'user');
    historial.push({ role: 'user', content: texto });
    if (historial.length > 12) historial.shift();

    const typingDiv = mostrarTyping();
    await delayNatural();

    const nuevoNombre = detectarNombre(texto);
    if (nuevoNombre) {
        nombreUsuario = nuevoNombre.charAt(0).toUpperCase() + nuevoNombre.slice(1);
        primerMensaje = false;
        quitarTyping();
        agregarMensaje(`✅ ¡Hecho! Ahora te llamaré ${nombreUsuario}. ¿En qué te ayudo?`, 'bot');
        guardarEstado();
        return;
    }

    if (!nombreUsuario && primerMensaje) {
        if (texto.length < 20 && !texto.includes('?')) {
            nombreUsuario = texto.charAt(0).toUpperCase() + texto.slice(1);
            primerMensaje = false;
            quitarTyping();
            agregarMensaje(`✨ Encantada ${nombreUsuario}. ¿Qué tour buscas?`, 'bot');
            guardarEstado();
            return;
        } else {
            nombreUsuario = 'viajero';
            primerMensaje = false;
            guardarEstado();
        }
    }

    const textoLower = texto.toLowerCase();
    if (textoLower.includes('pagar') || textoLower.includes('pago') || textoLower.includes('coste') || textoLower.includes('precio final')) {
        quitarTyping();
        agregarMensaje(`💰 Para concretar el pago, contacta a nuestro asesor por WhatsApp:<br><a href="${WHATSAPP_LINK}" target="_blank" class="whatsapp-link">Hablar con asesor →</a>`, 'bot');
        guardarEstado();
        return;
    }
    if (textoLower.includes('ruc') || textoLower.includes('factura') || textoLower.includes('datos fiscales') || textoLower.includes('razón social')) {
        quitarTyping();
        agregarMensaje(`🏢 <strong>${EMPRESA_NOMBRE}</strong><br>RUC: ${EMPRESA_RUC}<br>Dirección: ${UBICACION_NOMBRE}<br>WhatsApp: +51 ${WHATSAPP_NUMBER}`, 'bot');
        guardarEstado();
        return;
    }
    if (textoLower.includes('asesor') || textoLower.includes('hablar con alguien') || textoLower.includes('atención al cliente')) {
        quitarTyping();
        agregarMensaje(`📞 Contacta a nuestro asesor por WhatsApp:<br><a href="${WHATSAPP_LINK}" target="_blank" class="whatsapp-link">Enviar mensaje →</a>`, 'bot');
        guardarEstado();
        return;
    }

    try {
        const respuesta = await consultarGroq(texto);
        quitarTyping();
        let respuestaFinal = respuesta;

        // Si la respuesta es el mensaje genérico, agregar enlace a WhatsApp
        if (respuesta.includes("contacta a nuestro asesor por WhatsApp")) {
            respuestaFinal += `<br><a href="${WHATSAPP_LINK}" target="_blank" class="whatsapp-link">📞 Chatear con un asesor →</a>`;
        }
        // También si el usuario menciona "asesor", "persona", "hablar", mostrar enlace directamente
        if (textoLower.includes("asesor") || textoLower.includes("persona") || textoLower.includes("hablar")) {
            respuestaFinal = `📞 Puedes contactar a un asesor por WhatsApp: <a href="${WHATSAPP_LINK}" target="_blank" class="whatsapp-link">Enviar mensaje →</a>`;
        }

        // Agregar enlaces de reserva para paquetes mencionados
        for (const p of paquetes) {
            if (respuestaFinal.includes(p.nombre)) {
                const link = `${window.location.origin}/destino-single.html?iD_Paquete=${p.iD_Paquete}`;
                respuestaFinal += `<br><a href="${link}" target="_blank" class="enlace-reserva">🔗 Reservar ${p.nombre}</a>`;
            }
        }

        agregarMensaje(respuestaFinal, 'bot');
        historial.push({ role: 'assistant', content: respuesta });
        guardarEstado();
    } catch (error) {
        // Manejo de errores...

        quitarTyping();
        console.error(error);
        agregarMensaje(`⚠️ Error de conexión. Por favor contacta a un asesor: <a href="${WHATSAPP_LINK}" target="_blank" class="whatsapp-link">WhatsApp →</a>`, 'bot');
        guardarEstado();
    }
}

async function consultarGroq(pregunta) {
    try {
        console.log('📤 Enviando pregunta:', pregunta);

        const response = await fetch('https://illary.bsite.net/api/Chat/consultar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                pregunta: pregunta,
                nombre: nombreUsuario,
                historial: historial.slice(-3),
                paquetes: paquetes
            })
        });

        console.log('📥 Respuesta HTTP:', response.status, response.statusText);
        console.log('📋 Headers:', response.headers);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Error del servidor:', errorData);
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        let respuesta = data.respuesta;
        if (!respuesta || respuesta.trim() === '') {
            respuesta = 'No pude procesar tu consulta en este momento. ¿Puedes intentar de nuevo?';
        }
        return respuesta;
    } catch (error) {
        console.error('🔥 Error en consultarGroq:', error);
        throw error;
    }
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function (m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    }).replace(/[\n]/g, '<br>');
}

document.addEventListener('DOMContentLoaded', crearWidgetChat);