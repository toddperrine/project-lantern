import "server-only";

import { createHash, createHmac } from "node:crypto";
import { normalizeReaderProfile, type ReaderProfile } from "./reader-profile";

type DynamoDbItem = Record<string, DynamoDbAttributeValue>;
type DynamoDbAttributeValue =
  | { S: string }
  | { N: string }
  | { BOOL: boolean }
  | { NULL: true }
  | { M: DynamoDbItem }
  | { L: DynamoDbAttributeValue[] };

type CloudReaderProfileRecord = {
  ownerId: string;
  projectId: string;
  entityType: "readerProfile";
  schemaVersion: 1;
  profileId: string;
  createdAt: string;
  updatedAt: string;
  profile: ReaderProfile;
};

type DynamoDbConfig = {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  tableName: string;
  ownerId: string;
};

export class CloudReaderProfileConfigError extends Error {
  missingVariables: string[];

  constructor(missingVariables: string[]) {
    super(`Missing required AWS reader profile persistence environment variables: ${missingVariables.join(", ")}`);
    this.name = "CloudReaderProfileConfigError";
    this.missingVariables = missingVariables;
  }
}

export class CloudReaderProfilePersistenceError extends Error {
  constructor(message = "DynamoDB reader profile request failed.") {
    super(message);
    this.name = "CloudReaderProfilePersistenceError";
  }
}

export async function getCloudReaderProfile(profileId: string): Promise<ReaderProfile | null> {
  const config = getDynamoDbConfig();
  const response = await dynamoDbRequest<{ Item?: DynamoDbItem }>(config, "GetItem", {
    TableName: config.tableName,
    Key: readerProfileKey(config, profileId)
  });

  if (!response.Item) return null;
  return itemToCloudReaderProfileRecord(response.Item)?.profile ?? null;
}

export async function saveCloudReaderProfile(profileId: string, profile: ReaderProfile): Promise<ReaderProfile> {
  const config = getDynamoDbConfig();
  const normalizedProfile = normalizeReaderProfile(profile);
  const now = new Date().toISOString();
  const record: CloudReaderProfileRecord = {
    ownerId: config.ownerId,
    projectId: readerProfileProjectId(profileId),
    entityType: "readerProfile",
    schemaVersion: 1,
    profileId,
    createdAt: normalizedProfile.createdAt || now,
    updatedAt: normalizedProfile.updatedAt || now,
    profile: normalizedProfile
  };

  await dynamoDbRequest(config, "PutItem", {
    TableName: config.tableName,
    Item: toDynamoDbItem(record)
  });

  return normalizedProfile;
}

export async function deleteCloudReaderProfile(profileId: string): Promise<void> {
  const config = getDynamoDbConfig();
  await dynamoDbRequest(config, "DeleteItem", {
    TableName: config.tableName,
    Key: readerProfileKey(config, profileId)
  });
}

export function getCloudReaderProfileConfigError(): Error | null {
  const missingVariables = getMissingDynamoDbVariables();
  return missingVariables.length ? new CloudReaderProfileConfigError(missingVariables) : null;
}

function getDynamoDbConfig(): DynamoDbConfig {
  const missingVariables = getMissingDynamoDbVariables();
  if (missingVariables.length) throw new CloudReaderProfileConfigError(missingVariables);

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

function readerProfileProjectId(profileId: string): string {
  return `reader-profile#${profileId}`;
}

function readerProfileKey(config: DynamoDbConfig, profileId: string): DynamoDbItem {
  return {
    ownerId: { S: config.ownerId },
    projectId: { S: readerProfileProjectId(profileId) }
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
  const headers: Record<string, string> = { "content-type": "application/x-amz-json-1.0", host, "x-amz-date": amzDate, "x-amz-target": target };
  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.keys(headers).sort().map((key) => `${key}:${headers[key]}\n`).join("");
  const credentialScope = `${dateStamp}/${config.region}/dynamodb/aws4_request`;
  const canonicalRequest = ["POST", "/", "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256Hex(canonicalRequest)].join("\n");
  const signature = hmacHex(getSigningKey(config.secretAccessKey, dateStamp, config.region), stringToSign);

  const response = await fetch(endpoint, { method: "POST", headers: { ...headers, authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}` }, body, cache: "no-store" });
  const responseText = await response.text();
  const parsed = parseJsonResponse(responseText);

  if (!response.ok) throw new CloudReaderProfilePersistenceError(getAwsErrorMessage(parsed) ?? `DynamoDB ${action} reader profile request failed.`);
  return parsed as T;
}

function itemToCloudReaderProfileRecord(item: DynamoDbItem): CloudReaderProfileRecord | null {
  const value = fromDynamoDbAttribute({ M: item }) as Partial<CloudReaderProfileRecord>;
  if (!value || typeof value !== "object" || value.entityType !== "readerProfile" || value.schemaVersion !== 1 || typeof value.profileId !== "string" || !value.profile) return null;
  return { ...value, profile: normalizeReaderProfile(value.profile) } as CloudReaderProfileRecord;
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
  try { return JSON.parse(responseText); } catch { return {}; }
}

function getAwsErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const message = (payload as Record<string, unknown>).message ?? (payload as Record<string, unknown>).Message;
  return typeof message === "string" && message.trim() ? message : null;
}

function toAmzDate(date: Date): string { return date.toISOString().replace(/[:-]|\.\d{3}/g, ""); }
function sha256Hex(value: string): string { return createHash("sha256").update(value, "utf8").digest("hex"); }
function hmac(key: Buffer | string, value: string): Buffer { return createHmac("sha256", key).update(value, "utf8").digest(); }
function hmacHex(key: Buffer, value: string): string { return createHmac("sha256", key).update(value, "utf8").digest("hex"); }
function getSigningKey(secretAccessKey: string, dateStamp: string, region: string): Buffer {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const regionKey = hmac(dateKey, region);
  const serviceKey = hmac(regionKey, "dynamodb");
  return hmac(serviceKey, "aws4_request");
}
