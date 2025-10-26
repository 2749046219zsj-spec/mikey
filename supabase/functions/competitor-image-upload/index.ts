import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: '只支持POST请求' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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

    let metadata = {};
    try {
      metadata = metadataStr ? JSON.parse(metadataStr) : {};
    } catch (e) {
      console.error('解析元数据失败:', e);
    }

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `competitor/${timestamp}_${randomStr}.${extension}`;

    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabaseClient
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

    const { data: urlData } = supabaseClient
      .storage
      .from('reference-images')
      .getPublicUrl(fileName);

    const { data: dbData, error: dbError } = await supabaseClient
      .from('public_reference_images')
      .insert({
        product_id: null,
        name: file.name,
        file_name: fileName,
        image_url: urlData.publicUrl,
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
      return new Response(
        JSON.stringify({ error: `数据库保存失败: ${dbError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

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