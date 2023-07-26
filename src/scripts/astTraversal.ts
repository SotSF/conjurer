import { context } from "@react-three/fiber";
import ts from "typescript";

// maybe use prettier later?
// import prettier from "pret";

/*

- program takes an argument for name of new pattern, in PascalCase, eg MyPattern
- program writes the required files for the new pattern
  - add ./src/patterns/shaders/myPattern.frag
  - add ./src/patterns/shaders/MyPattern.ts
  - edit ./src/patterns/patterns.ts

*/

// hardcode our input file
const filePath = "./src/patterns/patterns.ts";

// create a program instance, which is a collection of source files
// in this case we only have one source file
const program = ts.createProgram([filePath], {});

// pull off the typechecker instance from our program
const checker = program.getTypeChecker();

// get our models.ts source file AST
const source = program.getSourceFile(filePath);

// create TS printer instance which gives us utilities to pretty print our final AST
const printer = ts.createPrinter();

// helper to give us Node string type given kind
const syntaxToKind = (kind: ts.Node["kind"]) => {
  return ts.SyntaxKind[kind];
};

const transformer: ts.TransformerFactory<ts.Node> = (context) => {
  return (sourceFile) => {
    const f = ts.factory;

    let newImportInserted = false;

    // keep a Set of imported identifiers
    // as we iterate over identifiers, if we found a dupe,
    //  then abort mission due to duplicate pattern name.
    //  say "hey choose a different name ya dunce"
    //  os exit 1

    const patternName = "MyPattern";
    const newIdentifier = f.createIdentifier(patternName);

    const newImport = f.createImportDeclaration(
      [],
      f.createImportClause(
        false,
        undefined,
        f.createNamedImports([
          f.createImportSpecifier(false, undefined, newIdentifier),
        ])
      ),
      f.createStringLiteral(`@/src/patterns/${patternName}`)
    );

    const importIdentifiers = new Set([patternName]);

    const visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
      if (ts.isImportDeclaration(node)) {
        // TODO: maybe refactor this.
        const v = (importChild: ts.Node): ts.VisitResult<ts.Node> => {
          if (ts.isIdentifier(importChild)) {
            if (importIdentifiers.has(importChild.text)) {
              console.error(
                `ERROR: hey choose a different name ya dunce (${importChild.text}), exiting!`
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
              let insertedIdentifier = false;
              return ts.visitEachChild(
                variableChild,
                (ident: ts.Node) => {
                  if (!insertedIdentifier) {
                    insertedIdentifier = true;
                    return [newIdentifier, ident];
                  }
                  return ident;
                },
                context
              );
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

// const findNode: (node: ts.)

const result = ts.transform(source!, [transformer]);
const s = result.transformed[0];

console.log(printer.printNode(ts.EmitHint.Unspecified, s, source!));

// ts.visitNode(source!, (node) => {
//   console.log("text", node.text);
//   return node;
// });
