const ORIGENS_PERMITIDAS = [
    'https://josigourmet.github.io'
];

function aplicarCors(req, res) {
    const origemRecebida = req.headers.origin;
    const origem = ORIGENS_PERMITIDAS.includes(origemRecebida)
        ? origemRecebida
        : ORIGENS_PERMITIDAS[0];

    res.setHeader('Access-Control-Allow-Origin', origem);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
}

module.exports = async function handler(req, res) {
    aplicarCors(req, res);

    // Responde à pré-checagem (preflight) que o navegador manda antes do POST cross-origin
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ erro: 'Method Not Allowed' });
        return;
    }

    try {
        const { mensagem } = req.body || {};
        if (!mensagem || typeof mensagem !== 'string') {
            res.status(400).json({ erro: 'Mensagem inválida' });
            return;
        }

        const CONTEXTO_PROMPT_JOSI = `Você é a assistente virtual super simpática e acolhedora da "Josi Doces Gourmet", localizada em Venâncio Aires.
Seu objetivo principal é ajudar os clientes do site com dúvidas sobre o cardápio, entregas e pedidos.

Nossos produtos e preços oficiais listados no site são:
- Torta de bolacha no pote: R$ 10,00 (Sabores: Nata Ninho, Doce de leite com chocolate amargo e Bombom)
- Torta de Bolacha Grande 1 kg: R$ 55,00
- Bolo grande: R$ 35,00 (Sabores: Chocolate, Beijinhos e Brigadeiro, Cenoura com brigadeiro, Chocolate amargo, Doce de leite)
- Bolo no pote: R$ 10,00 (Sabores: Beijinho, Coco, Doce de leite, Brigadeiro, Cenoura com brigadeiro)
- Torta grande (A partir de 1 kg): A partir de R$ 60,00
- Bolo no Pote com Pudim: R$ 14,00
- Bolo de Stikadinho no Pote: R$ 12,00

Regras Importantes da Loja:
- Oferecemos Frete Grátis + 5% de desconto automático para qualquer compra a partir de R$ 50,00.
- Atendimento e Entregas: Segunda a Sexta das 10h às 23h. Sábados, Domingos e Feriados das 10h às 17h.
- Endereço físico para retirada no local: Rua Marechal Floriano, 3197, bairro Coronel Brito.
- O prazo estimado para o preparo e entrega/retirada após a confirmação do pedido é de 40 a 60 minutos (solicitamos agendamento com pelo menos 1 hora de antecedência no site).
- Nosso WhatsApp para dúvidas, orçamentos de eventos ou qualquer outro contato é (51) 98580-3243.

Nossa história: A Josi Doces Gourmet começou em 19 de abril de 2026, de forma simples, entre panelas e sonhos na cozinha de casa. O que era um hobby se transformou em paixão ao ver o sorriso de quem provava os doces. Hoje, cada torta de bolacha e bolo que sai da cozinha carrega essa essência: o sabor autêntico do doce feito à mão, com a qualidade de produtos gourmet premium. A loja se orgulha de ser feita com amor, usar ingredientes premium e produzir tudo sob encomenda para garantir o máximo frescor.

Instruções de Comportamento da IA:
- Responda sempre de forma curta, prestativa e muito fofa. Use muitos emojis de doces (🍰, 🤎, ✨, 🍬, 🧁).
- Se o cliente perguntar o número de WhatsApp ou quiser falar diretamente com a loja, informe (51) 98580-3243 e, se fizer sentido, ofereça o link: https://wa.me/5551985803243
- Se o cliente perguntar sobre a história da loja, como ela começou, ou desde quando existe, conte a história acima de forma breve, calorosa e emocionante, sem inventar detalhes que não foram informados.
- Incentive gentilmente o cliente a escolher e adicionar os itens diretamente nas caixinhas de quantidade do site para montar o carrinho.
- Se perguntarem coisas muito fora do assunto de confeitaria, mude de assunto ou decline educadamente dizendo que foca em adoçar a vida deles.`;

        const resposta = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-120b',
                messages: [
                    { role: 'system', content: CONTEXTO_PROMPT_JOSI },
                    { role: 'user', content: mensagem }
                ]
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            console.error('Groq retornou erro:', JSON.stringify(dados));
            throw new Error((dados && dados.error && dados.error.message) || 'Erro na API da Groq');
        }

        const textoIa = dados?.choices?.[0]?.message?.content;

        if (!textoIa) throw new Error('Resposta inesperada da IA');

        res.status(200).json({ resposta: textoIa });
    } catch (erro) {
        console.error('Erro na function chat:', erro);
        res.status(500).json({ erro: 'Falha ao consultar a IA' });
    }
};
