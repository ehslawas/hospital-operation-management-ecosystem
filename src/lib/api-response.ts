import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    errors?: any;
  };
  timestamp: string;
}

export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    } as ApiSuccessResponse<T>,
    { status }
  );
}

export function errorResponse(
  message: string,
  status: number = 400,
  errors?: any,
  code?: string
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        errors,
      },
      timestamp: new Date().toISOString(),
    } as ApiErrorResponse,
    { status }
  );
}

export function notFoundResponse(entity: string = 'Resource') {
  return errorResponse(`${entity} not found`, 404, undefined, 'NOT_FOUND');
}

export function badRequestResponse(message: string, errors?: any) {
  return errorResponse(message, 400, errors, 'BAD_REQUEST');
}

export function unauthorizedResponse(message: string = 'Unauthorized') {
  return errorResponse(message, 401, undefined, 'UNAUTHORIZED');
}

export function forbiddenResponse(message: string = 'Forbidden') {
  return errorResponse(message, 403, undefined, 'FORBIDDEN');
}

export function serverErrorResponse(message: string = 'Internal server error') {
  return errorResponse(message, 500, undefined, 'INTERNAL_ERROR');
}

