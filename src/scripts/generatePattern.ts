import ts from "typescript";

const patternArg = process.argv[2];

if (process.argv.length != 3) {
  console.error("Specify exactly 1 PatternName as an argument");
  process.exit(1);
}

if (!patternArg.match(/^[a-zA-Z]+$/)) {
  console.error("Please only use alphabet characters ([a-zA-Z]). Exiting.");
  process.exit(1);
}

const patternName = `${patternArg
  .charAt(0)
  .toUpperCase()}${patternArg.substring(1)}`;

// hardcode our input file
const patternsTSFile = "src/patterns/patterns.ts";

// create a program instance, which is a collection of source files
// in this case we only have one source file
const program = ts.createProgram([patternsTSFile], {});

// get our models.ts source file AST
const source = program.getSourceFile(patternsTSFile);

// create TS printer instance which gives us utilities to pretty print our final AST
const printer = ts.createPrinter();

const prependChild = (
  node: ts.Node,
  newChild: ts.Node,
  context: ts.TransformationContext,
) => {
  let childCount = 0;

  return ts.visitEachChild(
    node,
    (n) => {
      if (childCount++ == 0) {
        return [newChild, n];
      }
      return n;
    },
    context,
  );
};

const transformer: ts.TransformerFactory<ts.Node> = (context) => {
  return (sourceFile) => {
    const f = ts.factory;

    let newImportInserted = false;

    const newIdentifier = f.createIdentifier(patternName);

    const newImport = f.createImportDeclaration(
      [],
      f.createImportClause(
        false,
        undefined,
        f.createNamedImports([
          f.createImportSpecifier(false, undefined, newIdentifier),
        ]),
      ),
      f.createStringLiteral(`@/src/patterns/${patternName}`),
    );

    const importIdentifiers = new Set([patternName]);

    const visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
      if (ts.isImportDeclaration(node)) {
        const v = (importChild: ts.Node): ts.VisitResult<ts.Node> => {
          if (ts.isIdentifier(importChild)) {
            if (importIdentifiers.has(importChild.text)) {
              console.error(
                `ERROR: hey choose a different name ya dunce (${importChild.text}), exiting!`,
              );
              process.exit(1);
            }
            importIdentifiers.add(importChild.text);
          }
          return ts.visitEachChild(importChild, v, context);
        };
        ts.visitEachChild(node, v, context);

        if (!newImportInserted) {
          newImportInserted = true;
          return [newImport, node];
        }
        return node;
      }
      if (ts.isVariableDeclaration(node)) {
        let isPatternFactoriesDeclaration = false;
        const v = (variableChild: ts.Node): ts.VisitResult<ts.Node> => {
          if (ts.isIdentifier(variableChild)) {
            if (variableChild.text == "patternFactories") {
              isPatternFactoriesDeclaration = true;
            }
          }
          if (isPatternFactoriesDeclaration) {
            if (ts.isArrayLiteralExpression(variableChild)) {
              return prependChild(variableChild, newIdentifier, context);
            }
          }
          return ts.visitEachChild(variableChild, v, context);
        };
        return ts.visitEachChild(node, v, context);
      }
      return ts.visitEachChild(node, visitor, context);
    };
    return ts.visitNode(sourceFile, visitor);
  };
};

const result = ts.transform(source!, [transformer]);
const updatedSource = result.transformed[0];

import fs from "fs";

const tsPath = "src/patterns/ExamplePattern.ts";
const newTSPath = `src/patterns/${patternName}.ts`;

const camelCase = (s: string) =>
  `${s.charAt(0).toLowerCase()}${s.substring(1)}`;

const shaderPath = "src/patterns/shaders/examplePattern.frag";
const newShaderPath = `src/patterns/shaders/${camelCase(patternName)}.frag`;

const newTS = fs
  .readFileSync(tsPath)
  .toString()
  .replace(/ExamplePattern/g, patternName)
  .replace(/examplePattern/g, camelCase(patternName));

console.log("writing", newTSPath);
fs.writeFileSync(newTSPath, newTS);

console.log("writing", newShaderPath);
fs.copyFileSync(shaderPath, newShaderPath);

console.log("writing", patternsTSFile);
fs.writeFileSync(
  patternsTSFile,
  printer.printNode(ts.EmitHint.Unspecified, updatedSource, source!),
);
