// 把 index.html 中的秘钥存储在这里,避免前端暴露
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        // 1. 获取前端传来的原始数据
        const payload = await request.json();

        // 2. 从 Pages 的环境变量中读取 Secret Key
        const pubKey = env.WORLDPAY_PUBLIC_KEY;
        const secKey = env.CUS_SECRET_KEY;

        // 3. 在后端发起真正的支付请求
        const response = await fetch('https://test-pay.defitopay.com/v1/an/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'worldpay_public_key': pubKey,
                'cus_secret_key': secKey,
                // 透传真实 IP，防止风控误伤
                'X-Customer-IP': request.headers.get('CF-Connecting-IP') || ''
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        // 4. 将结果返回给前端
        return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ status: "error", message: err.message }), { status: 500 });
    }
}