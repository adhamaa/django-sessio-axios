import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { registerGlobalErrors } from "./registerGlobalErrors";
// import { showToastError } from "src/helpers/toast";

import { getCookie, setCookie } from "typescript-cookie";

declare module "axios" {
  export interface AxiosRequestConfig {
    raw?: boolean;
    silent?: boolean;
  }
}

interface HttpData {
  code: string;
  description?: string;
  status: number;
}

type THttpError = Error | AxiosError | null;

export class HttpError extends Error {
  constructor(message?: string) {
    super(message); // 'Error' breaks prototype chain here
    this.name = "HttpError";
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }
}

function responseHandler(response: AxiosResponse<any>) {
  const config = response?.config;
  if (config.raw) {
    return response;
  }
  if (response.status == 200) {
    const data = response?.data;
    if (!data) {
      throw new HttpError("Erro na API. Resposta sem dados!");
    }
    return data;
  }
  throw new HttpError("Erro na API. Codigo de status invalido!");
}

function isErrorHandlerObject(value: any): value is ErrorHandlerObject {
  if (typeof value === "object") {
    return ["message", "after", "before", "notify"].some((k) => k in value);
  }
  return false;
}

interface ErrorHandlerObject {
  after?(error?: THttpError, options?: ErrorHandlerObject): void;
  before?(error?: THttpError, options?: ErrorHandlerObject): void;
  message?: string;
  notify?: any;
}

type ErrorHandlerFunction = (
  error?: THttpError
) => ErrorHandlerObject | boolean | undefined;

type ErrorHandler = ErrorHandlerFunction | ErrorHandlerObject | string;

interface ErrorHandlerMany {
  [key: string]: ErrorHandler;
}

class ErrorHandlerRegistry {
  private handlers = new Map<string, ErrorHandler>();

  private parent: ErrorHandlerRegistry | null = null;

  constructor(parent?: ErrorHandlerRegistry, input?: ErrorHandlerMany) {
    if (typeof parent !== "undefined") this.parent = parent;
    if (typeof input !== "undefined") this.registerMany(input);
  }

  register(key: string, handler: ErrorHandler) {
    this.handlers.set(key, handler);
    return this;
  }
  unregister(key: string) {
    this.handlers.delete(key);
    return this;
  }

  find(seek: string): ErrorHandler | undefined {
    const handler = this.handlers.get(seek);
    if (handler) return handler;
    return this.parent?.find(seek);
  }

  registerMany(input: ErrorHandlerMany) {
    for (const [key, value] of Object.entries(input)) {
      this.register(key, value);
    }
    return this;
  }

  handleError(
    this: ErrorHandlerRegistry,
    seek: (string | undefined)[] | string,
    error: THttpError
  ): boolean {
    if (Array.isArray(seek)) {
      return seek.some((key) => {
        if (key !== undefined) return this.handleError(String(key), error);
      });
    }
    const handler = this.handlers.get(String(seek));
    if (!handler) {
      return false;
    } else if (typeof handler === "string") {
      return this.handleErrorObject(error, { message: handler });
    } else if (typeof handler === "function") {
      const result = handler(error);
      if (isErrorHandlerObject(result))
        return this.handleErrorObject(error, result);
      return !!result;
    } else if (isErrorHandlerObject(handler)) {
      return this.handleErrorObject(error, handler);
    }
    return false;
  }

  handleErrorObject(error: THttpError, options: ErrorHandlerObject = {}) {
    options?.before?.(error, options);
    alert(options.message ?? "Unknown Error!!");
    // showToastError(options.message ?? "Unknown Error!!", options, "error");
    return true;
  }

  responseErrorHandler(
    this: ErrorHandlerRegistry,
    error: THttpError,
    direct?: boolean
  ) {
    if (error === null)
      throw new Error("Unrecoverrable error!! Error is null!");
    if (axios.isAxiosError(error)) {
      const response = error?.response;
      const config = error?.config;
      const data = response?.data as HttpData;
      if (!direct && config?.raw) throw error;
      const seekers = [
        data?.code,
        error.code,
        error?.name,
        String(data?.status),
        String(response?.status),
      ];
      const result = this.handleError(seekers, error);
      if (!result) {
        if (data?.code && data?.description) {
          return this.handleErrorObject(error, {
            message: data?.description,
          });
        }
      }
    } else if (error instanceof Error) {
      return this.handleError(error.name, error);
    }
    //if nothings works, throw away
    throw error;
  }
}

const globalHandlers = new ErrorHandlerRegistry();
registerGlobalErrors(globalHandlers);

export function registerError(key: string, handler: ErrorHandler) {
  globalHandlers.register(key, handler);
}

export function dealWith(solutions: ErrorHandlerMany, ignoreGlobal?: boolean) {
  let global;
  if (ignoreGlobal === false) global = globalHandlers;
  const localHandlers = new ErrorHandlerRegistry(global, solutions);
  return (error: any) => localHandlers.responseErrorHandler(error, true);
}

function createHttpInstance() {
  const instance = axios.create({
    baseURL:
      "http://alb-dangabay-1a-702507269.ap-southeast-1.elb.amazonaws.com:81/api/v4",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Token 557347dffddcae45f0d00b4330aeac985bb42eb3`,
    },
  });

  // instance.defaults.withCredentials = true;
  // instance.defaults.xsrfCookieName = "csrftoken";
  // instance.defaults.xsrfHeaderName = "X-CSRFToken";

  const responseError = (error: any) =>
    globalHandlers.responseErrorHandler(error);

  // Add a request interceptor
  instance.interceptors.request.use((config: AxiosRequestConfig) => {
    const token =
      getCookie("mayan_token") || "557347dffddcae45f0d00b4330aeac985bb42eb3";

    if (config.headers) {
      config.headers["Authorization"] = `Token ${token}`;
    }
    return config;
  }, responseError);

  // Add a response interceptor
  instance.interceptors.response.use(responseHandler, responseError);

  return instance;
}

export const http: AxiosInstance = createHttpInstance();
