import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  // 清除所有相关的 cookies
  cookies().delete('token')
  cookies().delete('user')

  return NextResponse.json({ success: true })
} 