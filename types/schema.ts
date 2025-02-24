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
  contact_person: string;    // 联系人
  contact_mobile: string;    // 联系手机
  contact_phone?: string;    // 座机号码（选填）
  contact_email?: string;    // 预留邮箱（选填）
  computer: string;    // 报名电脑，用户填入
  network: string;    // 报名网络，用户填入
  images_path?: string[];      // 报名图片路径
}

// 保证金阶段(报名后进入保证金阶段,下一步是提交保证金信息)
export interface DepositInfo {
  type: DepositType;        // 保证金方式
  images_path?: string[];      // 保证金图片路径
}

// 上传阶段信息(保证金提交后进入上传阶段,下一步是提交上传标书信息)
export interface PreparationInfo {
  computer: string;    // 上传电脑，用户填入
  network: string;    // 上传网络，用户填入
  mac_address?: string;    // 上传标书中的mac地址
  ip_address?: string;    // 上传标书中的ip地址
  images_path?: string[];    // 上传图片路径,多个图片
  documents_path?: string[];       // 标书文件路径,多个文件
  // 投标文件
  bid_files?: string[];
  // 资格文件
  qualification_files?: string[];
  // 其他文件
  other_files?: string[];
  // 备注
  remarks?: string;
}

// 报价阶段信息(制作标书完成后进入报价阶段,报价完成后项目就结束了)
export interface BiddingInfo {
  images_path?: string[];    // 上传图片URL,多个图片
  documents_path?: string[];       // 标书文件路径,多个文件
}

// 数据表定义
export interface Tables {
  // 项目表
  bid_projects: Project;

  // 用户表
  bid_users: User;

  // 公司表
  bid_companies: Company;

  // 项目日志表
  bid_projects_logs: {
    id: number;                    // 项目日志ID
    bid_project_bid_projects: number;           // 关联项目ID，关联名称bid_project
    bid_user_bid_users: number;              // 关联操作人ID,关联名称bid_user
    user_ip: string;              // 操作人IP
    user_agent: string;              // 操作人浏览器信息
    action_type: "submit_registration" | "submit_deposit" | "submit_preparation" | "submit_bidding" | "take_project" | "cancel_project" | "create_project";              // 操作类型
    action_info: RegistrationInfo | DepositInfo | PreparationInfo | BiddingInfo | any;              // 操作信息
    content: string;//日志内容
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

  // 串标检测记录
  bid_checks: {
    id: number;
    bid_project_bid_projects: number;//关联项目id（仅用作记录）
    project_name: string;//项目名称
    company_name: string;//项目对应的公司名称
    is_resolve: boolean;//是否解决
    resolve_content?: string;//解决说明
    created_at: string;
    updated_at: string;
  }
  bid_checks_projects: {
    id: number;
    bid_check_bid_checks: number;//关联检测id
    bid_project_bid_projects: number;//关联项目id（仅用作记录）
    company_name: string;//项目对应的公司名称
    conflict_content: string;//与公司的冲突内容：如：【报名联系人、报名联系手机、报名座机号码、报名预留邮箱、报名网络、报名电脑、上传电脑、上传网络、上传mac、上传ip】可以有多个冲突
    created_at: string;
    updated_at: string;
  }
}
export interface User {
  id: number;                    // 用户ID
  code: string;                  // 登录暗号
  name: string;                  // 用户姓名
  phone?: string;                // 手机号(用于短信通知)
  role: 'admin' | 'staff';       // 角色(管理员/员工)
  status: 'active' | 'inactive'; // 状态(启用/禁用)
  created_at: string;
  updated_at: string;
}
export interface Project {
  id: number;                    // 项目ID
  name: string;                  // 项目名称,规则为：batch_name（product_name），如：A01（Laptop）
  
  batch_name: string;   // 投标批次
  product_name: string; // 投标产品
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
  bid_company_bid_companies?: number; // 关联公司ID,关联名称bid_company
  bid_user?: {
    id: number;
    name: string;
    phone: string;
  };
  bid_company?: {
    id: number;
    name: string;
    status: 'active' | 'inactive';
  };
}

export interface Company {
  id: number;
  name: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}