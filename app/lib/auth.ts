import { cookies } from 'next/headers'

export async function getUser() {
  const cookieStore = await cookies()
  const userCookie = cookieStore.get('user')
  
  if (!userCookie?.value) return null
  
  return JSON.parse(userCookie.value)
}