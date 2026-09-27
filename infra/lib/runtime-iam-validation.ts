import { Stack, aws_iam as iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export const ALLOWED_RUNTIME_DYNAMODB_ACTIONS = new Set([
  'dynamodb:BatchGetItem',
  'dynamodb:ConditionCheckItem',
  'dynamodb:DeleteItem',
  'dynamodb:GetItem',
  'dynamodb:PutItem',
  'dynamodb:Query',
  'dynamodb:UpdateItem',
]);

/**
 * Hace fallar el synth si una política runtime concede `dynamodb:Scan` o una acción
 * DynamoDB desconocida. Las transacciones se autorizan con las acciones de ítem
 * subyacentes; `TransactWriteItems` no es una acción IAM.
 */
export function addRuntimeIamValidation(scope: Construct): void {
  scope.node.addValidation({
    validate: () => {
      const errors: string[] = [];
      for (const node of scope.node.findAll()) {
        if (!(node instanceof iam.CfnPolicy)) continue;
        const document = Stack.of(scope).resolve(node.policyDocument) as {
          Statement?: Array<{ Action?: string | string[] }>;
        };
        for (const statement of document.Statement ?? []) {
          const actions = Array.isArray(statement.Action) ? statement.Action : statement.Action ? [statement.Action] : [];
          for (const action of actions) {
            if (!action.startsWith('dynamodb:')) continue;
            if (action === 'dynamodb:Scan') {
              errors.push(`${node.node.path} cannot grant dynamodb:Scan.`);
            } else if (!ALLOWED_RUNTIME_DYNAMODB_ACTIONS.has(action)) {
              errors.push(`${node.node.path} contains unsupported DynamoDB action ${action}.`);
            }
          }
        }
      }
      return errors;
    },
  });
}
