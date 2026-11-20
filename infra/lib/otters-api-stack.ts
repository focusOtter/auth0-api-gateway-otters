import { CfnOutput, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CorsHttpMethod, HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpJwtAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import path from 'node:path';

export class OttersApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const config = (key: string): string => String(process.env[key] ?? this.node.tryGetContext(key) ?? '').trim();
    const domain = config('AUTH0_DOMAIN');
    const audience = config('AUTH0_AUDIENCE');
    if (!domain || !audience) throw new Error('AUTH0_DOMAIN and AUTH0_AUDIENCE are required (environment variables or CDK -c context).');
    if (domain.includes('://') || domain.includes('/')) throw new Error('AUTH0_DOMAIN must be a hostname, without https:// or a trailing slash.');
    const origins = (config('ALLOWED_ORIGINS') || 'http://localhost:3000').split(',').map(origin => origin.trim()).filter(Boolean);
    const api = new HttpApi(this, 'OttersApi', {
      corsPreflight: {
        allowOrigins: origins,
        allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.POST, CorsHttpMethod.OPTIONS],
        allowHeaders: ['authorization', 'content-type'],
        maxAge: Duration.hours(1),
      },
    });
    const authorizer = new HttpJwtAuthorizer('Auth0', `https://${domain}/`, { jwtAudience: [audience] });
    const integration = (name: string, file: string) => new HttpLambdaIntegration(name, new NodejsFunction(this, `${name}Handler`, {
      runtime: Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../lambda', `${file}.ts`),
      handler: 'handler',
      bundling: { minify: true, sourceMap: true },
    }));
    api.addRoutes({ path: '/otters/facts', methods: [HttpMethod.GET], integration: integration('Facts', 'facts') });
    api.addRoutes({ path: '/otters', methods: [HttpMethod.GET], integration: integration('Roster', 'roster'), authorizer });
    api.addRoutes({ path: '/otters/{id}/snacks', methods: [HttpMethod.POST], integration: integration('Snacks', 'snacks'), authorizer, authorizationScopes: ['feed:otters'] });
    new CfnOutput(this, 'ApiUrl', { value: api.apiEndpoint });
  }
}
