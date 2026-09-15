/** Creates a bounded error message from an unsuccessful HTTP response. */
export async function createResponseError(
  response: Response,
  action: string,
): Promise<Error> {
  const body = (await response.text()).slice(0, 2_048).trim();
  return new Error(
    `Failed to ${action}: HTTP ${response.status}${body ? ` - ${body}` : ''}`,
  );
}
