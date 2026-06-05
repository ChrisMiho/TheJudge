import { describe, expect, it } from "vitest";
import {
  AppError,
  classifyProviderError,
  createProviderTimeoutError,
  createProviderUnavailableError,
  createUnexpectedError,
  createValidationError
} from "./errors.js";

describe("errors", () => {
  it("creates validation errors with 400 status", () => {
    const error = createValidationError("Invalid request payload: question too long");
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.status).toBe(400);
  });

  it("creates provider unavailable errors with retry metadata", () => {
    const error = createProviderUnavailableError();
    expect(error.code).toBe("PROVIDER_UNAVAILABLE");
    expect(error.status).toBe(503);
    expect(error.retryAfterSeconds).toBe(13);
  });

  it("creates provider timeout errors", () => {
    const error = createProviderTimeoutError();
    expect(error.code).toBe("PROVIDER_TIMEOUT");
    expect(error.status).toBe(504);
  });

  it("classifies timeout messages as provider timeout", () => {
    const error = classifyProviderError(new Error("request timeout exceeded"));
    expect(error.code).toBe("PROVIDER_TIMEOUT");
  });

  it("classifies generic errors as provider unavailable", () => {
    const error = classifyProviderError(new Error("network down"));
    expect(error.code).toBe("PROVIDER_UNAVAILABLE");
    expect(error.details).toContain("network down");
  });

  it("passes through existing AppError instances", () => {
    const original = createUnexpectedError("Miho is working on it", "boom");
    expect(classifyProviderError(original)).toBe(original);
  });
});
