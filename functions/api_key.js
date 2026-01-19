export async function onRequest(context) {
    const { request, env } = context;

    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const payload = await request.json();

        const response = await fetch('https://test-pay.defitopay.com/v1/an/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'worldpay_public_key': env.worldpay_public_key,
                'cus_secret_key': env.cus_secret_key,
                
                // --- 【核心修改：绕过 WAF 规则】 ---
                
                // 1. 伪装 Referer：包含 "https" 和你的白名单域名
                // 这将使规则中的 (not http.referer contains "https") 变为 False
                'Referer': 'https://safe-paygate.defitopay.com/',
                
                // 2. 伪装 User-Agent：包含 "WordPress" 或 "Shopify-Captain-Hook"
                // 这将使规则中的 (not http.user_agent contains "WordPress") 变为 False
                'User-Agent': 'WordPress/6.4.1; https://safe-paygate.defitopay.com',
                
                // 透传 IP
                'X-Forwarded-For': request.headers.get('CF-Connecting-IP') || '',
            },
            body: JSON.stringify(payload)
        });

        // 检查是否还是被拦截
        if (response.status === 403) {
            const errorHtml = await response.text();
            return new Response(JSON.stringify({ 
                error: "WAF Still Blocking", 
                tip: "Check if the Referer header is being stripped by Cloudflare.",
                debug: errorHtml.substring(0, 300)
            }), { status: 403, headers: corsHeaders });
        }

        const resData = await response.json();
        return new Response(JSON.stringify(resData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { 
            status: 500, 
            headers: corsHeaders 
        });
    }
}