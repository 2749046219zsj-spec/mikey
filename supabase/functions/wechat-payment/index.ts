import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CreateOrderRequest {
  action: 'create_order' | 'query_order' | 'notify';
  package_id?: string;
  payment_method?: string;
  order_id?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('未授权');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('用户认证失败');
    }

    const requestData: CreateOrderRequest = await req.json();
    const { action } = requestData;

    if (action === 'create_order') {
      return await createOrder(supabase, user.id, requestData);
    } else if (action === 'query_order') {
      return await queryOrder(supabase, requestData.order_id!);
    } else if (action === 'notify') {
      return await handleNotify(req, supabase);
    } else {
      throw new Error('未知操作');
    }
  } catch (error) {
    console.error('Wechat payment error:', error);
    return new Response(
      JSON.stringify({ error: error.message || '处理失败' }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

async function createOrder(supabase: any, userId: string, data: CreateOrderRequest) {
  const { package_id, payment_method = 'wechat' } = data;

  const { data: pkg, error: pkgError } = await supabase
    .from('recharge_packages')
    .select('*')
    .eq('id', package_id)
    .eq('is_active', true)
    .maybeSingle();

  if (pkgError || !pkg) {
    throw new Error('套餐不存在或已下架');
  }

  const orderNo = `WX${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  const { data: order, error: orderError } = await supabase
    .from('payment_orders')
    .insert({
      order_no: orderNo,
      user_id: userId,
      package_id: pkg.id,
      payment_method,
      amount: pkg.price,
      draw_count: pkg.draw_count + pkg.bonus_draws,
      status: 'pending',
    })
    .select()
    .single();

  if (orderError) {
    throw new Error('创建订单失败');
  }

  const { data: config } = await supabase
    .from('wechat_payment_config')
    .select('*')
    .eq('is_active', true)
    .maybeSingle();

  if (!config) {
    const mockPayData = {
      appId: 'mock_app_id',
      timeStamp: Date.now().toString(),
      nonceStr: Math.random().toString(36).substr(2, 15),
      package: `prepay_id=mock_${orderNo}`,
      signType: 'MD5',
      paySign: 'mock_sign_' + Math.random().toString(36).substr(2, 9),
      orderId: order.id,
      orderNo: orderNo,
    };

    return new Response(
      JSON.stringify(mockPayData),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  return new Response(
    JSON.stringify({
      message: '微信支付配置已就绪，请配置真实的支付参数',
      orderId: order.id,
      orderNo: orderNo,
    }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}

async function queryOrder(supabase: any, orderId: string) {
  const { data: order, error } = await supabase
    .from('payment_orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (error || !order) {
    throw new Error('订单不存在');
  }

  return new Response(
    JSON.stringify(order),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}

async function handleNotify(req: Request, supabase: any) {
  const notifyData = await req.text();
  console.log('Wechat notify received:', notifyData);

  return new Response(
    '<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>',
    {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
    }
  );
}

async function processPaymentSuccess(supabase: any, orderId: string, transactionId: string) {
  const { data: order } = await supabase
    .from('payment_orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (!order || order.status !== 'pending') {
    return;
  }

  await supabase
    .from('payment_orders')
    .update({
      status: 'paid',
      transaction_id: transactionId,
      paid_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  const { data: permission } = await supabase
    .from('user_permissions')
    .select('*')
    .eq('user_id', order.user_id)
    .maybeSingle();

  if (permission) {
    const newDraws = permission.remaining_draws + order.draw_count;

    await supabase
      .from('user_permissions')
      .update({
        remaining_draws: newDraws,
      })
      .eq('user_id', order.user_id);

    await supabase
      .from('payment_transactions')
      .insert({
        order_id: orderId,
        user_id: order.user_id,
        type: 'recharge',
        amount: order.amount,
        draw_change: order.draw_count,
        before_draws: permission.remaining_draws,
        after_draws: newDraws,
        description: `充值成功，增加 ${order.draw_count} 次绘图次数`,
      });
  }
}
