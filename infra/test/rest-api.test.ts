import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OttersRestApiStack } from '../lib/otters-rest-api-stack';
import { caller } from '../lambda/http';
import { facts, preflight, roster, snacks } from '../lambda/rest';

afterEach(() => vi.unstubAllEnvs());
const event = (origin?: string, sub: unknown = 'auth0|river') => ({
  headers: origin ? { Origin: origin } : {},
  body: '{"snack":"crab"}', pathParameters: { id: 'miso' },
  requestContext: { authorizer: { claims: { sub } } },
}) as unknown as APIGatewayProxyEvent;

describe('REST JWT gateway', () => {
  it('requires configuration and validates the domain', () => {
    vi.stubEnv('AUTH0_DOMAIN', '');
    vi.stubEnv('AUTH0_AUDIENCE', '');
    expect(() => new OttersRestApiStack(new App(), 'Missing')).toThrow('AUTH0_DOMAIN and AUTH0_AUDIENCE are required');
    vi.stubEnv('AUTH0_DOMAIN', 'https://invalid/');
    vi.stubEnv('AUTH0_AUDIENCE', 'https://otters.api');
    expect(() => new OttersRestApiStack(new App(), 'Invalid')).toThrow('AUTH0_DOMAIN must be a hostname');
  });
  it('configures REST JWT methods, public facts and unauthenticated CORS', () => {
    vi.stubEnv('AUTH0_DOMAIN', undefined);
    vi.stubEnv('AUTH0_AUDIENCE', undefined);
    vi.stubEnv('ALLOWED_ORIGINS', 'https://river.example, http://localhost:3000');
    const template = Template.fromStack(new OttersRestApiStack(new App({ context: {
      AUTH0_DOMAIN: 'otters.auth0.com', AUTH0_AUDIENCE: 'https://otters.api',
    } }), 'Rest'));
    template.resourceCountIs('AWS::ApiGateway::Authorizer', 1);
    template.hasResourceProperties('AWS::ApiGateway::Authorizer', {
      Type: 'JWT', IdentitySource: 'method.request.header.Authorization',
      JwtConfiguration: { DefaultAlgorithms: ['RS256'], Issuers: [{ Issuer: 'https://otters.auth0.com/', Audiences: ['https://otters.api'] }] },
    });
    const resources = template.findResources('AWS::ApiGateway::Resource');
    const resourceId = (part: string) => Object.keys(resources).find(id => resources[id].Properties.PathPart === part)!;
    const authorizerId = Object.keys(template.findResources('AWS::ApiGateway::Authorizer'))[0];
    template.hasResourceProperties('AWS::ApiGateway::Method', { ResourceId: { Ref: resourceId('facts') }, HttpMethod: 'GET', AuthorizationType: 'NONE' });
    template.hasResourceProperties('AWS::ApiGateway::Method', { ResourceId: { Ref: resourceId('otters') }, HttpMethod: 'GET', AuthorizationType: 'JWT', AuthorizerId: { Ref: authorizerId } });
    template.hasResourceProperties('AWS::ApiGateway::Method', { ResourceId: { Ref: resourceId('snacks') }, HttpMethod: 'POST', AuthorizationType: 'JWT', AuthorizerId: { Ref: authorizerId }, AuthorizationScopes: ['feed:otters'] });
    const methods = Object.values(template.findResources('AWS::ApiGateway::Method')).map(value => value.Properties);
    expect(methods.filter(value => value.HttpMethod === 'OPTIONS')).toHaveLength(3);
    for (const method of methods.filter(value => value.HttpMethod === 'OPTIONS')) {
      expect(method.AuthorizationType).toBe('NONE');
      expect(method.AuthorizerId).toBeUndefined();
      expect(method.Integration.Type).toBe('AWS_PROXY');
    }
    template.hasResourceProperties('AWS::Lambda::Function', { Handler: 'index.preflight', Environment: { Variables: { ALLOWED_ORIGINS: 'https://river.example,http://localhost:3000' } } });
    expect(template.toJSON().Outputs.ApiUrl).toBeDefined();
  });
});

describe('REST Lambda adapter', () => {
  it('reads REST claims in both shared handlers', async () => {
    expect(JSON.parse((await roster(event())).body).caller).toBe('auth0|river');
    expect(JSON.parse((await snacks(event())).body).caller).toBe('auth0|river');
    expect((await facts(event())).statusCode).toBe(200);
  });
  it.each([null, '', 42, {}, []])('rejects absent or non-string subjects: %j', async sub => {
    expect(caller(event(undefined, sub))).toBeUndefined();
    expect((await roster(event(undefined, sub))).statusCode).toBe(401);
    expect((await snacks(event(undefined, sub))).statusCode).toBe(401);
  });
  it('rejects missing authorizer context', async () => {
    const input = event();
    input.requestContext.authorizer = null;
    expect((await roster(input)).statusCode).toBe(401);
  });
  it('allows only configured preflight origins without requiring a token', async () => {
    vi.stubEnv('ALLOWED_ORIGINS', 'https://river.example, http://localhost:3000');
    for (const origin of ['https://river.example', 'http://localhost:3000']) {
      const response = await preflight(event(origin, null));
      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('');
      expect(response.headers).toMatchObject({
        Vary: 'Origin', 'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'authorization,content-type',
        'Access-Control-Max-Age': '3600',
      });
    }
    for (const origin of ['https://untrusted.example', undefined]) {
      expect((await preflight(event(origin))).headers).not.toHaveProperty('Access-Control-Allow-Origin');
    }
  });
  it('adds CORS on successful and failed handler responses, including lowercase headers', async () => {
    vi.stubEnv('ALLOWED_ORIGINS', undefined);
    const input = event();
    input.headers = { origin: 'http://localhost:3000' };
    expect((await roster(input)).headers['Access-Control-Allow-Origin']).toBe('http://localhost:3000');
    input.body = '{';
    const invalid = await snacks(input);
    expect(invalid.statusCode).toBe(400);
    expect(invalid.headers['Access-Control-Allow-Origin']).toBe('http://localhost:3000');
  });
  it('supports an explicitly configured wildcard origin', async () => {
    vi.stubEnv('ALLOWED_ORIGINS', '*');
    expect((await preflight(event('https://river.example'))).headers['Access-Control-Allow-Origin']).toBe('*');
  });
});
