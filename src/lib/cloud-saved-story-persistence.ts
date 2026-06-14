import "server-only";

import { createHash, createHmac, randomUUID } from "node:crypto";
import { getCloudProject } from "./cloud-project-persistence";

export type CloudSavedStoryRole = "origin" | "continuation" | "branch" | "revision" | "memoir-chapter";

export type CloudSavedStoryRecord = {
  ownerId: string;
  projectId: string;
  storyId: string;
  title: string;
  story: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  sequenceNumber: number;
  sequenceLabel: string;
  storyRole: CloudSavedStoryRole;
  continuationOfStoryId?: string;
};

export type CloudSavedStoryInput = {
  storyId?: string;
  title: string;
  story: string;
  metadata?: Record<string, unknown>;
  sequenceNumber?: number;
  sequenceLabel?: string;
  storyRole?: CloudSavedStoryRole;
  continuationOfStoryId?: string;
};

export type CloudSavedStoryErrorDetails = {
  operation: string;
  awsErrorName: string | null;
  awsErrorMessage: string;
  httpStatusCode: number | null;
};

type DynamoDbItem = Record<string, DynamoDbAttributeValue>;
type DynamoDbAttributeValue =
  | { S: string }
  | { N: string }
  | { BOOL: boolean }
  | { NULL: true }
  | { M: DynamoDbItem }
  | { L: DynamoDbAttributeValue[] };

type DynamoDbConfig = {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  tableName: string;
  ownerId: string;
};

type CloudSavedStoryItem = Omit<CloudSavedStoryRecord, "projectId"> & {
  projectId: string;
  cloudProjectId: string;
  itemType: "saved-story";
};

export class CloudSavedStoryConfigError extends Error {
  missingVariables: string[];

  constructor(missingVariables: string[]) {
    super(`Missing required AWS saved story persistence environment variables: ${missingVariables.join(", ")}`);
    this.name = "CloudSavedStoryConfigError";
    this.missingVariables = missingVariables;
  }
}

export class CloudSavedStoryPersistenceError extends Error {
  details: CloudSavedStoryErrorDetails;

  constructor(details: CloudSavedStoryErrorDetails) {
    super(details.awsErrorMessage || `DynamoDB ${details.operation} request failed.`);
    this.name = "CloudSavedStoryPersistenceError";
    this.details = details;
  }
}

export function getCloudSavedStoryConfigError(): CloudSavedStoryConfigError | null {
  const missingVariables = getMissingDynamoDbVariables();
  return missingVariables.length ? new CloudSavedStoryConfigError(missingVariables) : null;
}

export function isCloudSavedStoryRole(value: unknown): value is CloudSavedStoryRole {
  return value === "origin" || value === "continuation" || value === "branch" || value === "revision" || value === "memoir-chapter";
}

export async function listCloudSavedStories(projectId: string): Promise<CloudSavedStoryRecord[] | null> {
  const projectExists = await getCloudProject(projectId);
  if (!projectExists) return null;

  const config = getDynamoDbConfig();
  const response = await dynamoDbRequest<{ Items?: DynamoDbItem[] }>(config, "Query", {
    TableName: config.tableName,
    KeyConditionExpression: "ownerId = :ownerId AND begins_with(projectId, :storyPrefix)",
    ExpressionAttributeValues: {
      ":ownerId": { S: config.ownerId },
      ":storyPrefix": { S: storySortKeyPrefix(projectId) }
    }
  });

  return (response.Items ?? [])
    .map(itemToCloudSavedStoryRecord)
    .filter((story): story is CloudSavedStoryRecord => Boolean(story))
    .sort(compareStorySequence);
}

export async function getCloudSavedStory(projectId: string, storyId: string): Promise<CloudSavedStoryRecord | null> {
  const config = getDynamoDbConfig();
  const response = await dynamoDbRequest<{ Item?: DynamoDbItem }>(config, "GetItem", {
    TableName: config.tableName,
    Key: storyKey(config, projectId, storyId)
  });

  if (!response.Item) return null;
  return itemToCloudSavedStoryRecord(response.Item);
}

export async function saveCloudSavedStory(projectId: string, input: CloudSavedStoryInput): Promise<CloudSavedStoryRecord | null> {
  const existingStories = await listCloudSavedStories(projectId);
  if (!existingStories) return null;

  const config = getDynamoDbConfig();
  const now = new Date().toISOString();
  const sequenceNumber = normalizeSequenceNumber(input.sequenceNumber) ?? getNextSequenceNumber(existingStories);
  const storyId = input.storyId?.trim() || randomUUID();
  const record: CloudSavedStoryRecord = {
    ownerId: config.ownerId,
    projectId,
    storyId,
    title: input.title.trim(),
    story: input.story,
    metadata: input.metadata ?? {},
    createdAt: now,
    updatedAt: now,
    sequenceNumber,
    sequenceLabel: input.sequenceLabel?.trim() || `Part ${sequenceNumber}`,
    storyRole: input.storyRole ?? (input.continuationOfStoryId ? "continuation" : "origin"),
    ...(input.continuationOfStoryId?.trim() ? { continuationOfStoryId: input.continuationOfStoryId.trim() } : {})
  };

  await dynamoDbRequest(config, "PutItem", {
    TableName: config.tableName,
    Item: toDynamoDbItem(toCloudSavedStoryItem(record))
  });

  return record;
}

export async function deleteCloudSavedStory(projectId: string, storyId: string): Promise<void> {
  const config = getDynamoDbConfig();
  await dynamoDbRequest(config, "DeleteItem", {
    TableName: config.tableName,
    Key: storyKey(config, projectId, storyId)
  });
}

function getDynamoDbConfig(): DynamoDbConfig {
  const missingVariables = getMissingDynamoDbVariables();
  if (missingVariables.length) throw new CloudSavedStoryConfigError(missingVariables);

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

function storyKey(config: DynamoDbConfig, projectId: string, storyId: string): DynamoDbItem {
  return {
    ownerId: { S: config.ownerId },
    projectId: { S: storySortKey(projectId, storyId) }
  };
}

function storySortKeyPrefix(projectId: string): string {
  return `${projectId}#story#`;
}

function storySortKey(projectId: string, storyId: string): string {
  return `${storySortKeyPrefix(projectId)}${storyId}`;
}

function toCloudSavedStoryItem(record: CloudSavedStoryRecord): CloudSavedStoryItem {
  return {
    ...record,
    cloudProjectId: record.projectId,
    projectId: storySortKey(record.projectId, record.storyId),
    itemType: "saved-story"
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
  const parsed = parseJsonResponse(responseText);

  if (!response.ok) {
    throw new CloudSavedStoryPersistenceError({
      operation: action,
      awsErrorName: getAwsErrorName(parsed, response.headers.get("x-amzn-errortype")),
      awsErrorMessage: getAwsErrorMessage(parsed) ?? `DynamoDB ${action} request failed.`,
      httpStatusCode: response.status || null
    });
  }

  return parsed as T;
}

function itemToCloudSavedStoryRecord(item: DynamoDbItem): CloudSavedStoryRecord | null {
  const value = fromDynamoDbAttribute({ M: item }) as Partial<CloudSavedStoryItem>;
  if (!value || typeof value !== "object" || value.itemType !== "saved-story") return null;
  if (!value.ownerId || !value.cloudProjectId || !value.storyId || !value.title || typeof value.story !== "string") return null;
  if (!value.createdAt || !value.updatedAt || typeof value.sequenceNumber !== "number" || !value.sequenceLabel || !isCloudSavedStoryRole(value.storyRole)) return null;

  return {
    ownerId: value.ownerId,
    projectId: value.cloudProjectId,
    storyId: value.storyId,
    title: value.title,
    story: value.story,
    metadata: isRecord(value.metadata) ? value.metadata : {},
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    sequenceNumber: value.sequenceNumber,
    sequenceLabel: value.sequenceLabel,
    storyRole: value.storyRole,
    ...(typeof value.continuationOfStoryId === "string" && value.continuationOfStoryId ? { continuationOfStoryId: value.continuationOfStoryId } : {})
  };
}

function compareStorySequence(a: CloudSavedStoryRecord, b: CloudSavedStoryRecord): number {
  return a.sequenceNumber - b.sequenceNumber || a.createdAt.localeCompare(b.createdAt) || a.storyId.localeCompare(b.storyId);
}

function getNextSequenceNumber(stories: CloudSavedStoryRecord[]): number {
  return stories.reduce((highest, story) => Math.max(highest, story.sequenceNumber), 0) + 1;
}

function normalizeSequenceNumber(value: number | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
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

function parseJsonResponse(responseText: string): unknown {
  if (!responseText) return {};
  try {
    return JSON.parse(responseText);
  } catch {
    return {};
  }
}

function getAwsErrorName(payload: unknown, headerErrorType: string | null): string | null {
  const payloadErrorType = getStringProperty(payload, "__type") ?? getStringProperty(payload, "code");
  const rawErrorName = payloadErrorType ?? headerErrorType;
  if (!rawErrorName) return null;
  return rawErrorName.split("#").pop()?.split(":")[0] ?? rawErrorName;
}

function getAwsErrorMessage(payload: unknown): string | null {
  return getStringProperty(payload, "message") ?? getStringProperty(payload, "Message");
}

function getStringProperty(payload: unknown, key: string): string | null {
  if (!payload || typeof payload !== "object" || !(key in payload)) return null;
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value : null;
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
