import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // 只允许 POST 请求
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: '只支持POST请求' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 验证API Key
    const apikeyHeader = req.headers.get('apikey') || req.headers.get('Apikey');
    const expectedApiKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    if (!apikeyHeader || apikeyHeader !== expectedApiKey) {
      return new Response(
        JSON.stringify({
          error: '未授权：API Key无效',
          message: '请确保在插件配置中使用正确的Supabase匿名密钥'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 使用 service role key 进行文件操作
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 解析 multipart/form-data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const metadataStr = formData.get('metadata') as string;
    const category = formData.get('category') as string || 'competitor';
    const uploadedAt = formData.get('uploadedAt') as string;

    if (!file) {
      return new Response(
        JSON.stringify({ error: '未提供文件' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 解析元数据
    let metadata = {};
    try {
      metadata = metadataStr ? JSON.parse(metadataStr) : {};
    } catch (e) {
      console.error('解析元数据失败:', e);
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `competitor/${timestamp}_${randomStr}.${extension}`;

    // 上传文件到 Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabaseServiceClient
      .storage
      .from('reference-images')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('上传文件失败:', uploadError);
      return new Response(
        JSON.stringify({ error: `上传失败: ${uploadError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 获取公开URL
    const { data: urlData } = supabaseServiceClient
      .storage
      .from('reference-images')
      .getPublicUrl(fileName);

    // 保存记录到数据库（public_reference_images表）
    // 使用service role key来绕过RLS
    const { data: dbData, error: dbError } = await supabaseServiceClient
      .from('public_reference_images')
      .insert({
        name: file.name,
        image_url: urlData.publicUrl,
        file_name: file.name,
        category: category,
        tags: ['竞品', '浏览器上传'],
        metadata: {
          ...metadata,
          originalFileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          uploadedVia: 'browser-extension',
          uploadedAt: uploadedAt || new Date().toISOString(),
        },
        is_active: true,
      })
      .select()
      .single();

    if (dbError) {
      console.error('保存数据库记录失败:', dbError);
      // 即使数据库保存失败，文件已经上传成功
    }

    // 返回成功响应
    return new Response(
      JSON.stringify({
        success: true,
        message: '上传成功',
        data: {
          id: dbData?.id,
          url: urlData.publicUrl,
          fileName: fileName,
          originalName: file.name,
          size: file.size,
          type: file.type,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('处理请求时发生错误:', error);
    return new Response(
      JSON.stringify({
        error: '服务器内部错误',
        message: error instanceof Error ? error.message : '未知错误',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});