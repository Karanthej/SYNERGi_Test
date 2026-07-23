export interface CallLogResponse {
  uuid: string;
  callerId: string;
  receiverId: string;
  status: string;
  durationSeconds: number;
  startedAt: string;
}
