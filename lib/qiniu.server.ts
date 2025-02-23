import * as qiniu from 'qiniu';

const config = {
  accessKey: 'FvCBqXVRIyIdXgOsU8HTkthfofNJl9uO4VSekvix',
  secretKey: 'b-yOYclR_uM7I-V0FSy4_WCC80i5g4LoZ6jUfh89',
  bucket: 'weweknow'
};

// 创建鉴权对象
const mac = new qiniu.auth.digest.Mac(config.accessKey, config.secretKey);


// 获取上传凭证
export function getUploadToken(key: string) {
  const putPolicy = new qiniu.rs.PutPolicy({
    scope: `${config.bucket}:${key}`,
    expires: 3600
  });
  return putPolicy.uploadToken(mac);
}

// 生成唯一的文件名
export function generateKey(filename: string) {
  const ext = filename.split('.').pop();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}.${ext}`;
} 


