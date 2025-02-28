# 招标管理系统快速部署指南

本文档提供了最简洁的部署步骤，帮助您快速将系统部署到生产环境。详细说明请参考 [完整部署指南](./deployment-guide.md)。

## 前提条件

- 已安装 Docker 与 Docker Compose
- 已配置域名 `bid_manage.weweknow.com` 指向服务器IP
- 服务器防火墙已开放 80/443 端口

## 5分钟部署步骤

1. **克隆代码**

```bash
git clone <项目Git仓库URL>
cd bids-manage
```

2. **执行部署脚本**

```bash
chmod +x deploy.sh
./deploy.sh
```

3. **验证部署**

浏览器访问: `http://bid_manage.weweknow.com`

## 启用HTTPS (可选)

1. **准备SSL证书**

将SSL证书文件放入 `nginx/ssl` 目录:
- `fullchain.pem`: 证书文件
- `privkey.pem`: 私钥文件

2. **启用HTTPS**

```bash
chmod +x enable-https.sh
./enable-https.sh
```

根据提示选择是否启用HTTP到HTTPS自动重定向。

3. **验证HTTPS**

浏览器访问: `https://bid_manage.weweknow.com`
