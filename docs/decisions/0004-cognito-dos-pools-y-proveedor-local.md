# ADR 0004: Cognito con dos pools y proveedor de identidad local

- Estado: aceptado
- Fecha: 2026-09-26

## Contexto

Los estudiantes se registran solos en la web. El staff (equipo de DESPEGA y
orientadores) usa el backoffice con roles. Además, el proyecto debe funcionar en local
antes de que existan cuentas AWS.

## Decisión

- **Pool de estudiantes** con registro propio y verificación por correo, y **pool de
  staff** sin registro propio y con grupos `despega/admin` y `despega/counselor`. Un
  estudiante nunca puede obtener acceso al backoffice por un grupo mal asignado: su
  token lo emite otro pool.
- Autenticación del lado del servidor (`USER_PASSWORD_AUTH`) con tokens en cookies
  `httpOnly`; `proxy.ts` renueva la sesión. Web usa `SameSite=Lax`; admin, `Strict`.
- **Proveedor local** (`AUTH_PROVIDER=local`): identifica por correo sin contraseña,
  firma una cookie y solo atiende peticiones a `localhost`. Solo existe con
  `STAGE=local`; CDK y el build de Amplify lo rechazan.

## Alternativas consideradas

- **Un pool con grupos para todos**: más simple, pero un error de grupos expondría el
  backoffice a estudiantes.
- **Emulador de Cognito en Docker**: más fidelidad, pero frágil (JWKS y emisores
  distintos) y lento de configurar.
- **Esperar a tener AWS para probar**: bloqueaba el objetivo de tener el producto
  funcionando.

## Consecuencias

- Los flujos Cognito están implementados pero no se probaron contra un pool real: se
  validan en el primer despliegue a `dev`.
- El modo local permite demostrar y probar todo el producto sin credenciales.
