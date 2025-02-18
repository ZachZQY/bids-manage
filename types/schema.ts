// 项目状态枚举
export type BidStatus = 
  | 'pending'      // 待接单
  | 'registration' // 报名阶段
  | 'deposit'      // 保证金阶段
  | 'preparation'  // 上传阶段
  | 'bidding'      // 报价阶段
  | 'completed'    // 已完成

// 保证金方式枚举
export enum DepositType {
  INSURANCE = 'insurance',         // 保证金保险
  BANK_GUARANTEE = 'bankGuarantee', // 银行保函
  TRANSFER = 'transfer',           // 网银汇款
  NONE = 'none'                    // 不收取保证金
}

// 各阶段信息类型定义

// 报名阶段(接单后进入报名阶段,可以操作取消接单,也可以操作确认报名)
export interface RegistrationInfo {
  computer: string;    // 电脑信息，用户填入
  network: string;    // 网络信息，用户填入
  images_path?: string[];      // 报名图片路径
}

// 保证金阶段(报名后进入保证金阶段,下一步是上传保证金信息)
export interface DepositInfo {
  type: DepositType;        // 保证金方式
  images_path?: string[];      // 保证金图片路径
}

// 制作阶段信息(保证金上传后进入制作阶段,下一步是上传标书信息)
export interface PreparationInfo {
  computer: string;    // 电脑信息，用户填入
  network: string;    // 网络信息，用户填入
  mac_address?: string;    // 上传标书中的mac地址
  ip_address?: string;    // 上传标书中的ip地址
  images_url?: string[];    // 上传图片URL,多个图片
  documents_url?: string[];       // 标书文件URL,多个文件
}

// 报价阶段信息(制作标书完成后进入报价阶段,报价完成后项目就结束了)
export interface BiddingInfo {
    images_url?: string[];    // 上传图片URL,多个图片
    documents_url?: string[];       // 标书文件URL,多个文件
}

// 数据表定义
export interface Tables {
  // 项目表
  bid_projects: Project;

  // 用户表
  bid_users: User;

  // 项目日志表
  bid_projects_logs: {
    id: number;                    // 项目日志ID
    bid_project_bid_projects: number;           // 关联项目ID，关联名称bid_project
    bid_user_bid_users: number;              // 关联操作人ID,关联名称bid_user
    user_ip: string;              // 操作人IP
    user_agent: string;              // 操作人浏览器信息
    action_type:"registration" | "deposit" | "preparation" | "bidding";              // 操作类型
    action_info:RegistrationInfo | DepositInfo | PreparationInfo | BiddingInfo;              // 操作信息
    created_at: string;
    updated_at: string;
  };

  // 通知记录表
  bid_notifications: {
    id: number;                    // 通知ID
    notification_type: 'new_project' | 'status_change' | 'deadline_reminder';  // 通知类型
    content: string;              // 通知内容
    phone: string;              // 手机号
    status: 'pending' | 'sent' | 'failed';  // 通知状态
    created_at: string;
    updated_at: string;
  };
}
export interface User {
  id: number;                    // 用户ID
  code: string;                  // 登录暗号
  name: string;                  // 用户姓名
  phone?: string;                // 手机号(用于短信通知)
  role: 'admin' | 'staff';       // 角色(管理员/员工)
  created_at: string;
  updated_at: string;
}
export interface Project {
  id: number;                    // 项目ID
  name: string;                  // 项目名称
  bidding_deadline: string;      // 开标时间
  registration_deadline: string; // 报名截止时间
  bid_user_bid_users?: number;   // 接单处理人ID,关联名称bid_user
  
  status: BidStatus;            // 项目状态
  
  registration_at: string;       // 操作报名时间
  deposit_at: string;           // 上传保证金时间
  preparation_at: string;       // 上传制作标书时间
  bidding_at: string;           // 上传报价时间
  // 各阶段信息,分开存储便于查询
  registration_info: RegistrationInfo;    // 报名阶段信息(JSONB)
  deposit_info: DepositInfo;             // 保证金阶段信息(JSONB)
  preparation_info: PreparationInfo;     // 制作阶段信息(JSONB)
  bidding_info: BiddingInfo;            // 报价阶段信息(JSONB)
  
  created_at: string;           // 创建时间
  updated_at: string;           // 更新时间
} 