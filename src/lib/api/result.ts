import type {
  ApiClientResponse,
  ApiError,
  ApiFieldErrors,
  ApiResult,
} from "./types";

type ApiContractValidator<T> = (data: unknown) => data is T;

interface ApiResultOptions<T> {
  validate?: ApiContractValidator<T>;
  validationMessage?: string;
}

const NETWORK_ERROR: ApiError = {
  code: "NETWORK_ERROR",
  message: "Không thể kết nối tới máy chủ. Vui lòng thử lại sau.",
  status: 0,
};

const STATUS_MESSAGES: Record<number, string> = {
  400: "Yêu cầu không hợp lệ.",
  401: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  403: "Bạn không có quyền thực hiện thao tác này.",
  404: "Không tìm thấy dữ liệu yêu cầu.",
  408: "Yêu cầu mất quá nhiều thời gian.",
  422: "Dữ liệu nhập vào không hợp lệ.",
  429: "Thao tác quá nhanh. Vui lòng thử lại sau giây lát.",
  500: "Máy chủ hệ thống gặp sự cố. Vui lòng thử lại sau.",
  502: "Không thể kết nối tới gateway.",
  503: "Dịch vụ tạm thời bảo trì.",
  504: "Cổng kết nối phản hồi quá lâu.",
};

const isAbortError = (error: unknown) =>
  error instanceof Error && error.name === "AbortError";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getMessage = (payload: unknown, fallback: string): string => {
  if (!isRecord(payload)) return fallback;
  return typeof payload.message === "string" && payload.message.trim()
    ? payload.message
    : fallback;
};

const getCode = (payload: unknown, fallback: string): string => {
  if (!isRecord(payload)) return fallback;
  return typeof payload.code === "string" && payload.code.trim()
    ? payload.code
    : fallback;
};

const toMessageArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return typeof value === "string" ? [value] : [];
};

const getFieldErrors = (payload: unknown): ApiFieldErrors | undefined => {
  if (!isRecord(payload) || !payload.errors) return undefined;

  if (Array.isArray(payload.errors)) {
    const fieldErrors = payload.errors.reduce<ApiFieldErrors>((acc, item) => {
      if (!isRecord(item)) return acc;
      const field = item.field || item.path || item.name || item.code;
      const message = item.message;
      if (typeof field === "string" && typeof message === "string") {
        acc[field] = [...(acc[field] || []), message];
      }
      return acc;
    }, {});
    return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
  }

  if (isRecord(payload.errors)) {
    const fieldErrors = Object.entries(payload.errors).reduce<ApiFieldErrors>(
      (acc, [field, value]) => {
        const messages = toMessageArray(value);
        if (messages.length > 0) {
          acc[field] = messages;
        }
        return acc;
      },
      {},
    );
    return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
  }

  return undefined;
};

const toNetworkError = (error: unknown): ApiResult<never> => {
  if (isAbortError(error)) {
    return {
      error: {
        code: "REQUEST_TIMEOUT",
        message: "Yêu cầu phản hồi quá lâu. Vui lòng thử lại sau.",
        status: 0,
      },
      status: 0,
      type: "network-error",
    };
  }

  return {
    error:
      error instanceof Error
        ? {
            ...NETWORK_ERROR,
            details: error,
            message: error.message || NETWORK_ERROR.message,
          }
        : NETWORK_ERROR,
    status: 0,
    type: "network-error",
  };
};

const toDecodeError = <T>(response: ApiClientResponse<T>): ApiResult<never> => ({
  error: {
    code: "RESPONSE_DECODE_ERROR",
    details: response.parseError,
    message: "Dữ liệu trả về từ máy chủ không đúng định dạng JSON.",
    status: response.status,
  },
  headers: response.headers,
  rawBody: response.rawBody,
  status: response.status,
  type: "decode-error",
  url: response.url,
});

const toHttpError = <T>(response: ApiClientResponse<T>): ApiResult<never> => {
  const fallbackMessage =
    STATUS_MESSAGES[response.status] ||
    response.statusText ||
    "Hệ thống phát sinh lỗi.";

  const error: ApiError = {
    code: getCode(response.data, `HTTP_${response.status}`),
    details: response.data,
    fieldErrors: getFieldErrors(response.data),
    message: getMessage(response.data, fallbackMessage),
    status: response.status,
  };

  if (response.status === 422) {
    return {
      data: response.data,
      error,
      headers: response.headers,
      status: 422,
      type: "validation-error",
      url: response.url,
    };
  }

  return {
    data: response.data,
    error,
    headers: response.headers,
    status: response.status,
    type: "http-error",
    url: response.url,
  };
};

const toContractError = <T>(
  response: ApiClientResponse<T>,
  message: string,
): ApiResult<never> => ({
  data: response.data,
  error: {
    code: "RESPONSE_CONTRACT_ERROR",
    details: response.data,
    message,
    status: response.status,
  },
  headers: response.headers,
  status: response.status,
  type: "contract-error",
  url: response.url,
});

export const withApiResult = async <T>(
  request: () => Promise<ApiClientResponse<unknown>>,
  options: ApiResultOptions<T> = {},
): Promise<ApiResult<T>> => {
  try {
    const response = await request();

    if (response.parseError) {
      return toDecodeError(response);
    }

    if (!response.ok) {
      return toHttpError(response);
    }

    if (options.validate && !options.validate(response.data)) {
      return toContractError(
        response,
        options.validationMessage || "Cấu trúc dữ liệu API trả về không khớp contract dự kiến.",
      );
    }

    return {
      data: response.data as T,
      error: null,
      headers: response.headers,
      status: response.status,
      type: "success",
      url: response.url,
    };
  } catch (error) {
    return toNetworkError(error);
  }
};

export const isApiSuccess = <T>(
  result: ApiResult<T>,
): result is Extract<ApiResult<T>, { type: "success" }> =>
  result.type === "success";

export const isApiFormError = <T>(
  result: ApiResult<T>,
): result is Extract<ApiResult<T>, { type: "validation-error" }> =>
  result.type === "validation-error";
