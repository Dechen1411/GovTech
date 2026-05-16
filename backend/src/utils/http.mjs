export const send = (res, status, body, headers = {}) => {
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": typeof body === "string" ? "text/plain; charset=utf-8" : "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    ...headers,
  });
  res.end(payload);
};

export const ok = (res, body = {}) => send(res, 200, body);
export const created = (res, body = {}) => send(res, 201, body);
export const badRequest = (res, message, details) => send(res, 400, { message, details });
export const unauthorized = (res, message = "Authentication required") => send(res, 401, { message });
export const forbidden = (res, message = "Forbidden") => send(res, 403, { message });
export const notFound = (res, message = "Not found") => send(res, 404, { message });

export const parseBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};
