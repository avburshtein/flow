/**
 * ClipperQA Babel plugin — implementation when enabled via env.
 * - Injects `data-qa-file` / `data-qa-component` on JSX (except any source under `plugins/clipper-qa/`).
 * - Injects `import { ClipperQA }` + `<ClipperQA />` into recognized app entry files (`layout` / `App`).
 * Consumed via `index.js` (re-export) from `.babelrc` or Vite Babel config.
 *
 * Enable with `NEXT_PUBLIC_CLIPPER_QA_ENABLED=true` or `VITE_CLIPPER_QA_ENABLED=true`
 * (same meaning as in `clipperQaEnv.ts` / layout).
 */
const path = require("path");

const CLIPPER_DIR_MARKER = "plugins/clipper-qa/";

function isClipperQaEnabled() {
  const next = String(process.env.NEXT_PUBLIC_CLIPPER_QA_ENABLED ?? "").trim();
  const vite = String(process.env.VITE_CLIPPER_QA_ENABLED ?? "").trim();
  return next === "true" || vite === "true";
}

function normalizeFile(filename) {
  return (filename || "").replace(/\\/g, "/");
}

/** Skip data-qa injection for the whole plugin package (widget + subcomponents). */
function isClipperPluginSourceFile(filename) {
  return normalizeFile(filename).includes(CLIPPER_DIR_MARKER);
}

function isEntryFile(filename) {
  const n = normalizeFile(filename);
  return (
    /(^|\/)src\/app\/layout\.(tsx|jsx)$/.test(n) ||
    /(^|\/)app\/layout\.(tsx|jsx)$/.test(n) ||
    /(^|\/)src\/App\.(tsx|jsx)$/.test(n)
  );
}

function getComponentName(jsxPath) {
  const parent = jsxPath.findParent(
    (p) =>
      p.isFunctionDeclaration() ||
      p.isVariableDeclarator() ||
      p.isClassDeclaration(),
  );
  if (!parent) return null;

  if (parent.isVariableDeclarator()) return parent.node.id.name;
  if (parent.isFunctionDeclaration() || parent.isClassDeclaration()) {
    return parent.node.id ? parent.node.id.name : "Anonymous";
  }
  return null;
}

function hasClipperImport(programPath, t) {
  let found = false;
  programPath.traverse({
    ImportDeclaration(p) {
      const v = p.node.source.value;
      if (
        v.includes("clipper-qa/ClipperQA") ||
        v.endsWith("clipper-qa/ClipperQA")
      ) {
        found = true;
        p.stop();
      }
    },
    CallExpression(p) {
      if (!p.get("callee").isIdentifier({ name: "require" })) return;
      const a0 = p.node.arguments[0];
      if (
        t.isStringLiteral(a0) &&
        a0.value.replace(/\\/g, "/").includes("clipper-qa/ClipperQA")
      ) {
        found = true;
        p.stop();
      }
    },
  });
  return found;
}

function hasClipperJsx(programPath, t) {
  let found = false;
  programPath.traverse({
    JSXOpeningElement(p) {
      const name = p.node.name;
      if (t.isJSXIdentifier(name) && name.name === "ClipperQA") {
        found = true;
        p.stop();
      }
    },
  });
  return found;
}

function resolveClipperImportSource(entryFileAbs) {
  const clipperAbs = path.join(
    process.cwd(),
    "plugins",
    "clipper-qa",
    "ClipperQA.tsx",
  );
  let rel = path.relative(path.dirname(entryFileAbs), clipperAbs);
  rel = rel.replace(/\\/g, "/");
  if (!rel.startsWith(".")) {
    rel = `./${rel}`;
  }
  return rel.replace(/\.tsx$/i, "");
}

function insertImportAfterLastImport(programPath, t, importSource) {
  const body = programPath.node.body;
  let lastImport = -1;
  for (let i = 0; i < body.length; i++) {
    if (t.isImportDeclaration(body[i])) lastImport = i;
  }
  const decl = t.importDeclaration(
    [t.importSpecifier(t.identifier("ClipperQA"), t.identifier("ClipperQA"))],
    t.stringLiteral(importSource),
  );
  body.splice(lastImport + 1, 0, decl);
}

function unwrapJsxNode(node, t) {
  if (t.isParenthesizedExpression(node)) {
    return unwrapJsxNode(node.expression, t);
  }
  return node;
}

function findDefaultExportRootJsx(programPath, t) {
  let root = null;

  programPath.traverse({
    ExportDefaultDeclaration(exportPath) {
      const declPath = exportPath.get("declaration");

      const tryFromFunction = (fnPath) => {
        const bodyPath = fnPath.get("body");
        if (bodyPath.isBlockStatement()) {
          for (const stmt of bodyPath.node.body) {
            if (!t.isReturnStatement(stmt) || !stmt.argument) continue;
            const arg = unwrapJsxNode(stmt.argument, t);
            if (t.isJSXElement(arg) || t.isJSXFragment(arg)) {
              root = arg;
              return;
            }
          }
        } else {
          const arg = unwrapJsxNode(bodyPath.node, t);
          if (t.isJSXElement(arg) || t.isJSXFragment(arg)) {
            root = arg;
          }
        }
      };

      if (declPath.isFunctionDeclaration()) {
        tryFromFunction(declPath);
      } else if (
        declPath.isArrowFunctionExpression() ||
        declPath.isFunctionExpression()
      ) {
        tryFromFunction(declPath);
      } else if (declPath.isIdentifier()) {
        const name = declPath.node.name;
        const binding = exportPath.scope.getBinding(name);
        if (binding && binding.path.isVariableDeclarator()) {
          const initPath = binding.path.get("init");
          if (
            initPath.isArrowFunctionExpression() ||
            initPath.isFunctionExpression()
          ) {
            tryFromFunction(initPath);
          }
        }
      }

      exportPath.stop();
    },
  });

  return root;
}

function buildClipperElement(t) {
  return t.jsxElement(
    t.jsxOpeningElement(t.jsxIdentifier("ClipperQA"), [], true),
    null,
    [],
    true,
  );
}

function appendClipperAsLastChild(targetJsxElement, t) {
  const clipper = buildClipperElement(t);
  targetJsxElement.children.push(
    t.jsxText("\n        "),
    clipper,
    t.jsxText("\n      "),
  );
}

function injectClipperComponent(programPath, t) {
  const root = findDefaultExportRootJsx(programPath, t);
  if (!root) return false;

  if (t.isJSXFragment(root)) {
    appendClipperAsLastChild(root, t);
    return true;
  }

  if (!t.isJSXElement(root)) return false;

  const openingName = root.openingElement.name;
  let target = root;

  if (
    t.isJSXIdentifier(openingName) &&
    openingName.name === "html"
  ) {
    const bodyChild = root.children.find(
      (c) =>
        t.isJSXElement(c) &&
        t.isJSXIdentifier(c.openingElement.name) &&
        c.openingElement.name.name === "body",
    );
    if (!bodyChild) return false;
    target = bodyChild;
  }

  appendClipperAsLastChild(target, t);
  return true;
}

function injectEntry(programPath, state, t) {
  const filename = state.file.opts.filename;
  if (!filename) return;
  if (hasClipperImport(programPath, t) || hasClipperJsx(programPath, t)) {
    return;
  }
  const ok = injectClipperComponent(programPath, t);
  if (!ok) return;
  const importSource = resolveClipperImportSource(filename);
  insertImportAfterLastImport(programPath, t, importSource);
}

module.exports = function clipperQaBabelPlugin(babel) {
  const { types: t } = babel;

  return {
    name: "clipper-qa",
    visitor: {
      JSXOpeningElement(elementPath, state) {
        if (!isClipperQaEnabled()) return;
        const filename = state.file.opts.filename || "";
        if (isClipperPluginSourceFile(filename)) return;

        const componentName = getComponentName(elementPath);
        if (!componentName) return;

        const hasQaAttr = elementPath.node.attributes.some(
          (attr) =>
            t.isJSXAttribute(attr) &&
            t.isJSXIdentifier(attr.name) &&
            attr.name.name === "data-qa-component",
        );
        if (hasQaAttr) return;

        const filePath = filename;
        const relativePath = path
          .relative(process.cwd(), filePath)
          .replace(/\\/g, "/");

        elementPath.node.attributes.push(
          t.jsxAttribute(
            t.jsxIdentifier("data-qa-component"),
            t.stringLiteral(componentName),
          ),
          t.jsxAttribute(
            t.jsxIdentifier("data-qa-file"),
            t.stringLiteral(relativePath),
          ),
        );
      },

      /**
       * Use Program.enter so injection runs before other plugins (e.g. next/babel)
       * rewrite away `export default` in the same pass. Plugin order: root `plugins`
       * run before preset-expanded plugins.
       */
      Program: {
        enter(programPath, state) {
          if (!isClipperQaEnabled()) return;
          const filename = state.file.opts.filename || "";
          if (!isEntryFile(filename)) return;
          injectEntry(programPath, state, t);
        },
      },
    },
  };
};
