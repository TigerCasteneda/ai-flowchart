const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const ALLOWED_ORIGINS = [
    'http://localhost:8080',
    'http://127.0.0.1:8080'
];

export default {
    async fetch(request, env) {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        if (request.method !== 'POST') {
            return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
        }

        try {
            const requestBody = await request.json();

            const openrouterResponse = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
                    'HTTP-Referer': env.SITE_URL || 'https://your-site.pages.dev',
                    'X-Title': 'AI FlowChart'
                },
                body: JSON.stringify({
                    model: requestBody.model || 'arcee-ai/trinity-large-preview:free',
                    messages: requestBody.messages,
                    temperature: requestBody.temperature || 0.7,
                    max_tokens: requestBody.max_tokens || 3000
                })
            });

            if (!openrouterResponse.ok) {
                const errorText = await openrouterResponse.text();
                console.error('OpenRouter API error:', errorText);
                return new Response(JSON.stringify({ error: `API Error: ${openrouterResponse.status}` }), {
                    status: openrouterResponse.status,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const result = await openrouterResponse.json();
            return new Response(JSON.stringify(result), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } catch (error) {
            console.error('Worker error:', error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }
};
