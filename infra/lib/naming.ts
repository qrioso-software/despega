const PROJECT_PREFIX = 'despega';

export function resourceName(stage: string, ...parts: string[]): string {
  return [PROJECT_PREFIX, normalize(stage), ...parts.map(normalize)]
    .map((part) => part.replaceAll('-', '_'))
    .join('_');
}

export function logicalId(stage: string, ...parts: string[]): string {
  return `${toPascal(PROJECT_PREFIX)}${[stage, ...parts].map(toPascal).join('')}`;
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function toPascal(value: string): string {
  return normalize(value)
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}
