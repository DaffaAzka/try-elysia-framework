import { Elysia } from 'elysia';
import type { ElysiaSwaggerConfig } from './types';
/**
 * Plugin for [elysia](https://github.com/elysiajs/elysia) that auto-generate Swagger page.
 *
 * @see https://github.com/elysiajs/elysia-swagger
 */
export declare const swagger: <Path extends string = "/swagger">({ provider, scalarVersion, scalarCDN, scalarConfig, documentation, version, excludeStaticFile, path, specPath, exclude, swaggerOptions, theme, autoDarkMode, excludeMethods, excludeTags }?: ElysiaSwaggerConfig<Path>) => Elysia<"", {
    decorator: {};
    store: {};
    derive: {};
    resolve: {};
}, {
    typebox: {};
    error: {};
}, {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
}, {}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
}>;
export type { ElysiaSwaggerConfig };
export default swagger;
