export async function onRequest(context) {
    const { request, env } = context;

    // --- 关键：允许 Shopify 跨域请求 ---
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*", // 允许所有来源，或者填 https://worldgate-test-store.myshopify.com
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    // 处理浏览器发出的预检请求
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    try {
        const payload = await request.json();
        
        // 这里的变量名必须和你 Pages 后台设置的大小写一致
        const pubKey = env.worldpay_public_key;
        const secKey = env.cus_secret_key;

        const response = await fetch('https://pay.defitopay.com/v1/an/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'worldpay_public_key': pubKey,
                'cus_secret_key': secKey,
                'X-Customer-IP': request.headers.get('CF-Connecting-IP') || ''
            },
            body: JSON.stringify(payload)
        });

        const resData = await response.json();

        // 返回结果时也要带上跨域头
        return new Response(JSON.stringify(resData), {
            headers: { 
                ...corsHeaders,
                'Content-Type': 'application/json'
            }
        });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { 
            status: 500,
            headers: corsHeaders
        });
    }
}