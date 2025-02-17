import { EzClient } from 'ezcloudbase';
import config from '../ez.config.json';
import type { Tables } from '../types/schema';

// 创建数据库客户端实例
export const db = new EzClient({
  endpoint_url: config.endpoint_url
});

// 项目相关操作
export const projectDB = {
  // 获取项目列表
  async list(params: {
    status?: string;
    pageSize?: number;
    pageNum?: number;
    userId?: number;
    excludeStatus?: string[];
  }) {
    const { status, pageSize = 10, pageNum = 1, userId, excludeStatus } = params;
    
    // 构建查询条件
    const where: Record<string, any> = {};
    if (status) {
      where.status = { _eq: status };
    }
    if (userId) {
      where.bid_user_bid_users = { _eq: userId };
    }
    if (excludeStatus?.length) {
      where.status = { _nin: excludeStatus };
    }

    // 分页查询
    const { datas, aggregate } = await db.find({
      name: "bid_projects",
      page_number: pageNum,
      page_size: pageSize,
      args: {
        where,
        order_by: {
          registration_deadline: () => "asc"  // 按报名截止时间排序
        }
      },
      fields: [
        "id",
        "name",
        "product",
        "registration_deadline",
        "bidding_deadline",
        "status",
        "registration_info",
        "deposit_info",
        "preparation_info",
        "bidding_info",
        {
          name: "bid_user",  // 关联处理人信息
          fields: ["id", "name", "phone"]
        }
      ],
      aggregate_fields: ["count"]  // 获取总数
    });

    return {
      list: datas as Tables['bid_projects'][],
      pagination: {
        total: aggregate.count,
        pageSize,
        pageNum
      }
    };
  },

  // 创建项目
  async create(data: {
    name: string;
    product: string;
    registration_deadline: number;
    bidding_deadline: number;
    bid_user_bid_users?: number | null;
  }) {
    return db.mutation({
      name: "insert_bid_projects_one",
      args: {
        object: {
          name: data.name,
          product: data.product,
          registration_deadline: data.registration_deadline,
          bidding_deadline: data.bidding_deadline,
          bid_user_bid_users: data.bid_user_bid_users,
          // 如果指定了工作人员，则状态为 registering，否则为 pending
          status: data.bid_user_bid_users ? 'registering' : 'pending' as const,
          registration_info: {},
          deposit_info: {},
          preparation_info: {},
          bidding_info: {}
        }
      },
      fields: ["id", "name", "status"]
    });
  },

  // 更新项目
  async update(id: number, data: {
    status?: string;
    bid_user_bid_users?: number;
  }) {
    return db.mutationGetFirstOne({
      name: "update_bid_projects",
      args: {
        where: { id: { _eq: id } },
        _set: data
      },
      returning_fields: ["id", "status", "bid_user_bid_users"]
    });
  },

  // 获取工作进度
  async getProgress(userId: number) {
    // 获取统计数据
    const { aggregate } = await db.find({
      name: "bid_projects",
      args: {
        where: {
          bid_user_bid_users: { _eq: userId }
        }
      },
      aggregate_fields: [
        "count",
        {
          name: "count",
          args: {
            where: { status: { _eq: "completed" } }
          },
          alias: "completed_count"
        },
        {
          name: "count",
          args: {
            where: {
              status: { _nin: ["completed", "pending"] }
            }
          },
          alias: "in_progress_count"
        },
        {
          name: "count",
          args: {
            where: {
              created_at: {
                _gte: Math.floor(new Date().setDate(1) / 1000)
              }
            }
          },
          alias: "this_month_count"
        }
      ]
    });

    // 获取进行中的项目
    const { datas } = await db.find({
      name: "bid_projects",
      args: {
        where: {
          bid_user_bid_users: { _eq: userId },
          status: { _nin: ["completed", "pending"] }
        },
        order_by: {
          registration_deadline: () => "asc"
        }
      },
      fields: [
        "id",
        "name",
        "status",
        "registration_deadline",
        "bidding_deadline"
      ]
    });

    // 计算每个项目的进度
    const projects = datas.map(project => {
      let progress = 0;
      switch (project.status) {
        case 'registering':
          progress = 25;
          break;
        case 'preparing':
          progress = 50;
          break;
        case 'bidding':
          progress = 75;
          break;
        case 'completed':
          progress = 100;
          break;
      }
      return { ...project, progress };
    });

    return {
      statistics: {
        total: aggregate.count,
        completed: aggregate.completed_count,
        inProgress: aggregate.in_progress_count,
        thisMonth: aggregate.this_month_count
      },
      projects
    };
  },

  // 更新报名信息
  async updateRegistration(id: number, data: {
    registration_info: Record<string, any>;
    status: string;
  }) {
    return db.mutationGetFirstOne({
      name: "update_bid_projects",
      args: {
        where: { id: { _eq: id } },
        _set: data
      },
      returning_fields: ["id", "status", "registration_info"]
    });
  },

  // 获取项目详情
  async getById(id: number) {
    return db.queryGetFirstOne({
      name: "bid_projects",
      args: {
        where: { id: { _eq: id } }
      },
      fields: [
        "id",
        "name",
        "product",
        "registration_deadline",
        "bidding_deadline",
        "status",
        "registration_info",
        "deposit_info",
        "preparation_info",
        "bidding_info",
        {
          name: "bid_user",
          fields: ["id", "name", "phone"]
        }
      ]
    });
  },

  // 更新标书信息
  async updatePreparation(id: number, data: {
    preparation_info: Record<string, any>;
    status: string;
  }) {
    return db.mutationGetFirstOne({
      name: "update_bid_projects",
      args: {
        where: { id: { _eq: id } },
        _set: data
      },
      returning_fields: ["id", "status", "preparation_info"]
    });
  },

  // 更新报价信息
  async updateBidding(id: number, data: {
    bidding_info: Record<string, any>;
    status: string;
  }) {
    return db.mutationGetFirstOne({
      name: "update_bid_projects",
      args: {
        where: { id: { _eq: id } },
        _set: data
      },
      returning_fields: ["id", "status", "bidding_info"]
    });
  }
};

