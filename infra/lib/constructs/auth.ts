import { CfnOutput, Duration, RemovalPolicy, aws_cognito as cognito } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { logicalId, resourceName } from '../naming';

export interface AuthProps {
  stage: string;
  removalPolicy: RemovalPolicy;
  production: boolean;
}

export const STAFF_GROUPS = [
  ['despega/admin', 'Administración completa del backoffice', 0],
  ['despega/counselor', 'Orientación: consulta de estudiantes y resultados', 10],
] as const;

/**
 * Dos pools separados: estudiantes (registro propio) y staff (cuentas creadas por un
 * administrador). Un estudiante nunca puede obtener acceso al backoffice por un grupo
 * mal asignado, porque su token ni siquiera es emitido por el pool del staff.
 */
export class Auth extends Construct {
  readonly studentPool: cognito.UserPool;
  readonly webClient: cognito.UserPoolClient;
  readonly staffPool: cognito.UserPool;
  readonly adminClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: AuthProps) {
    super(scope, id);

    this.studentPool = new cognito.UserPool(this, logicalId(props.stage, 'students'), {
      userPoolName: resourceName(props.stage, 'students'),
      removalPolicy: props.removalPolicy,
      deletionProtection: props.production,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      signInCaseSensitive: false,
      autoVerify: { email: true },
      keepOriginal: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        givenName: { required: true, mutable: true },
        familyName: { required: false, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: false,
        requireDigits: true,
        requireSymbols: false,
        tempPasswordValidity: Duration.days(7),
      },
      userVerification: {
        emailSubject: 'Tu código para entrar a DESPEGA',
        emailBody: 'Tu código de verificación de DESPEGA es {####}. Vence en 24 horas.',
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
    });

    const studentRead = new cognito.ClientAttributes()
      .withStandardAttributes({ email: true, emailVerified: true, givenName: true, familyName: true });
    const studentWrite = new cognito.ClientAttributes()
      .withStandardAttributes({ email: true, givenName: true, familyName: true });
    this.webClient = this.studentPool.addClient(logicalId(props.stage, 'web-client'), {
      userPoolClientName: resourceName(props.stage, 'web-client'),
      disableOAuth: true,
      // La web autentica del lado del servidor: contraseñas y tokens no pasan por el navegador.
      authFlows: { userSrp: true, userPassword: true },
      preventUserExistenceErrors: true,
      enableTokenRevocation: true,
      accessTokenValidity: Duration.hours(1),
      idTokenValidity: Duration.hours(1),
      refreshTokenValidity: Duration.days(30),
      readAttributes: studentRead,
      writeAttributes: studentWrite,
    });

    this.staffPool = new cognito.UserPool(this, logicalId(props.stage, 'staff'), {
      userPoolName: resourceName(props.stage, 'staff'),
      removalPolicy: props.removalPolicy,
      deletionProtection: props.production,
      selfSignUpEnabled: false,
      signInAliases: { email: true },
      signInCaseSensitive: false,
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        givenName: { required: false, mutable: true },
        familyName: { required: false, mutable: true },
      },
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
        tempPasswordValidity: Duration.days(7),
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
    });

    const staffAttributes = new cognito.ClientAttributes()
      .withStandardAttributes({ email: true, givenName: true, familyName: true });
    this.adminClient = this.staffPool.addClient(logicalId(props.stage, 'admin-client'), {
      userPoolClientName: resourceName(props.stage, 'admin-client'),
      disableOAuth: true,
      authFlows: { userSrp: true, userPassword: true },
      preventUserExistenceErrors: true,
      enableTokenRevocation: true,
      accessTokenValidity: Duration.hours(1),
      idTokenValidity: Duration.hours(1),
      refreshTokenValidity: Duration.days(7),
      readAttributes: staffAttributes,
      writeAttributes: staffAttributes,
    });

    for (const [name, description, precedence] of STAFF_GROUPS) {
      new cognito.CfnUserPoolGroup(this, logicalId(props.stage, 'group', name), {
        userPoolId: this.staffPool.userPoolId,
        groupName: name,
        description,
        precedence,
      });
    }

    new CfnOutput(this, logicalId(props.stage, 'student-pool-id'), { value: this.studentPool.userPoolId });
    new CfnOutput(this, logicalId(props.stage, 'web-client-id'), { value: this.webClient.userPoolClientId });
    new CfnOutput(this, logicalId(props.stage, 'staff-pool-id'), { value: this.staffPool.userPoolId });
    new CfnOutput(this, logicalId(props.stage, 'admin-client-id'), { value: this.adminClient.userPoolClientId });
  }
}
