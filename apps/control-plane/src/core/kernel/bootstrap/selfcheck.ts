export type SelfcheckFile = {
  path: string;
  content: string;
};

export type SelfcheckInput = {
  files: SelfcheckFile[];
  requiredPaths: string[];
  forbiddenImportPatterns: string[];
};

export type SelfcheckIssue = {
  kind: "missing_required" | "duplicate_error_code" | "forbidden_import";
  detail: string;
  path?: string;
};

export type SelfcheckReport = {
  ok: boolean;
  issues: SelfcheckIssue[];
  summary: {
    filesScanned: number;
    missingRequired: number;
    duplicateErrorCodes: number;
    forbiddenImports: number;
  };
};

function collectErrorCodes(files: SelfcheckFile[]): string[] {
  const codes: string[] = [];
  const rx = /\b(ERR|WARN)_[A-Z0-9_]+\b/g;
  for (const file of files) {
    const matches = file.content.match(rx);
    if (matches) codes.push(...matches);
  }
  return codes;
}

export function kernelSelfcheck(input: SelfcheckInput): SelfcheckReport {
  const issues: SelfcheckIssue[] = [];
  const present = new Set(input.files.map((f) => f.path));

  for (const req of input.requiredPaths) {
    if (!present.has(req)) {
      issues.push({ kind: "missing_required", detail: req });
    }
  }

  const codes = collectErrorCodes(input.files);
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const c of codes) {
    if (seen.has(c)) dupes.add(c);
    else seen.add(c);
  }
  for (const d of dupes) {
    issues.push({ kind: "duplicate_error_code", detail: d });
  }

  for (const file of input.files) {
    for (const pat of input.forbiddenImportPatterns) {
      if (file.content.includes(pat)) {
        issues.push({ kind: "forbidden_import", detail: pat, path: file.path });
      }
    }
  }

  const summary = {
    filesScanned: input.files.length,
    missingRequired: issues.filter((i) => i.kind === "missing_required").length,
    duplicateErrorCodes: issues.filter((i) => i.kind === "duplicate_error_code").length,
    forbiddenImports: issues.filter((i) => i.kind === "forbidden_import").length
  };

  return {
    ok: issues.length === 0,
    issues,
    summary
  };
}
