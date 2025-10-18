# 支付集成指南

## 概述

本项目已经实现了完整的用户付费系统架构，包括：
- 用户注册/登录
- 套餐选择（39元/79元/99元）
- 订单创建
- 额度管理
- 使用记录

**当前状态：** 需要集成真实支付渠道（微信支付/支付宝）

## 推荐的支付解决方案

### 1. 个人开发者 - 使用第三方支付平台

如果你是个人开发者，推荐使用以下聚合支付平台：

#### 选项 A: Ping++ (https://www.pingxx.com/)
- 支持微信/支付宝/银联等多种支付方式
- 个人开发者友好
- 费率：约 0.6% - 1.5%

#### 选项 B: BeeCloud (https://beecloud.cn/)
- 专注小额支付
- 开发文档完善
- 费率：约 1% - 2%

#### 选项 C: PayJS (https://payjs.cn/)
- 个人微信支付宝接入
- 无需企业资质
- 费率：约 2% - 3%

### 2. 企业开发者 - 使用官方支付

如果有企业资质，建议直接对接官方：

#### 微信支付
- 申请地址: https://pay.weixin.qq.com/
- 需要：营业执照、对公账户
- 费率：0.6%

#### 支付宝
- 申请地址: https://open.alipay.com/
- 需要：营业执照、对公账户
- 费率：0.6%

## 集成步骤

### 步骤 1: 创建 Supabase Edge Function

创建一个 Edge Function 来处理支付回调和订单确认：

\`\`\`typescript
// supabase/functions/payment-callback/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 解析支付平台的回调数据
  const paymentData = await req.json()

  // 验证签名（根据你选择的支付平台）
  // ...签名验证逻辑

  // 更新订单状态
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      payment_status: 'completed',
      transaction_id: paymentData.transaction_id,
      purchased_at: new Date().toISOString()
    })
    .eq('id', paymentData.order_id)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
\`\`\`

### 步骤 2: 修改 PricingPlans 组件

在用户选择套餐后，调用支付 API：

\`\`\`typescript
const handleSelectPlan = async (plan: PricingPlan) => {
  // 1. 创建订单（已实现）
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .insert([...])
    .select()
    .single()

  // 2. 调用支付接口
  const paymentResponse = await fetch('YOUR_PAYMENT_API_URL', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id: subscription.id,
      amount: plan.price,
      subject: plan.name,
      notify_url: 'YOUR_CALLBACK_URL'
    })
  })

  const { payment_url } = await paymentResponse.json()

  // 3. 跳转到支付页面
  window.location.href = payment_url
}
\`\`\`

### 步骤 3: 处理支付结果

用户支付完成后，支付平台会：
1. 调用你的回调 URL (Edge Function)
2. Edge Function 更新订单状态为 'completed'
3. 前端轮询或使用 WebSocket 检测订单状态

## 测试模式

在开发阶段，你可以创建一个测试按钮来模拟支付成功：

\`\`\`typescript
// 仅用于测试！
const simulatePaymentSuccess = async (subscriptionId: string) => {
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      payment_status: 'completed',
      purchased_at: new Date().toISOString()
    })
    .eq('id', subscriptionId)

  if (!error) {
    alert('支付成功（测试模式）')
    refreshCredits()
  }
}
\`\`\`

## 重要提示

### 安全性
1. **永远不要在前端暴露支付密钥**
2. **必须验证支付回调的签名**
3. **使用 HTTPS**
4. **订单金额必须在服务端验证**

### 用户体验
1. 支付过程中显示加载状态
2. 支付成功后自动刷新额度
3. 支付失败提供重试选项
4. 提供客服联系方式

### 法律合规
1. 明确退款政策
2. 提供正规发票
3. 保存交易记录至少 3 年
4. 遵守《消费者权益保护法》

## 下一步

1. 选择一个支付平台并注册账号
2. 阅读其开发文档
3. 创建支付回调 Edge Function
4. 在测试环境完成支付流程测试
5. 上线前进行安全审计

## 需要帮助？

如果在集成过程中遇到问题，可以：
1. 查看支付平台的官方文档
2. 联系支付平台技术支持
3. 参考 Supabase Edge Functions 文档：https://supabase.com/docs/guides/functions
