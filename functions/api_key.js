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

        // --- 核心检查：检查环境变量是否拿到 ---
        // 这里的名字必须和你截图里的完全一致（全小写）
        const pubKey = env.worldpay_public_key;
        const secKey = env.cus_secret_key;

        if (!pubKey || !secKey) {
            return new Response(JSON.stringify({ 
                error: "Environment Variables Missing", 
                details: "Check if worldpay_public_key and cus_secret_key are set in Cloudflare Dashboard" 
            }), { status: 500, headers: corsHeaders });
        }

        // --- 调用第三方接口 ---
        const response = await fetch('https://test-pay.defitopay.com/v1/an/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'worldpay_public_key': pubKey,
                'cus_secret_key': secKey,
                'X-Customer-IP': request.headers.get('CF-Connecting-IP') || ''
            },
            body: JSON.stringify(payload)
        });

        // 检查第三方接口是否返回了非 JSON 内容
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const errorText = await response.text();
            return new Response(JSON.stringify({ 
                error: "Upstream Error (Not JSON)", 
                details: errorText.substring(0, 200) 
            }), { status: 500, headers: corsHeaders });
        }

        const resData = await response.json();
        return new Response(JSON.stringify(resData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (e) {
        // 返回具体的代码报错原因
        return new Response(JSON.stringify({ 
            error: "Function Crash", 
            message: e.message 
        }), { status: 500, headers: corsHeaders });
    }
}