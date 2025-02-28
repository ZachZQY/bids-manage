# 招标管理系统部署指南

本文档详细说明了如何使用Docker将招标管理系统部署到生产环境。

## 目录
1. [前提条件](#前提条件)
2. [获取代码](#获取代码)
3. [基本部署（HTTP）](#基本部署http)
4. [启用HTTPS（可选）](#启用https可选)
5. [维护与更新](#维护与更新)
6. [常见问题](#常见问题)

## 前提条件

在开始部署之前，确保服务器满足以下条件：

- 已安装Docker和Docker Compose
- 已配置域名（bid_manage.weweknow.com）并指向服务器IP
- 服务器防火墙已开放80端口（HTTP）和443端口（HTTPS，可选）

### 安装Docker和Docker Compose

如果服务器尚未安装Docker，请执行以下命令：

**Ubuntu/Debian：**
```bash
sudo apt update
sudo apt install docker.io docker-compose -y
sudo systemctl enable docker
sudo systemctl start docker
```

**CentOS/RHEL：**
```bash
sudo yum install -y docker
sudo systemctl enable docker
sudo systemctl start docker
sudo yum install -y docker-compose
```

## 获取代码

通过Git克隆项目代码：

```bash
git clone <项目Git仓库URL>
cd bids-manage
```

## 基本部署（HTTP）

基本部署将使系统通过HTTP协议可访问，这适用于内部系统或不需要加密的场景。

### 步骤1：准备部署脚本

确保部署脚本有执行权限：

```bash
chmod +x deploy.sh
chmod +x enable-https.sh
```

### 步骤2：运行部署脚本

```bash
./deploy.sh
```

此脚本将执行以下操作：
- 创建必要的目录
- 构建Docker镜像
- 启动Docker容器
- 配置Nginx反向代理

### 步骤3：验证部署

部署完成后，通过浏览器访问：
```
http://bid_manage.weweknow.com
```

如果一切正常，您将看到招标管理系统的登录页面。

## 启用HTTPS（可选）

如果您需要更高的安全性，可以配置HTTPS。

### 步骤1：获取SSL证书

您可以从多种途径获取SSL证书：

1. **使用Let's Encrypt（免费）**：
   ```bash
   sudo apt install certbot -y
   sudo certbot certonly --standalone -d bid_manage.weweknow.com
   ```
   
   证书通常会保存在：`/etc/letsencrypt/live/bid_manage.weweknow.com/`

2. **使用商业证书**：从证书颁发机构购买证书

### 步骤2：配置SSL证书

将SSL证书文件复制到正确位置：

```bash
# 创建目录
mkdir -p nginx/ssl

# 复制证书（Let's Encrypt示例）
sudo cp /etc/letsencrypt/live/bid_manage.weweknow.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/bid_manage.weweknow.com/privkey.pem nginx/ssl/
sudo chown -R $(whoami):$(whoami) nginx/ssl/
```

### 步骤3：启用HTTPS

运行HTTPS启用脚本：

```bash
./enable-https.sh
```

脚本会询问是否要启用HTTP到HTTPS的自动重定向：
- 选择"y"：用户访问HTTP将自动重定向到HTTPS
- 选择"n"：HTTP和HTTPS将同时可用

### 步骤4：验证HTTPS

通过浏览器访问：
```
https://bid_manage.weweknow.com
```

确认浏览器显示安全连接图标。

## 维护与更新

### 查看日志

```bash
# 查看应用日志
docker logs bid-manage-container

# 查看Nginx日志
docker logs bid-manage-nginx
```

### 重启服务

```bash
docker-compose restart
```

### 更新应用

当代码有更新时，按以下步骤更新：

```bash
# 拉取最新代码
git pull

# 重新部署
./deploy.sh
```

## 常见问题

### 端口被占用

如果80或443端口已被占用，可以修改`docker-compose.yml`文件更改端口映射：

```yaml
ports:
  - "8080:80"  # 将主机的8080端口映射到容器的80端口
  - "8443:443" # 将主机的8443端口映射到容器的443端口
```

修改后，记得更新Nginx配置文件中的域名监听端口。

### 容器无法启动

检查Docker日志：

```bash
docker-compose logs
```

### SSL证书过期

Let's Encrypt证书有效期为90天，请设置定时任务更新证书：

```bash
# 编辑crontab
crontab -e

# 添加以下行（每月更新一次证书）
0 0 1 * * certbot renew && cp /etc/letsencrypt/live/bid_manage.weweknow.com/fullchain.pem /path/to/bids-manage/nginx/ssl/ && cp /etc/letsencrypt/live/bid_manage.weweknow.com/privkey.pem /path/to/bids-manage/nginx/ssl/ && docker-compose restart nginx
```

---

如有任何部署问题，请联系系统管理员或开发团队。
