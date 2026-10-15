import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'spendsense.token';
const SERVER_KEY = 'spendsense.server';

export class ApiError extends Error {
  status: number;
  code: string;
  details: Array<{ field?: string; message: string }>;
  requestId?: string;
  constructor(status: number, code: string, message: string, details: ApiError['details'] = [], requestId?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

/** Best guess of where the API runs during development: same machine as the Metro bundler, port 5000. */
function defaultBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];
  if (host) return `http://${host}:5000`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
}

let baseUrl = defaultBaseUrl();
let token: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export const getBaseUrl = () => baseUrl;
export const getToken = () => token;
export const onUnauthorized = (fn: (() => void) | null) => {
  unauthorizedHandler = fn;
};

export function normalizeServerUrl(input: string): string {
  let url = input.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(url)) url = `http://${url}`;
  return url.replace(/\/api\/v1$/, '');
}

export async function loadStoredSession(): Promise<string | null> {
  try {
    const [t, s] = await Promise.all([
      SecureStore.getItemAsync(TOKEN_KEY),
      SecureStore.getItemAsync(SERVER_KEY),
    ]);
    if (s) baseUrl = s;
    token = t;
    return t;
  } catch {
    return null;
  }
}

export async function setToken(next: string | null) {
  token = next;
  try {
    if (next) await SecureStore.setItemAsync(TOKEN_KEY, next);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    /* secure storage unavailable: the session just won't survive a restart */
  }
}

export async function setServerUrl(url: string | null) {
  baseUrl = url ? normalizeServerUrl(url) : defaultBaseUrl();
  try {
    if (url) await SecureStore.setItemAsync(SERVER_KEY, baseUrl);
    else await SecureStore.deleteItemAsync(SERVER_KEY);
  } catch {
    /* ignore */
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  query?: Query;
  body?: unknown;
  form?: FormData;
  /** Skip the global 401 handler (login/register/change-password return 401 for bad credentials). */
  noAuthRedirect?: boolean;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Query) {
  const qs = query
    ? Object.entries(query)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';
  return `${baseUrl}/api/v1${path}${qs ? `?${qs}` : ''}`;
}

export async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (opts.form) {
    body = opts.form; // fetch sets the multipart boundary itself
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), { method, headers, body, signal: opts.signal });
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw e;
    throw new ApiError(0, 'NETWORK_ERROR', `Can't reach the server at ${baseUrl}. Check your connection or server address.`);
  }

  if (res.status === 204) return undefined as T;

  let json: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      /* non-JSON error body */
    }
  }

  if (!res.ok) {
    const err = (json as { error?: { code?: string; message?: string; details?: ApiError['details']; requestId?: string } } | null)?.error;
    // Only a missing/expired token ends the session; INVALID_CREDENTIALS (wrong password on
    // change-password / delete-account) is an ordinary form error.
    if (res.status === 401 && err?.code === 'AUTHENTICATION_REQUIRED' && !opts.noAuthRedirect && token) {
      unauthorizedHandler?.();
    }
    throw new ApiError(
      res.status,
      err?.code ?? 'UNKNOWN',
      err?.message ?? `Request failed (${res.status})`,
      err?.details ?? [],
      err?.requestId,
    );
  }
  return json as T;
}

export const api = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) => request<T>('GET', path, { query, signal }),
  post: <T>(path: string, body?: unknown, o?: Pick<RequestOptions, 'noAuthRedirect'>) =>
    request<T>('POST', path, { body, ...o }),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  delete: <T = void>(path: string, query?: Query, body?: unknown) => request<T>('DELETE', path, { query, body }),
  upload: <T>(path: string, form: FormData) => request<T>('POST', path, { form }),
};

/** Human-friendly message, folding field-level validation details in. */
export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.code === 'VALIDATION_ERROR' && e.details.length > 0) {
      return e.details.map((d) => (d.field ? `${d.field}: ${d.message}` : d.message)).join('\n');
    }
    return e.message;
  }
  return e instanceof Error ? e.message : 'Something went wrong';
}
