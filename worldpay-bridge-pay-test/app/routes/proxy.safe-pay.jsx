// app/routes/app.proxy.jsx
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  // 开发环境下暂时屏蔽安全校验，方便调试
  // await authenticate.public.appProxy(request);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Secure Checkout</title>
      <style>
        body { font-family: sans-serif; background-color: #f4f4f4; padding: 20px; }
        .container { background: #fff; max-width: 450px; margin: 40px auto; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .amount-box { background: #f9fafb; border: 1px solid #ddd; padding: 15px; text-align: center; margin-bottom: 20px; border-radius: 4px; }
        .amount { font-size: 24px; font-weight: bold; color: #008060; }
        input, select { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        button { width: 100%; padding: 16px; background: #000; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; margin-top: 10px; }
        button:hover { background: #333; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Secure Checkout</h2>
        <div class="amount-box">
          <div style="color: #666; font-size: 14px;">Total Amount</div>
          <div id="total" class="amount">Loading...</div>
        </div>
        <form id="pay-form">
          <input type="email" id="email" placeholder="Email Address" required>
          <input type="text" id="fname" placeholder="First Name" required style="width: 48%; display: inline-block;">
          <input type="text" id="lname" placeholder="Last Name" required style="width: 48%; display: inline-block; float: right;">
          <input type="text" id="addr" placeholder="Shipping Address" required>
          <select id="gateway">
            <option value="paypay">PayPay (JPY)</option>
            <option value="kakaopay">KakaoPay (KRW)</option>
            <option value="alipaycn">AlipayCN</option>
          </select>
          <button type="submit" id="submit-btn">PROCEED TO SECURE PAYMENT</button>
        </form>
      </div>
      <script>
        fetch('/cart.js').then(res => res.json()).then(cart => {
          document.getElementById('total').innerText = (cart.total_price/100).toFixed(2) + " " + cart.currency;
        });

        document.getElementById('pay-form').onsubmit = (e) => {
          e.preventDefault();
          document.getElementById('submit-btn').innerText = "Connecting...";
          alert("Integration Successful! Ready to connect to Worldpay Bridge.");
        };
      <\/script>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
};