import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OttersApiStack } from '../lib/otters-api-stack';

afterEach(() => vi.unstubAllEnvs());
describe('JWT gateway', () => {
  it('requires explicit Auth0 configuration', () => {
    vi.stubEnv('AUTH0_DOMAIN', '');
    vi.stubEnv('AUTH0_AUDIENCE', '');
    expect(() => new OttersApiStack(new App(), 'Missing')).toThrow('AUTH0_DOMAIN and AUTH0_AUDIENCE are required');
  });
  it('configures issuer, audience, CORS and exact route authorization', () => {
    vi.stubEnv('AUTH0_DOMAIN', '');
    vi.stubEnv('AUTH0_AUDIENCE', '');
    // Undefined environment values allow CDK context to supply configuration.
    delete process.env.AUTH0_DOMAIN;
    delete process.env.AUTH0_AUDIENCE;
    vi.stubEnv('ALLOWED_ORIGINS', 'https://river.example, http://localhost:3000');
    const template = Template.fromStack(new OttersApiStack(new App({ context: { AUTH0_DOMAIN: 'otters.auth0.com', AUTH0_AUDIENCE: 'https://otters.example' } }), 'Test'));
    template.resourceCountIs('AWS::ApiGatewayV2::Authorizer', 1);
    template.hasResourceProperties('AWS::ApiGatewayV2::Authorizer', { AuthorizerType: 'JWT', IdentitySource: ['$request.header.Authorization'], JwtConfiguration: { Issuer: 'https://otters.auth0.com/', Audience: ['https://otters.example'] } });
    template.hasResourceProperties('AWS::ApiGatewayV2::Api', { CorsConfiguration: { AllowOrigins: ['https://river.example', 'http://localhost:3000'], AllowMethods: ['GET', 'POST', 'OPTIONS'], AllowHeaders: ['authorization', 'content-type'], MaxAge: 3600 } });
    const routes = Object.values(template.findResources('AWS::ApiGatewayV2::Route')).map(resource => resource.Properties);
    expect(routes).toHaveLength(3);
    expect(routes.find(route => route.RouteKey === 'GET /otters/facts')).toMatchObject({ AuthorizationType: 'NONE' });
    expect(routes.find(route => route.RouteKey === 'GET /otters/facts')).not.toHaveProperty('AuthorizerId');
    expect(routes.find(route => route.RouteKey === 'GET /otters')).toMatchObject({ AuthorizationType: 'JWT', AuthorizerId: expect.any(Object) });
    expect(routes.find(route => route.RouteKey === 'POST /otters/{id}/snacks')).toMatchObject({ AuthorizationType: 'JWT', AuthorizerId: expect.any(Object), AuthorizationScopes: ['feed:otters'] });
  });
});
