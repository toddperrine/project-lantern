import "server-only";

import { createHash, createHmac } from "node:crypto";
import type { SavedProject } from "./project-persistence";

export type CloudProjectSummary = Pick<SavedProject, "id" | "name" | "createdAt" | "updatedAt">;

type DynamoDbItem = Record<string, DynamoDbAttributeValue>;
type DynamoDbAttributeValue =
  | { S: string }
  | { N: string }
  | { BOOL: boolean }
  | { NULL: true }
  | { M: DynamoDbItem }
  | { L: DynamoDbAttributeValue[] };

type CloudProjectRecord = {
  ownerId: string;
  projectId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  project: SavedProject;
};

type DynamoDbConfig = {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  tableName: string;
  ownerId: string;
};

export class CloudProjectConfigError extends Error {
  missingVariables: string[];

  constructor(missingVariables: string[]) {
    super(`Missing required AWS project persistence environment variables: ${missingVariables.join(", ")}`);
    this.name = "CloudProjectConfigError";
    this.missingVariables = missingVariables;
  }
}

export async function listCloudProjects(): Promise<CloudProjectSummary[]> {
  const config = getDynamoDbConfig();
  const response = await dynamoDbRequest<{ Items?: DynamoDbItem[] }>(config, "Query", {
    TableName: config.tableName,
    KeyConditionExpression: "ownerId = :ownerId",
    ExpressionAttributeValues: {
      ":ownerId": { S: config.ownerId }
    },
    ProjectionExpression: "projectId, #name, createdAt, updatedAt",
    ExpressionAttributeNames: {
      "#name": "name"
    }
  });

  return (response.Items ?? [])
    .map(itemToCloudProjectSummary)
    .filter((project): project is CloudProjectSummary => Boolean(project))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getCloudProject(projectId: string): Promise<SavedProject | null> {
  const config = getDynamoDbConfig();
  const response = await dynamoDbRequest<{ Item?: DynamoDbItem }>(config, "GetItem", {
    TableName: config.tableName,
    Key: projectKey(config, projectId)
  });

  if (!response.Item) return null;
  return itemToCloudProjectRecord(response.Item)?.project ?? null;
}

export async function saveCloudProject(project: SavedProject): Promise<SavedProject> {
  const config = getDynamoDbConfig();
  const record: CloudProjectRecord = {
    ownerId: config.ownerId,
    projectId: project.id,
    name: project.name,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    project
  };

  await dynamoDbRequest(config, "PutItem", {
    TableName: config.tableName,
    Item: toDynamoDbItem(record)
  });

  return project;
}

export async function deleteCloudProject(projectId: string): Promise<void> {
  const config = getDynamoDbConfig();
  await dynamoDbRequest(config, "DeleteItem", {
    TableName: config.tableName,
    Key: projectKey(config, projectId)
  });
}

export function getCloudProjectConfigError(): CloudProjectConfigError | null {
  const missingVariables = getMissingDynamoDbVariables();
  return missingVariables.length ? new CloudProjectConfigError(missingVariables) : null;
}

function getDynamoDbConfig(): DynamoDbConfig {
  const missingVariables = getMissingDynamoDbVariables();
  if (missingVariables.length) throw new CloudProjectConfigError(missingVariables);

  return {
    region: process.env.AWS_REGION!,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    tableName: process.env.PROJECTS_TABLE_NAME!,
    ownerId: process.env.PROJECTS_OWNER_ID!
  };
}

function getMissingDynamoDbVariables(): string[] {
  return ["AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "PROJECTS_TABLE_NAME", "PROJECTS_OWNER_ID"].filter(
    (key) => !process.env[key]?.trim()
  );
}

function projectKey(config: DynamoDbConfig, projectId: string): DynamoDbItem {
  return {
    ownerId: { S: config.ownerId },
    projectId: { S: projectId }
  };
}

async function dynamoDbRequest<T = unknown>(config: DynamoDbConfig, action: string, payload: unknown): Promise<T> {
  const host = `dynamodb.${config.region}.amazonaws.com`;
  const endpoint = `https://${host}/`;
  const body = JSON.stringify(payload);
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const target = `DynamoDB_20120810.${action}`;
  const payloadHash = sha256Hex(body);
  const headers: Record<string, string> = {
    "content-type": "application/x-amz-json-1.0",
    host,
    "x-amz-date": amzDate,
    "x-amz-target": target
  };
  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((key) => `${key}:${headers[key]}\n`)
    .join("");
  const credentialScope = `${dateStamp}/${config.region}/dynamodb/aws4_request`;
  const canonicalRequest = ["POST", "/", "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256Hex(canonicalRequest)].join("\n");
  const signature = hmacHex(getSigningKey(config.secretAccessKey, dateStamp, config.region), stringToSign);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      ...headers,
      authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
    },
    body,
    cache: "no-store"
  });

  const responseText = await response.text();
  const parsed = responseText ? JSON.parse(responseText) : {};

  if (!response.ok) {
    const message = typeof parsed?.message === "string" ? parsed.message : `DynamoDB ${action} request failed.`;
    throw new Error(message);
  }

  return parsed as T;
}

function itemToCloudProjectSummary(item: DynamoDbItem): CloudProjectSummary | null {
  const projectId = stringAttribute(item.projectId);
  const name = stringAttribute(item.name);
  const createdAt = stringAttribute(item.createdAt);
  const updatedAt = stringAttribute(item.updatedAt);
  if (!projectId || !name || !createdAt || !updatedAt) return null;
  return { id: projectId, name, createdAt, updatedAt };
}

function itemToCloudProjectRecord(item: DynamoDbItem): CloudProjectRecord | null {
  const value = fromDynamoDbAttribute({ M: item }) as Partial<CloudProjectRecord>;
  if (!value || typeof value !== "object" || !value.project) return null;
  return value as CloudProjectRecord;
}

function stringAttribute(attribute: DynamoDbAttributeValue | undefined): string | null {
  return attribute && "S" in attribute ? attribute.S : null;
}

function toDynamoDbItem(value: Record<string, unknown>): DynamoDbItem {
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, toDynamoDbAttribute(entry)]));
}

function toDynamoDbAttribute(value: unknown): DynamoDbAttributeValue {
  if (value === null || value === undefined) return { NULL: true };
  if (typeof value === "string") return { S: value };
  if (typeof value === "number") return { N: String(value) };
  if (typeof value === "boolean") return { BOOL: value };
  if (Array.isArray(value)) return { L: value.map(toDynamoDbAttribute) };
  if (typeof value === "object") return { M: toDynamoDbItem(value as Record<string, unknown>) };
  return { S: String(value) };
}

function fromDynamoDbAttribute(attribute: DynamoDbAttributeValue): unknown {
  if ("S" in attribute) return attribute.S;
  if ("N" in attribute) return Number(attribute.N);
  if ("BOOL" in attribute) return attribute.BOOL;
  if ("NULL" in attribute) return null;
  if ("L" in attribute) return attribute.L.map(fromDynamoDbAttribute);
  return Object.fromEntries(Object.entries(attribute.M).map(([key, value]) => [key, fromDynamoDbAttribute(value)]));
}

function toAmzDate(date: Date): string {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function hmac(key: Buffer | string, value: string): Buffer {
  return createHmac("sha256", key).update(value, "utf8").digest();
}

function hmacHex(key: Buffer, value: string): string {
  return createHmac("sha256", key).update(value, "utf8").digest("hex");
}

function getSigningKey(secretAccessKey: string, dateStamp: string, region: string): Buffer {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const regionKey = hmac(dateKey, region);
  const serviceKey = hmac(regionKey, "dynamodb");
  return hmac(serviceKey, "aws4_request");
}
