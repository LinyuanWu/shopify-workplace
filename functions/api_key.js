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

        // --- 1. 捕获真实用户的原始信息 ---
        const realIP = request.headers.get('cf-connecting-ip'); // 用户真实 IP
        const realCountry = request.headers.get('cf-ipcountry'); // 用户真实国家码
        const realUA = request.headers.get('user-agent');       // 用户真实浏览器指纹

        const response = await fetch('https://test-pay.defitopay.com/v1/an/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'worldpay_public_key': env.worldpay_public_key,
                'cus_secret_key': env.cus_secret_key,
                
                // --- 2. 绕过 WAF 的伪装（必须保留，否则进不去后端） ---
                'Referer': 'https://safe-paygate.defitopay.com/',
                // 这里在 UA 后面拼接一个 WordPress 关键词，既保留了真实 UA 特征，又绕过了 WAF 规则
                'User-Agent': `${realUA} WordPress/6.4.1`,

                // --- 3. 核心：透传 IP 和国家信息给后端 V48.0 Worker ---
                'X-Customer-IP': realIP,
                'X-Real-IP': realIP,
                'X-Forwarded-For': realIP,
                'X-Customer-Country': realCountry, // 确保后端获取国家时不报 "Region restricted"
                'X-Customer-Language': request.headers.get('accept-language') || ''
            },
            body: JSON.stringify(payload)
        });

        const resData = await response.json();
        
        return new Response(JSON.stringify(resData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (e) {
        return new Response(JSON.stringify({ error: "Proxy Error", message: e.message }), { 
            status: 500, 
            headers: corsHeaders 
        });
    }
}