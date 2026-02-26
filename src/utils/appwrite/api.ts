// Appwrite API wrapper — calls the "demons-api" Appwrite Function
// and returns a response object similar to fetch() for easy migration.

import { Client, Functions, ExecutionMethod } from 'appwrite';
import { endpoint, projectId, functionId } from './config';

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId);

const functions = new Functions(client);

/**
 * Call the Appwrite Function with a given path and options.
 * Mirrors the fetch() interface so the rest of the app stays simple.
 */
export async function apiCall(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<{ ok: boolean; data: unknown; status: number }> {
  const method = (options.method || 'GET') as ExecutionMethod;
  const body = options.body ? JSON.stringify(options.body) : undefined;

  const execution = await functions.createExecution(
    functionId,
    body,
    false, // synchronous execution
    path,
    method,
    { 'content-type': 'application/json' },
  );

  // If the function itself crashed (e.g. missing env vars), the status may
  // be 'failed' and the responseBody empty.  Surface a clear error.
  if (execution.status === 'failed') {
    return {
      ok: false,
      data: { error: 'Function execution failed. Check Appwrite console for details.' },
      status: execution.responseStatusCode || 500,
    };
  }

  const ok =
    execution.responseStatusCode >= 200 && execution.responseStatusCode < 300;

  let data: unknown = null;
  if (execution.responseBody) {
    try {
      data = JSON.parse(execution.responseBody);
    } catch {
      data = execution.responseBody;
    }
  }

  return { ok, data, status: execution.responseStatusCode };
}
