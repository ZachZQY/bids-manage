import { NextResponse } from 'next/server'
import { getUploadToken, generateKey } from '@/lib/qiniu.server'
import * as qiniu from 'qiniu'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: '未找到文件' },
        { status: 400 }
      )
    }

    // 生成文件名和上传凭证
    const key = generateKey(file.name)
    const token = getUploadToken(key)
    
    // 转换文件为 Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 配置上传
    const config = new qiniu.conf.Config()
    // 自动获取上传空间的区域配置
    config.zone = null
    // 是否使用https域名
    //config.useHttpsDomain = true
    // 上传是否使用cdn加速
    //config.useCdnDomain = true

    const formUploader = new qiniu.form_up.FormUploader(config)
    const putExtra = new qiniu.form_up.PutExtra()

    return new Promise<Response>((resolve) => {
      formUploader.put(token, key, buffer, putExtra, (err, body, info) => {
        if (err) {
          console.error('上传失败:', err)
          resolve(NextResponse.json(
            { error: '上传失败' },
            { status: 500 }
          ))
          return
        }
        
        if (info.statusCode === 200) {
          resolve(NextResponse.json({ path: key }))
        } else {
          resolve(NextResponse.json(
            { error: body.error },
            { status: info.statusCode }
          ))
        }
      })
    })

  } catch (error) {
    console.error('上传文件失败:', error)
    return NextResponse.json(
      { error: '上传文件失败' },
      { status: 500 }
    )
  }
}

export const config = {
  api: {
    bodyParser: false
  }
}