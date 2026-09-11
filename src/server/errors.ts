export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (msg = "Recurso no encontrado") => new HttpError(404, msg);
export const badRequest = (msg = "Solicitud inválida", details?: unknown) => new HttpError(400, msg, details);
export const unauthorized = (msg = "Debes iniciar sesión") => new HttpError(401, msg);
export const forbidden = (msg = "No tienes permisos para esta acción") => new HttpError(403, msg);
export const conflict = (msg = "Conflicto") => new HttpError(409, msg);
