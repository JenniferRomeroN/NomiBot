// api/sms.js
require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

const responses = {
bienvenida: `👋 ¡Hola! Soy **Nomi**, tu asistente virtual 🤖🌟\n\nEstoy aquí para ayudarte con temas de bienestar laboral y Recursos Humanos.\n\nResponde con el número de la opción que necesites:\n\n1️⃣ - 📋 Contestar encuesta **NOM-035**\n2️⃣ - 🧠 Realizar evaluación de desempeño\n3️⃣ - 👩‍💼 Contactar a una persona de Recursos Humanos\n4️⃣ - ⏰ Consultar horarios y tiempos de respuesta`,
opcion1_pregunta1: '✍️ ¿Cuántos colaboradores hay en tu centro de trabajo?',
opcion2_seleccion_puesto: 'Selecciona el puesto que deseas evaluar:\n\n🔑 Ama de llaves\n🔧 Mantenimiento\n👨‍🍳 Cocinero\n🧺 Lavandería\n⏱️ Checador\n🛎️ Recepcionista\n🛠️ Ayudante general\n💼 Recursos Humanos',
opcion4_contacto_rh: '📧 En breve, alguien de R.H. se pondrá en contacto contigo.\n\n🕒 Horario: Lunes a Viernes de 8:00 a.m. a 5:00 p.m.',
opcion5_horarios: '⏰ Horario de atención: Lunes a Viernes de 8:00 a.m. a 5:00 p.m.\n\n📨 Si escribes fuera de este horario, te responderemos el siguiente día hábil.\n\n🏥 Cumplamos juntos la NOM-035\n\n👥 Cuidando el bienestar de todas las personas trabajadoras.',
formulario_desempeno: (puesto) => `✉️ Por favor, llena el siguiente formulario:\n\nEvaluación para ${puesto}\n\nIncluye:\nNombre completo por apellido\nPuesto\nAntigüedad`,
guia1_link: '🔗 Contestar Guía I',
guia2_link: '🔗 Contestar Guía II (46 preguntas)',
guia3_link: '🔗 Contestar Guía III (72 preguntas)',
};

const userStates = {}; // Para mantener el estado de cada usuario

export default async (req, res) => {
if (req.method === 'POST') {
const { From: userPhoneNumber, Body: incomingMessage } = req.body;
const message = incomingMessage.trim();
let responseText = '';

if (!userStates[userPhoneNumber]) {
    userStates[userPhoneNumber] = { state: 'initial' };
    responseText = responses.bienvenida;
} else {
    const currentState = userStates[userPhoneNumber].state;
    const userData = userStates[userPhoneNumber].data || {};

    switch (currentState) {
    case 'initial':
        if (message === '1') {
        userStates[userPhoneNumber].state = 'nom035_pregunta1';
        responseText = responses.opcion1_pregunta1;
        } else if (message === '2') {
        userStates[userPhoneNumber].state = 'desempeno_seleccion_puesto';
        responseText = responses.opcion2_seleccion_puesto;
        } else if (message === '3') {
        responseText = responses.opcion4_contacto_rh;
        } else if (message === '4') {
        responseText = responses.opcion5_horarios;
        } else {
        responseText = 'Opción no válida. Por favor, elige un número del menú.';
        }
        break;

    case 'nom035_pregunta1':
        const numColaboradores = parseInt(message, 10);
        if (!isNaN(numColaboradores)) {
        responseText = 'De acuerdo a tu número de colaboradores:\n';
        if (numColaboradores < 15) {
            responseText += `- Aplica solo la Guía I.\n${responses.guia1_link}`;
        } else if (numColaboradores >= 16 && numColaboradores <= 50) {
            responseText += `- Aplica Guías I, II y V.\n${responses.guia1_link}\n${responses.guia2_link}`;
        } else {
            responseText += `- Aplica Guías I, III y V.\n${responses.guia1_link}\n${responses.guia3_link}`;
        }
        delete userStates[userPhoneNumber]; // Reset state after providing the links
        } else {
        responseText = 'Por favor, ingresa un número válido de colaboradores.';
        }
        break;

    case 'desempeno_seleccion_puesto':
        const puestos = {
        '1': 'Ama de llaves',
        '2': 'Mantenimiento',
        '3': 'Cocinero',
        '4': 'Lavandería',
        '5': 'Checador',
        '6': 'Recepcionista',
        '7': 'Ayudante general',
        '8': 'Recursos Humanos',
        };
        if (puestos[message]) {
        const puestoSeleccionado = puestos[message];
        responseText = responses.formulario_desempeno(puestoSeleccionado);
        delete userStates[userPhoneNumber]; // For simplicity, we reset here. In a real scenario, you'd handle form submission.
        } else {
        responseText = 'Opción de puesto no válida. Por favor, elige un número de la lista.';
        }
        break;

    default:
        responseText = responses.bienvenida;
        delete userStates[userPhoneNumber];
    }
}

if (responseText) {
    try {
    await client.messages.create({
        body: responseText,
        from: twilioPhoneNumber,
        to: userPhoneNumber,
    });
    res.status(200).send('Mensaje enviado correctamente.');
    } catch (error) {
    console.error('Error al enviar el mensaje:', error);
    res.status(500).send('Error al enviar el mensaje.');
    }
} else {
    res.status(200).send('No se generó respuesta.');
}
} else {
res.status(405).send('Método no permitido.');
}
};