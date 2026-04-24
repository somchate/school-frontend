export enum LoginType {
  SCHOOL_ID = 1,
  PID = 2,
  SMC = 3,
  ANOTHER = 4
}

export interface LoginRequest {
  loginType: LoginType;
  username: string;
  password?: string;
  pid?: string;
  cid?: string;
  xxxReply?: string;
  verified?: boolean;
  /** Google reCAPTCHA v3 */
  recaptchaToken?: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
  /** backend แจ้งว่าต้องบังคับเปลี่ยนรหัสผ่าน (เช่น ยังใช้รหัสเริ่มต้น "123") */
  mustChangePassword?: boolean;
}

export interface User {
  id: string;
  username: string;
  accessLevel: number;
  schoolId?: string;
  schoolName?: string;
}

export interface SMCData {
  pid: string;
  cid: string;
  xxxReply: string;
  verified: boolean;
}
