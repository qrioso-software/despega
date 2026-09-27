# @despega/auth

- Solo servidor. Sin dependencias de Next.js: las apps manejan cookies y redirecciones.
- Cognito con `USER_PASSWORD_AUTH` del lado del servidor. Contraseñas y tokens nunca
  pasan al navegador ni a DynamoDB.
- Los errores de Cognito se traducen con `toAuthError` sin revelar si una cuenta existe.
- El proveedor local (`local.ts`) solo es válido con `STAGE=local` y host loopback; su
  clave de firma es pública por diseño. No ampliar su alcance.
- Las políticas de contraseña de `password.ts` reflejan las de
  `infra/lib/constructs/auth.ts`; cambiarlas juntas.
- Pruebas: `pnpm --filter @despega/auth test`.
