const REQ_ID_PREFIX = 'gnc_msg91_req_id_';

export function storeOtpReqId(identifier: string, reqId: string): void {
  sessionStorage.setItem(`${REQ_ID_PREFIX}${identifier}`, reqId);
}

export function loadOtpReqId(identifier: string): string | undefined {
  const value = sessionStorage.getItem(`${REQ_ID_PREFIX}${identifier}`);
  return value ?? undefined;
}

export function clearOtpReqId(identifier: string): void {
  sessionStorage.removeItem(`${REQ_ID_PREFIX}${identifier}`);
}
