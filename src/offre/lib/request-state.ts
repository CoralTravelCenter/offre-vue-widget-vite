import type { OffreRequestState } from "offre/types";

export function resolveOffreRequestState(params: {
  enabled: boolean;
  isPending: boolean;
  isError: boolean;
  productsCount: number;
}) {
  if (!params.enabled) {
    return "idle" satisfies OffreRequestState;
  }

  if (params.isPending) {
    return "loading" satisfies OffreRequestState;
  }

  if (params.isError) {
    return "error" satisfies OffreRequestState;
  }

  return params.productsCount > 0
    ? ("success" satisfies OffreRequestState)
    : ("success" satisfies OffreRequestState);
}
