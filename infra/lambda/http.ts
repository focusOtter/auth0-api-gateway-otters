import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';

export type JwtEvent = APIGatewayProxyEventV2WithJWTAuthorizer;
export const json = (statusCode: number, body: unknown) => ({ statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
export const caller = (event: JwtEvent) => event.requestContext.authorizer?.jwt?.claims?.sub;
