import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import type { ZodObject, ZodLiteral } from 'zod';
import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
} from '@asteasolutions/zod-to-openapi';
import { waivioOperationSchema } from '../src/domain/hive-parser/schemas';

interface SchemaProperty {
  type?: string;
  description?: string;
  enum?: string[];
}

interface SchemaObject {
  type?: string;
  description?: string;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
  oneOf?: SchemaObject[];
  discriminator?: { propertyName: string };
}

interface ComponentsSpec {
  components?: {
    schemas?: Record<string, SchemaObject>;
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const registry = new OpenAPIRegistry();

for (const option of waivioOperationSchema.options) {
  const shape = (option as ZodObject<any>).shape;
  const method = (shape.method as ZodLiteral<string>).value;
  registry.register(capitalize(method), option as any);
}

const generator = new OpenApiGeneratorV31(registry.definitions);
const spec = generator.generateComponents() as ComponentsSpec;
const schemas = spec.components?.schemas ?? {};

function renderSchema(name: string, schema: SchemaObject): string {
  const lines: string[] = [];
  const description = schema.description ?? '';

  lines.push(`### ${name}`);
  if (description) lines.push(`\n${description}`);

  const params = schema.properties?.params as SchemaObject | undefined;
  const method = schema.properties?.method as SchemaProperty | undefined;

  if (method?.enum?.[0]) {
    lines.push(`\n**method**: \`${method.enum[0]}\``);
  }

  if (params?.properties) {
    lines.push('\n**params**:\n');
    lines.push('| Field | Type | Required | Description |');
    lines.push('|-------|------|----------|-------------|');

    const required = new Set(params.required ?? []);
    for (const [field, prop] of Object.entries(params.properties)) {
      const type = prop.type ?? 'string';
      const req = required.has(field) ? 'yes' : 'no';
      const desc = prop.description ?? '';
      lines.push(`| \`${field}\` | ${type} | ${req} | ${desc} |`);
    }
  }

  return lines.join('\n');
}

const sections = Object.entries(schemas).map(([name, schema]) =>
  renderSchema(name, schema),
);

const markdown = `# Waivio Custom JSON Operations

> Auto-generated from Zod schemas. Do not edit manually.
>
> custom_json id: \`waivio_operations\`

## Operations

${sections.join('\n\n---\n\n')}
`;

const outPath = resolve(__dirname, '..', 'docs', 'custom-json-operations.md');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, markdown, 'utf-8');

console.log(`Docs generated: ${outPath}`);
