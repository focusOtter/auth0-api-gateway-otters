import { App } from 'aws-cdk-lib';
import { OttersApiStack } from '../lib/otters-api-stack';

new OttersApiStack(new App(), 'OttersApiStack');
