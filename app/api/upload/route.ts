import { NextResponse } from 'next/server'
import { getUploadToken, generateKey } from '@/lib/qiniu.server'
import * as qiniu from 'qiniu'

// 上传单个文件
async function uploadFile(file: File): Promise<string> {
  // 生成文件名和上传凭证
  const key = generateKey(file.name)
  const token = getUploadToken(key)
  
  // 转换文件为 Buffer
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // 配置上传
  const config = new qiniu.conf.Config()
  config.zone = null

  const formUploader = new qiniu.form_up.FormUploader(config)
  const putExtra = new qiniu.form_up.PutExtra()

  return new Promise((resolve, reject) => {
    formUploader.put(token, key, buffer, putExtra, (err, body, info) => {
      if (err) {
        console.error('上传失败:', err)
        reject(new Error('上传失败'))
        return
      }
      
      if (info.statusCode === 200) {
        resolve(key)
      } else {
        reject(new Error(`上传失败: ${info.statusCode}`))
      }
    })
  })
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: '未找到文件' },
        { status: 400 }
      )
    }

    // 上传所有文件
    const uploadPromises = files.map(file => uploadFile(file))
    const paths = await Promise.all(uploadPromises)

    return NextResponse.json({ paths })
  } catch (error) {
    console.error('上传失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '上传失败' },
      { status: 500 }
    )
  }
}

export const config = {
  api: {
    bodyParser: false
  }
}