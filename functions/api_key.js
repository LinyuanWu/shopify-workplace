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

        // 这里的变量名务必保持全小写
        const pubKey = env.worldpay_public_key;
        const secKey = env.cus_secret_key;

        // 【关键改动】：指向你之前测试成功的那个 test-pay 域名（或者正确的生产域名）
        // 并且伪装成真实浏览器的 Headers
        const response = await fetch('https://test-pay.defitopay.com/v1/an/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'worldpay_public_key': pubKey,
                'cus_secret_key': secKey,
                // 伪装浏览器指纹，防止被支付网关的 Cloudflare 拦截
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'X-Customer-IP': request.headers.get('CF-Connecting-IP') || ''
            },
            body: JSON.stringify(payload)
        });

        const contentType = response.headers.get("content-type");
        
        // 如果返回的不是 JSON，说明被拦截了，把 HTML 源码传回来排查
        if (!contentType || !contentType.includes("application/json")) {
            const errorHtml = await response.text();
            return new Response(JSON.stringify({ 
                error: "Gateway Blocked Request", 
                status: response.status,
                details: errorHtml.substring(0, 500) // 只取前500字看错误原因
            }), { status: 500, headers: corsHeaders });
        }

        const resData = await response.json();
        return new Response(JSON.stringify(resData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (e) {
        return new Response(JSON.stringify({ error: "System Crash", message: e.message }), { 
            status: 500, 
            headers: corsHeaders 
        });
    }
}