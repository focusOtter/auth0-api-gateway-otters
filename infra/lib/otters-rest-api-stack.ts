import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { AuthorizationType, CfnAuthorizer, CfnMethod, LambdaIntegration, ResponseType, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import path from 'node:path';

export class OttersRestApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const config = (key: string): string => String(process.env[key] ?? this.node.tryGetContext(key) ?? '').trim();
    const domain = config('AUTH0_DOMAIN');
    const audience = config('AUTH0_AUDIENCE');
    if (!domain || !audience) throw new Error('AUTH0_DOMAIN and AUTH0_AUDIENCE are required (environment variables or CDK -c context).');
    if (domain.includes('://') || domain.includes('/')) throw new Error('AUTH0_DOMAIN must be a hostname, without https:// or a trailing slash.');
    const origins = (config('ALLOWED_ORIGINS') || 'http://localhost:3000').split(',').map(origin => origin.trim()).filter(Boolean);
    const api = new RestApi(this, 'OttersRestApi');
    const gatewayOrigin = origins.includes('*') ? '*' : origins[0];
    for (const type of [ResponseType.UNAUTHORIZED, ResponseType.ACCESS_DENIED, ResponseType.DEFAULT_4XX, ResponseType.DEFAULT_5XX]) {
      api.addGatewayResponse(type.responseType, {
        type,
        responseHeaders: {
          'Access-Control-Allow-Origin': `'${gatewayOrigin}'`,
          'Access-Control-Allow-Headers': "'authorization,content-type'",
          Vary: "'Origin'",
        },
      });
    }
    const authorizer = new CfnAuthorizer(this, 'Auth0', {
      restApiId: api.restApiId,
      name: 'Auth0',
      type: 'JWT',
      identitySource: 'method.request.header.Authorization',
    });
    // CDK 2.277.0 predates the REST JWT CloudFormation schema.
    authorizer.addPropertyOverride('JwtConfiguration', {
      DefaultAlgorithms: ['RS256'],
      Issuers: [{ Issuer: `https://${domain}/`, Audiences: [audience] }],
    });
    const integration = (name: string, handler: string) => new LambdaIntegration(new NodejsFunction(this, `${name}Handler`, {
      runtime: Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../lambda/rest.ts'),
      handler,
      environment: { ALLOWED_ORIGINS: origins.join(',') },
      bundling: { minify: true, sourceMap: true },
    }));
    const otters = api.root.addResource('otters');
    const facts = otters.addResource('facts');
    const snacks = otters.addResource('{id}').addResource('snacks');
    facts.addMethod('GET', integration('Facts', 'facts'), { authorizationType: AuthorizationType.NONE });
    for (const [resource, verb, name, handler, scopes] of [
      [otters, 'GET', 'Roster', 'roster', []],
      [snacks, 'POST', 'Snacks', 'snacks', ['feed:otters']],
    ] as const) {
      const method = resource.addMethod(verb, integration(name, handler));
      const cfnMethod = method.node.defaultChild as CfnMethod;
      cfnMethod.authorizationType = 'JWT';
      cfnMethod.authorizerId = authorizer.ref;
      if (scopes.length) cfnMethod.authorizationScopes = [...scopes];
      method.node.addDependency(authorizer);
    }
    const preflight = integration('Preflight', 'preflight');
    for (const resource of [otters, facts, snacks]) {
      resource.addMethod('OPTIONS', preflight, { authorizationType: AuthorizationType.NONE });
    }
    new CfnOutput(this, 'ApiUrl', { value: api.url });
  }
}
