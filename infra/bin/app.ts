import { App } from 'aws-cdk-lib';
import { OttersApiStack } from '../lib/otters-api-stack';
import { OttersRestApiStack } from '../lib/otters-rest-api-stack';

const app = new App();
if (app.node.tryGetContext('apiType') === 'rest') {
  new OttersRestApiStack(app, 'OttersRestApi');
} else {
  new OttersApiStack(app, 'OttersApiStack');
}
