/** Human-readable message from deploy API zod flatten payload. */
export function formatDeployValidationError(data: {
  details?: {
    fieldErrors?: Record<string, string[] | undefined>;
    formErrors?: string[];
  };
  message?: string;
}): string | undefined {
  if (data.message) return data.message;
  const form = data.details?.formErrors?.filter(Boolean);
  if (form?.length) return form.join(" · ");
  const field = data.details?.fieldErrors;
  if (!field) return undefined;
  const parts = Object.entries(field).flatMap(([key, msgs]) =>
    (msgs ?? []).map((m) => `${key}: ${m}`)
  );
  return parts.length ? parts.join(" · ") : undefined;
}
