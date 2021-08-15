#!/usr/bin/env node
import 'source-map-support/register';
import { App } from '@aws-cdk/core';
import {ProxyLambda} from "./rest-lambda-proxy-stack";

const app = new App();
new ProxyLambda(app, 'RestAPI-ProxyLambda', {});
