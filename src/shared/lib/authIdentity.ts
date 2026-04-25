export interface AuthIdentityHint {
  name?: string;
  email?: string;
}

export const readAuthIdentityHint = (): AuthIdentityHint => ({});

export const writeAuthIdentityHint = (_hint: AuthIdentityHint) => {
  void _hint;
};

export const writeRegisterDraftHint = (_hint: AuthIdentityHint) => {
  void _hint;
};

export const clearRegisterDraftHint = () => undefined;
