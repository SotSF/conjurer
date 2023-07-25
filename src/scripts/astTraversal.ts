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

    let done = false;
    const visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
      if (done) return ts.visitEachChild(node, visitor, context);
      // If it is a expression statement,
      if (ts.isImportDeclaration(node)) {
        // Return it twice.
        // Effectively duplicating the statement
        done = true;
        const newnode = f.createImportDeclaration(
          [],
          f.createImportClause(
            false,
            undefined,
            f.createNamedImports([
              f.createImportSpecifier(
                false,
                undefined,
                f.createIdentifier("MyPattern")
              ),
            ])
          ),
          f.createStringLiteral("@/src/patterns/MyPattern")
        );
        f; // f
        return [newnode, node];
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return ts.visitNode(sourceFile, visitor);
  };
};

const result = ts.transform(source!, [transformer]);
const s = result.transformed[0];

console.log(printer.printNode(ts.EmitHint.Unspecified, s, source!));
