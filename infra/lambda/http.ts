import type { APIGatewayProxyEvent, APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';

export type JwtEvent = APIGatewayProxyEventV2WithJWTAuthorizer;
export type AuthorizedEvent = JwtEvent | APIGatewayProxyEvent;
export const json = (statusCode: number, body: unknown) => ({ statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
export const caller = (event: AuthorizedEvent) => {
  const authorizer = event.requestContext.authorizer;
  const sub = authorizer && ('jwt' in authorizer ? authorizer.jwt?.claims?.sub : 'claims' in authorizer ? authorizer.claims?.sub : undefined);
  return typeof sub === 'string' && sub ? sub : undefined;
};
