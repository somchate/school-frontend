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
