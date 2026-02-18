const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function onRequestPost(context) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    try {
        const requestBody = await context.request.json();

        const openrouterResponse = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${context.env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': context.env.SITE_URL || 'https://your-project.pages.dev',
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
        console.error('Proxy error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}
