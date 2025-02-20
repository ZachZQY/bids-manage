export function getFileInfo(url: string) {
  const fileName = url.split('/').pop() || ''
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  
  // 文件类型映射
  const typeMap: Record<string, string> = {
    pdf: 'PDF文档',
    doc: 'Word文档',
    docx: 'Word文档',
    xls: 'Excel表格',
    xlsx: 'Excel表格',
    jpg: '图片',
    jpeg: '图片',
    png: '图片',
    zip: '压缩包',
    rar: '压缩包'
  }

  return {
    name: fileName,
    type: typeMap[ext] || '未知类型',
    ext: ext.toUpperCase()
  }
} 