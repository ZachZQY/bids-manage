const config = {
  domain: 'http://file.weweknow.com'
};

// 获取文件完整URL
export function getFileUrl(key: string) {
  return `${config.domain}/${key}`;
}

// 生成唯一的文件名
export function generateKey(filename: string) {
  const ext = filename.split('.').pop();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}.${ext}`;
} 