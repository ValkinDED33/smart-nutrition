import {
  buildClientErrorReportPayload,
  type ClientErrorReportSource,
  type ErrorRecoveryDiagnostic,
} from "../lib/errorRecovery";
import { getClientErrorRuntimeContext } from "../lib/clientErrorRuntimeContext";
import { requestRemote } from "./authRemote";

const CLIENT_ERROR_REPORT_TIMEOUT_MS = 3_500;

export const reportClientErrorDiagnostic = async (
  diagnostic: ErrorRecoveryDiagnostic,
  componentStack?: string | null,
  {
    source = "react-error-boundary",
  }: {
    source?: ClientErrorReportSource;
  } = {}
) => {
  await requestRemote<void>(
    "/client-errors",
    {
      method: "POST",
      body: JSON.stringify(
        buildClientErrorReportPayload(
          diagnostic,
          componentStack,
          source,
          getClientErrorRuntimeContext()
        )
      ),
    },
    {
      allowRefresh: false,
      requireAuth: false,
      timeoutMs: CLIENT_ERROR_REPORT_TIMEOUT_MS,
    }
  );
};
