/** 联系人识别状态 */
export type ContactStatus = 'pending' | 'processing' | 'completed' | 'failed';

/** 联系人数据接口 */
export interface Contact {
  /** 唯一标识（前端生成 UUID） */
  id: string;
  /** 原始图片文件 */
  imageFile: File;
  /** 图片预览 URL（createObjectURL） */
  imageUrl: string;
  /** 当前识别状态 */
  status: ContactStatus;
  /** 失败时的错误信息 */
  error?: string;
  /** 姓名 */
  name: string | null;
  /** 公司 */
  organization: string | null;
  /** ASN（可选，人工填写） */
  asn: string;
  /** 职位 */
  title: string | null;
  /** 邮箱列表 */
  emails: string[];
  /** 电话列表 */
  phones: string[];
  /** 用户备注（VCF NOTE 字段） */
  notes: string;
  /** 网站 URL（VCF URL 字段） */
  url: string;
  /** 地址（VCF ADR 字段） */
  address: string;
  /** 创建时间戳 */
  createdAt?: number;
}

/** AI Vision API 返回的识别结果 */
export interface RecognizeResult {
  name: string | null;
  organization: string | null;
  title: string | null;
  emails: string[];
  phones: string[];
  /** AI 可能识别出的网站 */
  url: string | null;
  /** AI 可能识别出的地址 */
  address: string | null;
}

/** 持久化存储用接口（Supabase 云端） */
export interface StoredContact {
  id: string;
  image_path: string | null;
  image_url?: string;
  createdAt: number;
  name: string | null;
  organization: string | null;
  asn: string;
  title: string | null;
  emails: string[];
  phones: string[];
  notes: string;
  url: string;
  address: string;
}

/** 应用视图状态 */
export type AppView = 'upload' | 'editor' | 'cardbook' | 'carddetail' | 'about';
