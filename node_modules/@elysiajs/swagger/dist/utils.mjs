// src/utils.ts
import { replaceSchemaType, t } from "elysia";

// node_modules/@sinclair/typebox/build/esm/type/symbols/symbols.mjs
var TransformKind = Symbol.for("TypeBox.Transform");
var ReadonlyKind = Symbol.for("TypeBox.Readonly");
var OptionalKind = Symbol.for("TypeBox.Optional");
var Hint = Symbol.for("TypeBox.Hint");
var Kind = Symbol.for("TypeBox.Kind");

// src/utils.ts
var toOpenAPIPath = (path) => path.split("/").map((x) => {
  if (x.startsWith(":")) {
    x = x.slice(1, x.length);
    if (x.endsWith("?")) x = x.slice(0, -1);
    x = `{${x}}`;
  }
  return x;
}).join("/");
var mapProperties = (name, schema, models) => {
  if (schema === void 0) return [];
  if (typeof schema === "string")
    if (schema in models) schema = models[schema];
    else throw new Error(`Can't find model ${schema}`);
  return Object.entries(schema?.properties ?? []).map(([key, value]) => {
    const {
      type: valueType = void 0,
      description,
      examples,
      ...schemaKeywords
    } = value;
    return {
      // @ts-ignore
      description,
      examples,
      schema: { type: valueType, ...schemaKeywords },
      in: name,
      name: key,
      // @ts-ignore
      required: schema.required?.includes(key) ?? false
    };
  });
};
var mapTypesResponse = (types, schema) => {
  if (typeof schema === "object" && ["void", "undefined", "null"].includes(schema.type))
    return;
  const responses = {};
  for (const type of types) {
    responses[type] = {
      schema: typeof schema === "string" ? {
        $ref: `#/components/schemas/${schema}`
      } : "$ref" in schema && Kind in schema && schema[Kind] === "Ref" ? {
        ...schema,
        $ref: `#/components/schemas/${schema.$ref}`
      } : replaceSchemaType(
        { ...schema },
        {
          from: t.Ref(""),
          // @ts-expect-error
          to: ({ $ref, ...options }) => {
            if (!$ref.startsWith(
              "#/components/schemas/"
            ))
              return t.Ref(
                `#/components/schemas/${$ref}`,
                options
              );
            return t.Ref($ref, options);
          }
        }
      )
    };
  }
  return responses;
};
var capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);
var generateOperationId = (method, paths) => {
  let operationId = method.toLowerCase();
  if (paths === "/") return operationId + "Index";
  for (const path of paths.split("/")) {
    if (path.charCodeAt(0) === 123) {
      operationId += "By" + capitalize(path.slice(1, -1));
    } else {
      operationId += capitalize(path);
    }
  }
  return operationId;
};
var cloneHook = (hook) => {
  if (!hook) return;
  if (typeof hook === "string") return hook;
  if (Array.isArray(hook)) return [...hook];
  return { ...hook };
};
var registerSchemaPath = ({
  schema,
  path,
  method,
  hook,
  models
}) => {
  hook = cloneHook(hook);
  if (hook.parse && !Array.isArray(hook.parse)) hook.parse = [hook.parse];
  let contentType = hook.parse?.map((x) => {
    switch (typeof x) {
      case "string":
        return x;
      case "object":
        if (x && typeof x?.fn !== "string")
          return;
        switch (x?.fn) {
          case "json":
          case "application/json":
            return "application/json";
          case "text":
          case "text/plain":
            return "text/plain";
          case "urlencoded":
          case "application/x-www-form-urlencoded":
            return "application/x-www-form-urlencoded";
          case "arrayBuffer":
          case "application/octet-stream":
            return "application/octet-stream";
          case "formdata":
          case "multipart/form-data":
            return "multipart/form-data";
        }
    }
  }).filter((x) => x !== void 0);
  if (!contentType || contentType.length === 0)
    contentType = ["application/json", "multipart/form-data", "text/plain"];
  path = toOpenAPIPath(path);
  const contentTypes = typeof contentType === "string" ? [contentType] : contentType ?? ["application/json"];
  const bodySchema = cloneHook(hook?.body);
  const paramsSchema = cloneHook(hook?.params);
  const headerSchema = cloneHook(hook?.headers);
  const querySchema = cloneHook(hook?.query);
  let responseSchema = cloneHook(hook?.response);
  if (typeof responseSchema === "object") {
    if (Kind in responseSchema) {
      const {
        type,
        properties,
        required,
        additionalProperties,
        patternProperties,
        $ref,
        ...rest
      } = responseSchema;
      responseSchema = {
        "200": {
          ...rest,
          description: rest.description,
          content: mapTypesResponse(
            contentTypes,
            type === "object" || type === "array" ? {
              type,
              properties,
              patternProperties,
              items: responseSchema.items,
              required
            } : responseSchema
          )
        }
      };
    } else {
      Object.entries(responseSchema).forEach(
        ([key, value]) => {
          if (typeof value === "string") {
            if (!models[value]) return;
            const {
              type,
              properties,
              required,
              additionalProperties: _1,
              patternProperties: _2,
              ...rest
            } = models[value];
            responseSchema[key] = {
              ...rest,
              description: rest.description,
              content: mapTypesResponse(contentTypes, value)
            };
          } else {
            const {
              type,
              properties,
              required,
              additionalProperties,
              patternProperties,
              ...rest
            } = value;
            responseSchema[key] = {
              ...rest,
              description: rest.description,
              content: mapTypesResponse(
                contentTypes,
                type === "object" || type === "array" ? {
                  type,
                  properties,
                  patternProperties,
                  items: value.items,
                  required
                } : value
              )
            };
          }
        }
      );
    }
  } else if (typeof responseSchema === "string") {
    if (!(responseSchema in models)) return;
    const {
      type,
      properties,
      required,
      $ref,
      additionalProperties: _1,
      patternProperties: _2,
      ...rest
    } = models[responseSchema];
    responseSchema = {
      // @ts-ignore
      "200": {
        ...rest,
        content: mapTypesResponse(contentTypes, responseSchema)
      }
    };
  }
  const parameters = [
    ...mapProperties("header", headerSchema, models),
    ...mapProperties("path", paramsSchema, models),
    ...mapProperties("query", querySchema, models)
  ];
  schema[path] = {
    ...schema[path] ? schema[path] : {},
    [method.toLowerCase()]: {
      ...headerSchema || paramsSchema || querySchema || bodySchema ? { parameters } : {},
      ...responseSchema ? {
        responses: responseSchema
      } : {},
      operationId: hook?.detail?.operationId ?? generateOperationId(method, path),
      ...hook?.detail,
      ...bodySchema ? {
        requestBody: {
          required: true,
          content: mapTypesResponse(
            contentTypes,
            typeof bodySchema === "string" ? {
              $ref: `#/components/schemas/${bodySchema}`
            } : bodySchema
          )
        }
      } : null
    }
  };
};
var filterPaths = (paths, {
  excludeStaticFile = true,
  exclude = []
}) => {
  const newPaths = {};
  for (const [key, value] of Object.entries(paths))
    if (!exclude.some((x) => {
      if (typeof x === "string") return key === x;
      return x.test(key);
    }) && !key.includes("*") && (excludeStaticFile ? !key.includes(".") : true)) {
      Object.keys(value).forEach((method) => {
        const schema = value[method];
        if (key.includes("{")) {
          if (!schema.parameters) schema.parameters = [];
          schema.parameters = [
            ...key.split("/").filter(
              (x) => x.startsWith("{") && !schema.parameters.find(
                (params) => params.in === "path" && params.name === x.slice(1, x.length - 1)
              )
            ).map((x) => ({
              schema: { type: "string" },
              in: "path",
              name: x.slice(1, x.length - 1),
              required: true
            })),
            ...schema.parameters
          ];
        }
        if (!schema.responses)
          schema.responses = {
            200: {}
          };
      });
      newPaths[key] = value;
    }
  return newPaths;
};
export {
  capitalize,
  filterPaths,
  generateOperationId,
  mapProperties,
  registerSchemaPath,
  toOpenAPIPath
};
