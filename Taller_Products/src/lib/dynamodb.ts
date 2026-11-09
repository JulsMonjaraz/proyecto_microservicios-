import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { awsClientConfig } from "./awsConfig";

const client = new DynamoDBClient(awsClientConfig());

export const dynamo = DynamoDBDocumentClient.from(client);
