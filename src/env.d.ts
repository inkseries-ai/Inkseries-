interface EmailParams {
  to: string;
  subject: string;
  html_body?: string;
  text_body?: string;
  reply_to?: string;
  customer_id?: string;
  broadcast?: boolean;
}

interface EmailResult {
  success: boolean;
  message_id?: string;
  error?: string;
}

interface EmailService {
  send(params: EmailParams): Promise<EmailResult>;
}

declare interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  EMAILS: EmailService;
  MOCHA_USERS_SERVICE_API_URL: string;
  MOCHA_USERS_SERVICE_API_KEY: string;
  PAYSTACK_SECRET_KEY: string;
  FLUTTERWAVE_SECRET_KEY: string;
  CONTACT_EMAIL: string;
  CRON_SECRET?: string;
}
