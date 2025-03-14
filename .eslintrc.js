module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "google",
    "plugin:deprecation/recommended",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "jsdoc", "deprecation", "only-warn"],
  parserOptions: {
    ecmaVersion: 2020,
    project: ["./tsconfig.eslint.json"],
    sourceType: "module",
    tsconfigRootDir: __dirname,
    extraFileExtensions: [".js"]
  },
  root: true,
  rules: {
    /**
     * Implementation of EsLint Rules for Typescript code.
     * See https://eslint.org/docs/latest/rules/ for more information.
     */
    "array-bracket-spacing": ["error", "never"],
    "arrow-body-style": ["error", "always"],
    "arrow-parens": ["error", "always"],
    "brace-style": ["error", "1tbs", { "allowSingleLine": false }],
    "camelcase": "error",
    "constructor-super": "error",
    "comma-dangle": ["error", "never"],
    "comma-spacing": ["error", { "before": false, "after": true }],
    "complexity": ["error", 20],
    "curly": "error",
    "default-case": "error",
    "default-case-last": "error",
    "eol-last": ["error", "always"],
    "eqeqeq": ["error", "smart"],
    "guard-for-in": "error",
    "indent": ["error", 2, { "SwitchCase": 1 }],
    "key-spacing": [
      "error",
      {
        "beforeColon": false,
        "afterColon": true
      }
    ],
    "linebreak-style": ["error", "windows"],
    "lines-around-comment": [
      "error",
      {
        "beforeBlockComment": true,
        "allowClassStart": true,
        "afterBlockComment": false,
        "beforeLineComment": true,
        "afterLineComment": false,
        "allowBlockStart": true
      }
    ],
    "lines-between-class-members": [
      "error",
      "always",
      { "exceptAfterSingleLine": true }
    ],
    "max-classes-per-file": "error",
    "max-len": [
      "error",
      {
        "code": 140,
        "comments": 140,
        "ignoreUrls": true
      }
    ],
    "max-lines": [
      "error",
      {
        "max": 1200,
        "skipBlankLines": true,
        "skipComments": true
      }
    ],
    "multiline-comment-style": ["error", "starred-block"],
    "new-cap": "off",
    "new-parens": ["error", "always"],
    "no-caller": "error",
    // "no-console": "error",
    "no-debugger": "error",
    "no-dupe-class-members": "error",
    "no-duplicate-case": "error",
    "no-empty": "error",
    "no-eval": "error",
    "no-fallthrough": "error",
    "no-floating-decimal": "error",
    "no-irregular-whitespace": "error",
    "no-inline-comments": ["error", { "ignorePattern": "eslint.+" }],
    "no-labels": "error",
    "no-magic-numbers": [
      "error",
      {
        "ignore": [0, 1],
        "ignoreArrayIndexes": true
      }
    ],
    "no-multi-spaces": "error",
    "no-multiple-empty-lines": "error",
    "no-new-wrappers": "error",
    "no-redeclare": "error",
    "no-shadow": [
      "error",
      {
        "hoist": "all"
      }
    ],
    "no-throw-literal": "error",
    "no-trailing-spaces": "error",
    "no-undef-init": "off",
    "no-unsafe-finally": "error",
    "no-unused-expressions": "error",
    "no-unused-private-class-members": "error",
    "no-unused-vars": [
      "error",
      {
        "vars": "all",
        "args": "none",
        "ignoreRestSiblings": false,
        "caughtErrors": "all"
      }
    ],
    "no-use-before-define": "error",
    "no-var": "error",
    "no-whitespace-before-property": "error",
    "object-curly-newline": [
      "error",
      {
        "ObjectExpression": { "multiline": true },
        "ObjectPattern": { "multiline": true },
        "ImportDeclaration": { "multiline": true },
        "ExportDeclaration": { "multiline": true }
      }
    ],
    "object-curly-spacing": [
      "error",
      "always",
      {
        "arraysInObjects": true,
        "objectsInObjects": true
      }
    ],
    "one-var": ["error", "never"],
    "one-var-declaration-per-line": ["error", "always"],
    "padding-line-between-statements": [
      "error",
      {
        "blankLine": "always",
        "prev": "*",
        "next": "return"
      }
    ],
    "prefer-const": "error",
    "quote-props": ["error", "as-needed"],
    "quotes": ["error", "single"],
    "radix": "off",
    "require-jsdoc": "off",
    "semi": ["error", "always"],
    "sort-keys": [
      "error",
      "asc",
      {
        "caseSensitive": true,
        "natural": true,
        "minKeys": 2,
        "allowLineSeparatedGroups": false
      }
    ],
    "sort-imports": [
      "error",
      {
        "ignoreCase": true,
        "ignoreDeclarationSort": false,
        "ignoreMemberSort": false,
        "memberSyntaxSortOrder": ["none", "all", "multiple", "single"],
        "allowSeparatedGroups": true
      }
    ],
    "space-in-parens": ["error", "never"],
    "space-infix-ops": "error",
    "spaced-comment": [
      "error",
      "always",
      {
        "line": {
          "markers": [],
          "exceptions": []
        },
        "block": {
          "markers": [],
          "exceptions": [],
          "balanced": true
        }
      }
    ],
    "valid-jsdoc": "off",
    "valid-typeof": "error",
    /**
     * Implementation of typescript-eslint rules.
     * See https://typescript-eslint.io/rules for more information about rules.
     */
    "@typescript-eslint/adjacent-overload-signatures": "error",
    "@typescript-eslint/array-type": "off",
    "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
    "@typescript-eslint/explicit-member-accessibility": [
      "error",
      {
        "accessibility": "explicit",
        "overrides": [
          {
            "files": ['mongoService.ts'],
            "rules": {
              'no-use-before-define': 'off',
              '@typescript-eslint/no-use-before-define': 'off'
            }
          },
          {
            "accessibility": "explicit",
            "overrides": {
              "accessors": "off",
              "constructors": "no-public",
              "methods": "explicit",
              "properties": "explicit",
              "parameterProperties": "explicit"
            }
          }
        ]
      }
    ],
    "@typescript-eslint/member-ordering": [
      "error",
      {
        "default": {
          "memberTypes": [
            // Index signature
            "signature",

            // Fields
            "public-static-field",
            "protected-static-field",
            "private-static-field",

            "public-decorated-field",
            "protected-decorated-field",
            "private-decorated-field",

            "public-instance-field",
            "protected-instance-field",
            "private-instance-field",

            "public-abstract-field",
            "protected-abstract-field",

            "public-field",
            "protected-field",
            "private-field",

            "static-field",
            "instance-field",
            "abstract-field",

            "decorated-field",

            "field",

            // Static initialization
            "static-initialization",

            // Constructors
            "public-constructor",
            "protected-constructor",
            "private-constructor",

            "constructor",

            // Getters and Setters
            "public-static-get",
            "public-static-set",
            "protected-static-get",
            "protected-static-set",
            "private-static-get",
            "private-static-set",

            "public-decorated-get",
            "public-decorated-set",
            "protected-decorated-get",
            "protected-decorated-set",
            "private-decorated-get",
            "private-decorated-set",

            "public-instance-get",
            "public-instance-set",
            "protected-instance-get",
            "protected-instance-set",
            "private-instance-get",
            "private-instance-set",

            "public-abstract-get",
            "public-abstract-set",
            "protected-abstract-get",
            "protected-abstract-set",

            "public-get",
            "public-set",
            "protected-get",
            "protected-set",
            "private-get",
            "private-set",

            "static-get",
            "static-set",
            "instance-get",
            "instance-set",
            "abstract-get",
            "abstract-set",

            "decorated-get",
            "decorated-set",

            "get",
            "set",

            // Methods
            "public-static-method",
            "protected-static-method",
            "private-static-method",

            "public-decorated-method",
            "protected-decorated-method",
            "private-decorated-method",

            "public-instance-method",
            "protected-instance-method",
            "private-instance-method",

            "public-abstract-method",
            "protected-abstract-method",

            "public-method",
            "protected-method",
            "private-method",

            "static-method",
            "instance-method",
            "abstract-method",

            "decorated-method",

            "method"
          ],
          "order": "alphabetically"
        }
      }
    ],
    "@typescript-eslint/method-signature-style": ["error", "method"],
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "default",
        "format": ["camelCase"]
      },
      {
        "selector": [
          "class",
          "enum",
          "typeAlias",
          "typeParameter"
        ],
        "format": ["StrictPascalCase"]
      },
      {
        "selector": ["classProperty", "variable"],
        "modifiers": ["private"],
        "format": ["camelCase"],
        "leadingUnderscore": "require"
      },
      {
        "selector": ["classProperty", "variable"],
        "modifiers": ["protected"],
        "format": ["camelCase"],
        "leadingUnderscore": "require"
      },
      {
        "selector": "variable",
        "modifiers": ["const", "global"],
        "format": ["camelCase"],
        "leadingUnderscore": "require",
        "filter": {
          "regex": "^_.+",
          "match": true
        }
      },
      {
        "selector": "variable",
        "modifiers": ["const", "global"],
        "format": ["UPPER_CASE"],
        "leadingUnderscore": "forbid",
        "filter": {
          "regex": "[^(?!_).+]",
          "match": true
        }
      },
      {
        "selector": ["parameterProperty"],
        "format": ["camelCase"],
        "leadingUnderscore": "allow"
      },
      {
        "selector": "interface",
        "format": ["PascalCase"]
      },
      {
        "selector": "objectLiteralProperty",
        "format": ["UPPER_CASE", "camelCase"],
        "leadingUnderscore": "allow"
      },
      {
        "selector": ["classProperty", "variable"],
        "modifiers": ["static", "readonly"],
        "format": ["UPPER_CASE"]
      },
      {
        "selector": ["property", "variable"],
        "types": ["boolean"],
        "format": ["PascalCase"],
        "prefix": ["is", "should", "has", "can", "did", "will"]
      },
      {
        "selector": [
          "classProperty",
          "objectLiteralProperty",
          "typeProperty",
          "classMethod",
          "objectLiteralMethod",
          "typeMethod",
          "accessor",
          "enumMember"
        ],
        "format": null,
        "modifiers": ["requiresQuotes"]
      }
    ],
    "@typescript-eslint/no-empty-interface": "error",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-inferrable-types": "error",
    "@typescript-eslint/no-namespace": "error",
    "@typescript-eslint/no-misused-new": "error",
    "@typescript-eslint/no-var-requires": "error",
    "@typescript-eslint/prefer-for-of": "error",
    "@typescript-eslint/prefer-function-type": "error",
    "@typescript-eslint/prefer-namespace-keyword": "error",
    "@typescript-eslint/typedef": [
      "error",
      {
        "arrayDestructuring": false,
        "arrowParameter": true,
        "memberVariableDeclaration": false,
        "objectDestructuring": false,
        "parameter": true,
        "propertyDeclaration": true,
        "variableDeclaration": false,
        "variableDeclarationIgnoreFunction": false
      }
    ],
    "@typescript-eslint/unified-signatures": "error",

    /**
     * Implementation of JSDOC plugin to add docs rules.
     * See https://github.com/gajus/eslint-plugin-jsdoc for more information.
     */
    "jsdoc/check-access": "error",
    "jsdoc/check-alignment": "error",
    "jsdoc/check-indentation": "error",
    "jsdoc/check-line-alignment": "error",
    "jsdoc/check-param-names": "error",
    "jsdoc/check-property-names": "error",
    "jsdoc/check-syntax": "error",
    "jsdoc/check-tag-names": "error",
    "jsdoc/check-types": "error",
    "jsdoc/check-values": "error",
    "jsdoc/empty-tags": "error",
    "jsdoc/multiline-blocks": "error",
    "jsdoc/no-bad-blocks": "error",
    "jsdoc/no-multi-asterisks": "error",
    "jsdoc/no-undefined-types": "error",
    "jsdoc/require-asterisk-prefix": "error",
    "jsdoc/require-description": ["error", { "descriptionStyle": "tag" }],
    "jsdoc/require-description-complete-sentence": "error",
    "jsdoc/require-hyphen-before-param-description": "error",
    "jsdoc/require-jsdoc": [
      "error",
      {
        "checkGetters": false,
        "checkSetters": false,
        "contexts": ["TSInterfaceDeclaration", "TSMethodSignature"],
        "enableFixer": false,
        "require": {
          "ClassDeclaration": true,
          "ClassExpression": true,
          "FunctionDeclaration": true,
          "MethodDefinition": true
        }
      }
    ],
    "jsdoc/require-param": "error",
    "jsdoc/require-param-description": "error",
    "jsdoc/require-param-name": "error",
    "jsdoc/require-param-type": "error",
    "jsdoc/require-property": "error",
    "jsdoc/require-property-description": "error",
    "jsdoc/require-property-name": "error",
    "jsdoc/require-property-type": "error",
    "jsdoc/require-returns": "error",
    "jsdoc/require-returns-check": "error",
    "jsdoc/require-returns-description": "error",
    "jsdoc/require-returns-type": "error",
    "jsdoc/require-throws": "error",
    "jsdoc/valid-types": "error",

    /**
     * Implementation of deprecation plugin for Typescript code.
     * See https://www.npmjs.com/package/eslint-plugin-deprecation for more information.
     */
    "deprecation/deprecation": "warn"
  }
};
